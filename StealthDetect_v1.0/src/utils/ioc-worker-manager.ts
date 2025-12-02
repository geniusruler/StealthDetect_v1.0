/**
 * IoC Worker Manager
 * Manages the Web Worker for off-thread IoC matching
 * Provides a clean async API for matching DNS events, packages, and hashes
 */

import type { DnsRequestEvent } from '../capacitor-plugins/vpn-service/definitions';

// ==================== Types ====================

export interface ThreatInfo {
  indicator: string;
  indicatorType: string;
  appName: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
}

export interface WorkerStats {
  domains: number;
  ips: number;
  packages: number;
  hashes: number;
  initialized: boolean;
}

type MatchCallback = (threat: ThreatInfo | null, error?: string) => void;

// ==================== Worker Manager Class ====================

class IoCWorkerManager {
  private worker: Worker | null = null;
  private pendingCallbacks: Map<string, MatchCallback> = new Map();
  private requestCounter = 0;
  private initialized = false;
  private initPromise: Promise<WorkerStats> | null = null;

  /**
   * Initialize the worker with IoC data
   */
  async initialize(iocData: {
    domains: Map<string, ThreatInfo>;
    ips: Map<string, ThreatInfo>;
    packages: Map<string, ThreatInfo>;
    hashes: Map<string, ThreatInfo>;
  }): Promise<WorkerStats> {
    // If already initializing, return the existing promise
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize(iocData);
    return this.initPromise;
  }

  private async doInitialize(iocData: {
    domains: Map<string, ThreatInfo>;
    ips: Map<string, ThreatInfo>;
    packages: Map<string, ThreatInfo>;
    hashes: Map<string, ThreatInfo>;
  }): Promise<WorkerStats> {
    // Terminate existing worker if any
    if (this.worker) {
      this.worker.terminate();
    }

    // Create new worker
    this.worker = new Worker(
      new URL('../workers/ioc-matcher.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);

    // Send initialization data
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker initialization timeout'));
      }, 30000);

      const initHandler = (event: MessageEvent) => {
        if (event.data.type === 'INIT_COMPLETE') {
          clearTimeout(timeout);
          this.initialized = true;
          console.log('[IoCWorkerManager] Worker initialized:', event.data.payload);
          resolve(event.data.payload);
        }
      };

      this.worker!.addEventListener('message', initHandler, { once: true });

      this.worker!.postMessage({
        type: 'INIT',
        payload: {
          domains: Array.from(iocData.domains),
          ips: Array.from(iocData.ips),
          packages: Array.from(iocData.packages),
          hashes: Array.from(iocData.hashes),
        },
      });
    });
  }

  /**
   * Match a DNS query event against the IoC database
   */
  matchDnsQuery(event: DnsRequestEvent): Promise<ThreatInfo | null> {
    return new Promise((resolve) => {
      if (!this.initialized || !this.worker) {
        resolve(null);
        return;
      }

      const requestId = `dns_${this.requestCounter++}`;
      this.pendingCallbacks.set(requestId, (threat) => resolve(threat));

      this.worker.postMessage({
        type: 'MATCH',
        payload: {
          type: 'DNS_QUERY',
          id: requestId,
          data: {
            domain: event.domain,
            sourceApp: event.sourceApp,
            timestamp: event.timestamp,
          },
        },
      });
    });
  }

  /**
   * Match a package name against the IoC database
   */
  matchPackage(packageName: string): Promise<ThreatInfo | null> {
    return new Promise((resolve) => {
      if (!this.initialized || !this.worker) {
        resolve(null);
        return;
      }

      const requestId = `pkg_${this.requestCounter++}`;
      this.pendingCallbacks.set(requestId, (threat) => resolve(threat));

      this.worker.postMessage({
        type: 'MATCH',
        payload: {
          type: 'PACKAGE',
          id: requestId,
          data: { packageName },
        },
      });
    });
  }

  /**
   * Match multiple packages at once
   */
  async matchPackages(packageNames: string[]): Promise<Map<string, ThreatInfo>> {
    const results = new Map<string, ThreatInfo>();

    const promises = packageNames.map(async (packageName) => {
      const threat = await this.matchPackage(packageName);
      if (threat) {
        results.set(packageName, threat);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Match a file hash against the IoC database
   */
  matchHash(hash: string, algorithm: 'SHA-256' | 'MD5' = 'SHA-256'): Promise<ThreatInfo | null> {
    return new Promise((resolve) => {
      if (!this.initialized || !this.worker) {
        resolve(null);
        return;
      }

      const requestId = `hash_${this.requestCounter++}`;
      this.pendingCallbacks.set(requestId, (threat) => resolve(threat));

      this.worker.postMessage({
        type: 'MATCH',
        payload: {
          type: 'HASH',
          id: requestId,
          data: { hash, algorithm },
        },
      });
    });
  }

  /**
   * Match an IP address against the IoC database
   */
  matchIp(ip: string): Promise<ThreatInfo | null> {
    return new Promise((resolve) => {
      if (!this.initialized || !this.worker) {
        resolve(null);
        return;
      }

      const requestId = `ip_${this.requestCounter++}`;
      this.pendingCallbacks.set(requestId, (threat) => resolve(threat));

      this.worker.postMessage({
        type: 'MATCH',
        payload: {
          type: 'CONNECTION',
          id: requestId,
          data: { destIp: ip, destPort: 0, sourceApp: null },
        },
      });
    });
  }

  /**
   * Get current worker statistics
   */
  getStats(): Promise<WorkerStats> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve({ domains: 0, ips: 0, packages: 0, hashes: 0, initialized: false });
        return;
      }

      const statsHandler = (event: MessageEvent) => {
        if (event.data.type === 'STATS') {
          resolve(event.data.payload);
        }
      };

      this.worker.addEventListener('message', statsHandler, { once: true });
      this.worker.postMessage({ type: 'GET_STATS' });
    });
  }

  /**
   * Update the cache with new IoC data
   */
  updateCache(
    type: 'domains' | 'ips' | 'packages' | 'hashes',
    entries: Map<string, ThreatInfo>
  ): void {
    if (!this.worker) return;

    this.worker.postMessage({
      type: 'UPDATE_CACHE',
      payload: {
        type,
        entries: Array.from(entries),
      },
    });
  }

  /**
   * Check if the worker is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingCallbacks.clear();
    this.initialized = false;
    this.initPromise = null;
    console.log('[IoCWorkerManager] Worker terminated');
  }

  // ==================== Private Methods ====================

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;

    if (type === 'MATCH_RESULT') {
      const callback = this.pendingCallbacks.get(payload.requestId);
      if (callback) {
        callback(payload.threat, payload.error);
        this.pendingCallbacks.delete(payload.requestId);
      }
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('[IoCWorkerManager] Worker error:', error);

    // Reject all pending callbacks
    this.pendingCallbacks.forEach((callback) => {
      callback(null, 'Worker error');
    });
    this.pendingCallbacks.clear();
  }
}

// ==================== Export Singleton ====================

export const iocWorkerManager = new IoCWorkerManager();
