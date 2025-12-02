/**
 * IoC Matcher Web Worker
 * Performs off-main-thread matching of network events against IoC database
 * Uses Map structures for O(1) lookups
 */

// Worker context
declare const self: DedicatedWorkerGlobalScope;

// ==================== Types ====================

interface MatchRequest {
  type: 'DNS_QUERY' | 'CONNECTION' | 'PACKAGE' | 'HASH';
  id: string;
  data: DnsQueryData | ConnectionData | PackageData | HashData;
}

interface DnsQueryData {
  domain: string;
  sourceApp: string | null;
  timestamp: string;
}

interface ConnectionData {
  destIp: string;
  destPort: number;
  sourceApp: string | null;
}

interface PackageData {
  packageName: string;
  permissions?: string[];
}

interface HashData {
  hash: string;
  algorithm: 'SHA-256' | 'MD5';
}

interface MatchResult {
  requestId: string;
  matched: boolean;
  threat: ThreatInfo | null;
  error?: string;
}

interface ThreatInfo {
  indicator: string;
  indicatorType: string;
  appName: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
}

interface InitPayload {
  domains: Array<[string, ThreatInfo]>;
  ips: Array<[string, ThreatInfo]>;
  packages: Array<[string, ThreatInfo]>;
  hashes: Array<[string, ThreatInfo]>;
}

// ==================== IoC Cache ====================

const iocCache = {
  domains: new Map<string, ThreatInfo>(),
  ips: new Map<string, ThreatInfo>(),
  packages: new Map<string, ThreatInfo>(),
  hashes: new Map<string, ThreatInfo>(),
  initialized: false,
};

// ==================== Message Handler ====================

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      handleInit(payload);
      break;
    case 'MATCH':
      handleMatch(payload);
      break;
    case 'UPDATE_CACHE':
      handleCacheUpdate(payload);
      break;
    case 'GET_STATS':
      handleGetStats();
      break;
    case 'CLEAR':
      handleClear();
      break;
    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

// ==================== Handlers ====================

function handleInit(payload: InitPayload): void {
  const startTime = performance.now();

  iocCache.domains = new Map(payload.domains);
  iocCache.ips = new Map(payload.ips);
  iocCache.packages = new Map(payload.packages);
  iocCache.hashes = new Map(payload.hashes);
  iocCache.initialized = true;

  const duration = performance.now() - startTime;

  self.postMessage({
    type: 'INIT_COMPLETE',
    payload: {
      domains: iocCache.domains.size,
      ips: iocCache.ips.size,
      packages: iocCache.packages.size,
      hashes: iocCache.hashes.size,
      durationMs: Math.round(duration),
    },
  });
}

function handleMatch(request: MatchRequest): void {
  if (!iocCache.initialized) {
    self.postMessage({
      type: 'MATCH_RESULT',
      payload: {
        requestId: request.id,
        matched: false,
        threat: null,
        error: 'Cache not initialized',
      } as MatchResult,
    });
    return;
  }

  let result: MatchResult;

  switch (request.type) {
    case 'DNS_QUERY':
      result = matchDnsQuery(request.id, request.data as DnsQueryData);
      break;
    case 'CONNECTION':
      result = matchConnection(request.id, request.data as ConnectionData);
      break;
    case 'PACKAGE':
      result = matchPackage(request.id, request.data as PackageData);
      break;
    case 'HASH':
      result = matchHash(request.id, request.data as HashData);
      break;
    default:
      result = { requestId: request.id, matched: false, threat: null };
  }

  self.postMessage({ type: 'MATCH_RESULT', payload: result });
}

function handleCacheUpdate(payload: {
  type: 'domains' | 'ips' | 'packages' | 'hashes';
  entries: Array<[string, ThreatInfo]>;
}): void {
  const cache = iocCache[payload.type];
  payload.entries.forEach(([key, value]) => cache.set(key, value));

  self.postMessage({
    type: 'CACHE_UPDATED',
    payload: { type: payload.type, count: payload.entries.length },
  });
}

function handleGetStats(): void {
  self.postMessage({
    type: 'STATS',
    payload: {
      domains: iocCache.domains.size,
      ips: iocCache.ips.size,
      packages: iocCache.packages.size,
      hashes: iocCache.hashes.size,
      initialized: iocCache.initialized,
    },
  });
}

function handleClear(): void {
  iocCache.domains.clear();
  iocCache.ips.clear();
  iocCache.packages.clear();
  iocCache.hashes.clear();
  iocCache.initialized = false;

  self.postMessage({ type: 'CLEARED' });
}

// ==================== Match Functions ====================

function matchDnsQuery(id: string, data: DnsQueryData): MatchResult {
  const domain = data.domain.toLowerCase();

  // Exact match first (O(1))
  let threat = iocCache.domains.get(domain);

  // Subdomain match (e.g., "api.evil.com" matches "evil.com")
  if (!threat) {
    // Check parent domains
    const parts = domain.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const parentDomain = parts.slice(i).join('.');
      threat = iocCache.domains.get(parentDomain);
      if (threat) break;
    }
  }

  // Also check IPs if domain looks like an IP
  if (!threat && isIpAddress(domain)) {
    threat = iocCache.ips.get(domain);
  }

  return {
    requestId: id,
    matched: !!threat,
    threat: threat || null,
  };
}

function matchConnection(id: string, data: ConnectionData): MatchResult {
  const threat = iocCache.ips.get(data.destIp);

  return {
    requestId: id,
    matched: !!threat,
    threat: threat || null,
  };
}

function matchPackage(id: string, data: PackageData): MatchResult {
  const threat = iocCache.packages.get(data.packageName);

  return {
    requestId: id,
    matched: !!threat,
    threat: threat || null,
  };
}

function matchHash(id: string, data: HashData): MatchResult {
  const threat = iocCache.hashes.get(data.hash.toLowerCase());

  return {
    requestId: id,
    matched: !!threat,
    threat: threat || null,
  };
}

// ==================== Utilities ====================

function isIpAddress(str: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(str) || ipv6Regex.test(str);
}

// Export empty object to make this a module
export {};
