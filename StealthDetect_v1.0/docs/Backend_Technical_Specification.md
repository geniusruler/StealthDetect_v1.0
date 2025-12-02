# StealthDetect Backend Technical Specification

**Version:** 1.0
**Date:** December 2, 2025
**Document Type:** Technical Specification
**Project:** StealthDetect - Stalkerware Detection Application

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Development Environment](#2-development-environment)
3. [Code Architecture](#3-code-architecture)
4. [Supabase Edge Functions](#4-supabase-edge-functions)
5. [Client-Side Implementation](#5-client-side-implementation)
6. [Capacitor Plugin Development](#6-capacitor-plugin-development)
7. [Database Implementation](#7-database-implementation)
8. [Synchronization Protocol](#8-synchronization-protocol)
9. [Network Monitoring Implementation](#9-network-monitoring-implementation)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Configuration](#11-deployment-configuration)
12. [Monitoring and Logging](#12-monitoring-and-logging)

---

## 1. Introduction

### 1.1 Document Purpose

This technical specification provides detailed implementation guidance for the StealthDetect backend system. It covers code architecture, deployment configurations, integration patterns, and technical decisions.

### 1.2 Target Audience

- Backend Developers
- Mobile Developers
- DevOps Engineers
- Security Engineers
- QA Engineers

### 1.3 Related Documents

| Document | Description |
|----------|-------------|
| Backend Functional Specification | Functional requirements and API contracts |
| README.md | Project setup and quick start |
| IOC_SYSTEM.md | IoC detection system overview |

### 1.4 Technology Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Development runtime |
| Deno | Latest | Edge function runtime |
| TypeScript | 5.9.x | Type-safe development |
| React | 18.3.x | UI framework |
| Vite | 6.3.x | Build tooling |
| Capacitor | 6.x | Native bridge |
| Hono | Latest | HTTP routing |
| SQLite | 3.x | Local database |

---

## 2. Development Environment

### 2.1 Project Structure

```
StealthDetect_v1.0/
├── All_IOCs.json                    # Master IoC database
├── stealthdetectSQLite_Sample.db    # Sample SQLite database
├── README.md
├── SECURITY.md
└── StealthDetect_v1.0/
    ├── android/                     # Android native project
    ├── build/                       # Production build output
    ├── node_modules/
    ├── src/
    │   ├── App.tsx                  # Main React component
    │   ├── main.tsx                 # Entry point
    │   ├── index.css                # Global styles
    │   ├── components/              # React components
    │   ├── capacitor-plugins/       # Custom Capacitor plugins
    │   │   ├── app-scanner/         # Native app enumeration
    │   │   └── vpn-service/         # VPN DNS interception
    │   ├── docs/                    # Documentation
    │   ├── styles/                  # Style modules
    │   ├── supabase/
    │   │   └── functions/
    │   │       └── server/          # Edge functions
    │   ├── utils/                   # Core services
    │   │   ├── crypto.ts            # Cryptographic utilities
    │   │   ├── database.ts          # Data access layer
    │   │   ├── initialize-app.ts    # App initialization
    │   │   ├── ioc-engine.ts        # Threat detection engine
    │   │   ├── ioc-ingest.ts        # SQLite data loader
    │   │   ├── ioc-sync.ts          # Cloud sync service
    │   │   ├── ioc-types.ts         # Type definitions
    │   │   ├── ioc-worker-manager.ts # Web Worker management
    │   │   ├── native.ts            # Native platform utilities
    │   │   ├── network-monitor.ts   # VPN network monitor
    │   │   ├── scanner.ts           # System scanner
    │   │   ├── spyguard.ts          # SpyGuard integration
    │   │   └── supabase/
    │   │       └── info.tsx         # Supabase configuration
    │   └── workers/                 # Web Workers
    ├── capacitor.config.ts          # Capacitor configuration
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

### 2.2 Environment Configuration

**Supabase Configuration (`src/utils/supabase/info.tsx`):**
```typescript
export const projectId = "zzeksqdidascmoyqlcps"
export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Capacitor Configuration (`capacitor.config.ts`):**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stealthdetect.app',
  appName: 'StealthDetect',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false
    }
  }
};

export default config;
```

### 2.3 Build Commands

```bash
# Development
npm run dev                  # Start Vite dev server

# Production Build
npm run build               # Build for production

# Capacitor Commands
npm run cap:sync            # Sync web assets to native
npm run cap:android         # Open Android Studio
npm run cap:build           # Build + sync
```

### 2.4 Dependencies

**Production Dependencies:**
```json
{
  "@capacitor-community/sqlite": "^6.0.0",
  "@capacitor/android": "^6.0.0",
  "@capacitor/cli": "^6.0.0",
  "@capacitor/core": "^6.0.0",
  "@supabase/supabase-js": "^2",
  "hono": "*",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "vite": "*"
}
```

**Dev Dependencies:**
```json
{
  "@types/node": "^20.10.0",
  "@vitejs/plugin-react-swc": "^3.10.2",
  "typescript": "^5.9.3",
  "vite": "6.3.5"
}
```

---

## 3. Code Architecture

### 3.1 Design Patterns

#### 3.1.1 Singleton Pattern

Used for core services to ensure single instance across the application:

```typescript
// database.ts
class Database {
  private initialized = false;
  private useSQLite = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Initialization logic
    this.initialized = true;
  }
}

// Export singleton instance
export const db = new Database();

// Initialize on import
db.initialize().catch(console.error);
```

**Singleton Services:**
- `db` - Database service
- `iocEngine` - IoC matching engine
- `networkMonitor` - Network monitoring
- `systemScanner` - System scanner
- `spyGuardDetector` - SpyGuard detector
- `iocIngestService` - SQLite ingest service

#### 3.1.2 Strategy Pattern

Used for platform-specific implementations:

```typescript
// native.ts
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isBrowserEnvironment || !isNative()) {
      // Web strategy
      localStorage.setItem(key, value);
      return;
    }
    // Native strategy
    const { Preferences } = await dynamicImport('@capacitor/preferences');
    await Preferences.set({ key, value });
  }
};
```

#### 3.1.3 Observer Pattern

Used for event-driven network monitoring:

```typescript
// network-monitor.ts
class NetworkMonitor {
  private onThreatDetected: ((threat: NetworkThreat) => void) | null = null;

  setOnThreatDetected(callback: (threat: NetworkThreat) => void): void {
    this.onThreatDetected = callback;
  }

  private async handleDnsRequest(event: DnsRequestEvent): Promise<void> {
    // Process DNS request
    if (threat && this.onThreatDetected) {
      this.onThreatDetected(networkThreat);
    }
  }
}
```

#### 3.1.4 Factory Pattern

Used for threat detection creation:

```typescript
// ioc-engine.ts
private createNetworkThreat(event: DnsRequestEvent, threat: ThreatInfo): NetworkThreat {
  return {
    id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: event.timestamp,
    type: 'dns_query',
    indicator: event.domain,
    severity: threat.severity,
    category: threat.category,
    description: threat.description,
    // ... additional properties
  };
}
```

### 3.2 Module Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                 │
│                             │                                    │
│              ┌──────────────┼──────────────┐                    │
│              ▼              ▼              ▼                    │
│         ┌────────┐    ┌─────────┐    ┌───────────┐             │
│         │Scanner │    │Database │    │ Network   │             │
│         │        │    │         │    │ Monitor   │             │
│         └───┬────┘    └────┬────┘    └─────┬─────┘             │
│             │              │               │                    │
│      ┌──────┼──────────────┼───────────────┤                   │
│      ▼      ▼              ▼               ▼                    │
│  ┌───────┐ ┌────────┐ ┌─────────┐ ┌──────────────┐             │
│  │SpyGua-│ │IoC     │ │IoC      │ │VPN Service   │             │
│  │rd     │ │Engine  │ │Sync     │ │Plugin        │             │
│  └───┬───┘ └───┬────┘ └────┬────┘ └──────────────┘             │
│      │         │           │                                    │
│      └─────────┴───────────┴──────────────────┐                │
│                                               ▼                 │
│                                    ┌─────────────────┐          │
│                                    │  IoC Ingest     │          │
│                                    │  Service        │          │
│                                    └────────┬────────┘          │
│                                             │                   │
│                              ┌──────────────┴──────────────┐    │
│                              ▼                             ▼    │
│                       ┌────────────┐              ┌────────────┐│
│                       │   SQLite   │              │ localStorage││
│                       │  (Native)  │              │   (Web)    ││
│                       └────────────┘              └────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Type System

#### 3.3.1 IoC Type Definitions (`ioc-types.ts`)

```typescript
// Severity levels
export type Severity = 'critical' | 'high' | 'medium' | 'low';

// Network indicator types
export type NetworkIndicatorType =
  | 'domain'
  | 'ip'
  | 'url'
  | 'c2_domain'
  | 'c2_ip'
  | 'resolved_host';

// Hash algorithms
export type HashAlgorithm = 'SHA-256' | 'MD5' | 'SHA-1';

// Scan status
export type ScanStatus = 'completed' | 'interrupted' | 'failed';

// Malware categories
export type MalwareCategory =
  | 'stalkerware'
  | 'watchware'
  | 'spyware'
  | 'tracking'
  | 'other';
```

#### 3.3.2 Utility Functions

```typescript
// Category to severity mapping
export function categoryToSeverity(category: MalwareCategory): Severity {
  const map: Record<MalwareCategory, Severity> = {
    stalkerware: 'critical',
    spyware: 'critical',
    watchware: 'high',
    tracking: 'medium',
    other: 'low',
  };
  return map[category] || 'medium';
}

// Type guards
export function isMalwareApp(obj: unknown): obj is MalwareApp {
  if (typeof obj !== 'object' || obj === null) return false;
  const app = obj as Record<string, unknown>;
  return (
    typeof app.name === 'string' &&
    typeof app.category === 'string' &&
    typeof app.sources === 'object'
  );
}
```

### 3.4 Error Handling Strategy

```typescript
// Standard error handling pattern
async function safeOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    return fallback;
  }
}

// Usage in database.ts
async findFileHash(hash: string): Promise<FileHashIoC | null> {
  if (this.useSQLite) {
    const match = await iocIngestService.findHashBySHA256(hash);
    if (match) {
      return this.threatMatchToFileHash(match);
    }
    return null;
  }

  // Fallback to localStorage
  const hashes = await this.getFileHashes();
  return hashes.find(h => h.hash === hash) || null;
}
```

---

## 4. Supabase Edge Functions

### 4.1 Project Configuration

**Base URL Pattern:**
```
https://{project_id}.supabase.co/functions/v1/{function_name}
```

**StealthDetect Base URL:**
```
https://zzeksqdidascmoyqlcps.supabase.co/functions/v1/make-server-91fc533e
```

### 4.2 Server Entry Point (`index.tsx`)

```typescript
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { iocRoutes } from "./ioc-routes.tsx";
import { adminRoutes } from "./admin-routes.tsx";

const app = new Hono();

// Middleware stack
app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Health check
app.get("/make-server-91fc533e/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: ['ioc-management', 'spyguard-integration', 'threat-intelligence'],
  });
});

// Mount route modules
app.route("/", iocRoutes);
app.route("/", adminRoutes);

// Start server
Deno.serve(app.fetch);
```

### 4.3 KV Store Implementation (`kv_store.tsx`)

```typescript
// Open KV store
const kv = await Deno.openKv();

// Get single value
export async function get(key: string): Promise<any> {
  const result = await kv.get([key]);
  return result.value;
}

// Set single value
export async function set(key: string, value: any): Promise<void> {
  await kv.set([key], value);
}

// Delete single value
export async function del(key: string): Promise<void> {
  await kv.delete([key]);
}

// Get by prefix (batch)
export async function getByPrefix(prefix: string): Promise<Array<{key: string, value: any}>> {
  const results: Array<{key: string, value: any}> = [];
  const iter = kv.list({ prefix: [prefix] });

  for await (const entry of iter) {
    results.push({
      key: entry.key.join(':'),
      value: entry.value
    });
  }

  return results;
}
```

### 4.4 IoC Routes Implementation

#### 4.4.1 File Hash Endpoints

```typescript
// GET /ioc/file-hashes
iocRoutes.get('/make-server-91fc533e/ioc/file-hashes', async (c) => {
  const category = c.req.query('category');
  const severity = c.req.query('severity');
  const limit = parseInt(c.req.query('limit') || '1000');

  const allHashes = await kv.getByPrefix('ioc:file_hash:');
  let data = allHashes.map(item => item.value);

  // Apply filters
  if (category) data = data.filter((h: any) => h.category === category);
  if (severity) data = data.filter((h: any) => h.severity === severity);

  return c.json({ data: data.slice(0, limit), count: data.length });
});

// POST /ioc/file-hashes/check
iocRoutes.post('/make-server-91fc533e/ioc/file-hashes/check', async (c) => {
  const { hashes } = await c.req.json();

  if (!Array.isArray(hashes)) {
    return c.json({ error: 'hashes must be an array' }, 400);
  }

  const matches = [];
  for (const hash of hashes) {
    const data = await kv.get(`ioc:file_hash:${hash}`);
    if (data) matches.push(data);
  }

  return c.json({ matches });
});
```

#### 4.4.2 Combined Check Endpoint

```typescript
// POST /ioc/check-all - Optimized batch checking
iocRoutes.post('/make-server-91fc533e/ioc/check-all', async (c) => {
  const {
    hashes = [],
    packageNames = [],
    networkIndicators = []
  } = await c.req.json();

  const results = {
    fileHashMatches: [],
    packageMatches: [],
    networkMatches: [],
    stalkerwareMatches: [],
  };

  // Parallel lookups using Promise.all for performance
  await Promise.all([
    // File hashes
    ...hashes.map(async (hash: string) => {
      const data = await kv.get(`ioc:file_hash:${hash}`);
      if (data) results.fileHashMatches.push(data);
    }),
    // Packages
    ...packageNames.map(async (pkg: string) => {
      const [pkgData, stalkerData] = await Promise.all([
        kv.get(`ioc:package:${pkg}`),
        kv.get(`stalkerware:${pkg}`)
      ]);
      if (pkgData) results.packageMatches.push(pkgData);
      if (stalkerData) results.stalkerwareMatches.push(stalkerData);
    }),
    // Network
    ...networkIndicators.map(async (ind: string) => {
      const data = await kv.get(`ioc:network:${ind}`);
      if (data) results.networkMatches.push(data);
    })
  ]);

  return c.json(results);
});
```

### 4.5 Admin Routes Implementation

```typescript
// POST /admin/initialize - Database initialization
adminRoutes.post('/make-server-91fc533e/admin/initialize', async (c) => {
  const stats = { stalkerware: 0, network: 0, packages: 0, hashes: 0 };

  // Import SpyGuard data
  const spyguardData = await importSpyGuardData();

  for (const app of spyguardData.apps) {
    // Insert packages
    if (app.platforms?.android?.packages) {
      for (const pkg of app.platforms.android.packages) {
        await kv.set(`ioc:package:${pkg}`, {
          package_name: pkg,
          app_name: app.name,
          category: app.category,
          severity: categoryToSeverity(app.category),
          source: 'SpyGuard'
        });
        stats.packages++;
      }
    }

    // Insert network indicators
    if (app.network?.c2?.domains) {
      for (const domain of app.network.c2.domains) {
        await kv.set(`ioc:network:${domain}`, {
          indicator_type: 'c2_domain',
          indicator_value: domain,
          app_name: app.name,
          category: 'c2',
          severity: 'critical',
          source: 'SpyGuard'
        });
        stats.network++;
      }
    }

    // Insert file hashes
    if (app.hashes?.sha256) {
      for (const [hash, info] of Object.entries(app.hashes.sha256)) {
        await kv.set(`ioc:file_hash:${hash}`, {
          hash: hash.toLowerCase(),
          algorithm: 'SHA-256',
          app_name: app.name,
          category: app.category,
          severity: categoryToSeverity(app.category),
          source: 'SpyGuard'
        });
        stats.hashes++;
      }
    }
  }

  return c.json({ success: true, stats });
});
```

---

## 5. Client-Side Implementation

### 5.1 IoC Engine Implementation

```typescript
// ioc-engine.ts
export class IoCEngine {

  async analyzeScanResults(scanData: ScanResult): Promise<MatchResult> {
    const threats: ThreatDetection[] = [];

    // Parallel threat checking
    const [fileThreats, networkThreats, packageThreats] = await Promise.all([
      this.checkFileHashes(scanData.fileHashes),
      this.checkNetworkConnections(scanData.networkConnections),
      this.checkPackages(scanData.installedPackages)
    ]);

    threats.push(...fileThreats, ...networkThreats, ...packageThreats);

    // Sort by severity (critical first)
    threats.sort((a, b) =>
      this.severityWeight(b.severity) - this.severityWeight(a.severity)
    );

    return {
      threats,
      stats: {
        filesScanned: scanData.fileHashes.length,
        networksChecked: scanData.networkConnections.length,
        packagesScanned: scanData.installedPackages.length,
        threatsFound: threats.length,
      },
    };
  }

  private async checkNetworkConnections(
    connections: Array<{ url: string; type: 'domain' | 'ip' }>
  ): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];
    const knownNetworkIoCs = await db.getNetworkIoCs();

    for (const conn of connections) {
      const domain = this.extractDomain(conn.url);

      // Exact match
      let match = knownNetworkIoCs.find(ioc =>
        ioc.value === domain || ioc.value === conn.url
      );

      // Subdomain match (evil.com matches sub.evil.com)
      if (!match) {
        match = knownNetworkIoCs.find(ioc =>
          domain.endsWith(ioc.value) || ioc.value.endsWith(domain)
        );
      }

      if (match) {
        threats.push(this.createNetworkThreat(conn, match));
      }
    }

    return threats;
  }

  private extractDomain(url: string): string {
    try {
      let domain = url.replace(/^https?:\/\//, '');
      domain = domain.split('/')[0];
      domain = domain.split(':')[0];
      return domain.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private severityWeight(severity: string): number {
    return { critical: 4, high: 3, medium: 2, low: 1 }[severity] || 0;
  }
}
```

### 5.2 Database Service Implementation

```typescript
// database.ts
class Database {
  private initialized = false;
  private useSQLite = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.useSQLite = isNative();

    if (this.useSQLite) {
      try {
        await iocIngestService.initialize();
        console.log('[Database] SQLite initialized');
      } catch (error) {
        console.warn('[Database] SQLite failed, using localStorage:', error);
        this.useSQLite = false;
      }
    }

    // Version check and migration
    const version = await this.getDbVersion();
    if (version !== CURRENT_DB_VERSION) {
      await this.migrate(version, CURRENT_DB_VERSION);
    }

    // Initialize defaults for localStorage mode
    if (!this.useSQLite) {
      const fileHashes = await this.getFileHashes();
      if (fileHashes.length === 0) {
        await this.loadDefaultIoCs();
      }
    }

    this.initialized = true;
  }

  // Dual-mode find operation
  async findNetworkIoC(value: string): Promise<NetworkIoC | null> {
    if (this.useSQLite) {
      const match = await iocIngestService.findNetworkIndicator(value);
      return match ? this.threatMatchToNetworkIoC(match) : null;
    }

    const iocs = await this.getNetworkIoCs();
    return iocs.find(ioc => ioc.value === value) || null;
  }

  // Batch query (SQLite only)
  async findPackages(packageNames: string[]): Promise<PackageIoC[]> {
    if (this.useSQLite) {
      const matches = await iocIngestService.findPackages(packageNames);
      return matches.map(m => this.threatMatchToPackageIoC(m));
    }

    const iocs = await this.getPackageIoCs();
    return iocs.filter(ioc => packageNames.includes(ioc.packageName));
  }
}
```

### 5.3 IoC Sync Implementation

```typescript
// ioc-sync.ts
const SUPABASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-91fc533e`;

async function fetchIoCData(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const queryString = new URLSearchParams(params).toString();
  const url = `${SUPABASE_URL}/${endpoint}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }

  return await response.json();
}

export function isSyncNeeded(): boolean {
  const syncMetadata = localStorage.getItem('sync_stalkerware_signatures');

  if (!syncMetadata) return true;

  try {
    const metadata = JSON.parse(syncMetadata);
    const lastSync = new Date(metadata.lastSync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync >= 24;
  } catch {
    return true;
  }
}

export async function syncIoCs(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    stalkerwareCount: 0,
    networkCount: 0,
    packageCount: 0,
    fileHashCount: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  // Sync each category with error isolation
  const syncOperations = [
    { name: 'stalkerware', fn: syncStalkerwareSignatures },
    { name: 'network', fn: syncNetworkIndicators },
    { name: 'packages', fn: syncPackageIoCs },
    { name: 'fileHashes', fn: syncFileHashIoCs },
  ];

  for (const op of syncOperations) {
    try {
      const count = await op.fn();
      result[`${op.name}Count`] = count;
    } catch (error) {
      result.errors.push(`${op.name} sync failed: ${error}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}
```

### 5.4 SpyGuard Detector Implementation

```typescript
// spyguard.ts
export class SpyGuardDetector {

  async scanInstalledApps(
    installedApps: Array<{
      packageName: string;
      appName?: string;
      version?: string;
      permissions?: string[];
    }>
  ): Promise<DetectedStalkerware[]> {
    const detected: DetectedStalkerware[] = [];

    for (const app of installedApps) {
      const result = await this.analyzeApp(app);
      if (result) detected.push(result);
    }

    return detected;
  }

  private async analyzeApp(app: AppInfo): Promise<DetectedStalkerware | null> {
    const detectionReasons: string[] = [];
    let severity: Severity = 'low';

    // Check 1: Known package name
    const knownType = this.checkKnownPackage(app.packageName);
    if (knownType) {
      detectionReasons.push(`Known stalkerware: ${knownType}`);
      severity = 'critical';
    }

    // Check 2: Suspicious app name
    if (app.appName && this.checkSuspiciousName(app.appName)) {
      detectionReasons.push(`Suspicious app name: "${app.appName}"`);
      if (severity === 'low') severity = 'medium';
    }

    // Check 3: Dangerous permission combinations
    if (app.permissions?.length) {
      const dangerousPerms = this.checkDangerousPermissions(app.permissions);
      if (dangerousPerms.length) {
        detectionReasons.push(...dangerousPerms);
        if (severity === 'low') severity = 'high';
      }
    }

    if (detectionReasons.length === 0) return null;

    return {
      packageName: app.packageName,
      appName: app.appName,
      version: app.version,
      detectionReasons,
      severity,
      permissions: app.permissions || [],
      recommendedAction: this.getRecommendedAction(severity),
    };
  }

  private checkDangerousPermissions(permissions: string[]): string[] {
    const reasons: string[] = [];

    // Check known stalkerware permission patterns
    for (const pattern of STALKERWARE_PERMISSION_PATTERNS) {
      const hasAll = pattern.every(perm =>
        permissions.some(p => p.includes(perm))
      );
      if (hasAll) {
        reasons.push(`Dangerous permissions: ${pattern.join(', ')}`);
      }
    }

    // Check for multiple surveillance permissions
    const criticalPerms = ['RECORD_AUDIO', 'CAMERA', 'READ_CALL_LOG', 'READ_SMS'];
    const hasCritical = permissions.filter(p =>
      criticalPerms.some(crit => p.includes(crit))
    );
    if (hasCritical.length >= 2) {
      reasons.push(`Multiple surveillance permissions: ${hasCritical.join(', ')}`);
    }

    return reasons;
  }
}
```

---

## 6. Capacitor Plugin Development

### 6.1 VPN Service Plugin

#### 6.1.1 TypeScript Definitions (`definitions.ts`)

```typescript
import type { PluginListenerHandle } from '@capacitor/core';

export interface VpnServicePlugin {
  startVpn(): Promise<StartVpnResult>;
  stopVpn(): Promise<StopVpnResult>;
  getVpnStatus(): Promise<VpnStatus>;
  checkPermission(): Promise<PermissionResult>;
  requestPermission(): Promise<PermissionResult>;

  addListener(
    eventName: 'dnsRequest',
    listenerFunc: (event: DnsRequestEvent) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'vpnStateChange',
    listenerFunc: (event: VpnStateChangeEvent) => void
  ): Promise<PluginListenerHandle>;

  removeAllListeners(): Promise<void>;
}

export interface DnsRequestEvent {
  timestamp: string;
  domain: string;
  queryType: DnsQueryType;
  sourceApp: string | null;
  sourcePort: number;
  destinationIp: string;
  blocked: boolean;
}

export type DnsQueryType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'PTR' | 'OTHER';
```

#### 6.1.2 Web Implementation (`implementation.ts`)

```typescript
import { WebPlugin } from '@capacitor/core';
import type { VpnServicePlugin, StartVpnResult, VpnStatus } from './definitions';

export class VpnServiceWeb extends WebPlugin implements VpnServicePlugin {
  private isConnected = false;
  private mockDnsInterval: NodeJS.Timer | null = null;

  async startVpn(): Promise<StartVpnResult> {
    console.log('[VpnService] Starting mock VPN in web mode');
    this.isConnected = true;

    // Simulate DNS events for testing
    this.mockDnsInterval = setInterval(() => {
      this.notifyListeners('dnsRequest', {
        timestamp: new Date().toISOString(),
        domain: `test-${Math.random().toString(36).substr(2, 8)}.example.com`,
        queryType: 'A',
        sourceApp: 'com.test.app',
        sourcePort: 12345,
        destinationIp: '8.8.8.8',
        blocked: false,
      });
    }, 5000);

    return { success: true, requiresPermission: false };
  }

  async stopVpn(): Promise<{ success: boolean }> {
    this.isConnected = false;
    if (this.mockDnsInterval) {
      clearInterval(this.mockDnsInterval);
      this.mockDnsInterval = null;
    }
    return { success: true };
  }

  async getVpnStatus(): Promise<VpnStatus> {
    return {
      connected: this.isConnected,
      startTime: this.isConnected ? new Date().toISOString() : null,
      packetsProcessed: 0,
      dnsQueriesIntercepted: 0,
    };
  }

  async checkPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }
}
```

### 6.2 App Scanner Plugin

#### 6.2.1 TypeScript Definitions

```typescript
export interface AppScannerPlugin {
  getInstalledApps(): Promise<InstalledAppsResult>;
}

export interface InstalledAppsResult {
  apps: InstalledApp[];
  totalCount: number;
  userApps: number;
  systemApps: number;
}

export interface InstalledApp {
  packageName: string;
  appName: string;
  permissions: string[];
  isSystemApp: boolean;
  versionName?: string;
  versionCode?: number;
  installTime?: string;
  updateTime?: string;
}
```

#### 6.2.2 Android Native Implementation

```java
// android/app/src/main/java/com/stealthdetect/plugins/AppScanner.java
@CapacitorPlugin(name = "AppScanner")
public class AppScanner extends Plugin {

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        Context context = getContext();
        PackageManager pm = context.getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(
            PackageManager.GET_META_DATA
        );

        JSArray appsArray = new JSArray();
        int userApps = 0;
        int systemApps = 0;

        for (ApplicationInfo app : apps) {
            JSObject appObj = new JSObject();
            appObj.put("packageName", app.packageName);
            appObj.put("appName", pm.getApplicationLabel(app).toString());

            boolean isSystem = (app.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
            appObj.put("isSystemApp", isSystem);

            if (isSystem) systemApps++;
            else userApps++;

            // Get permissions
            try {
                PackageInfo pkgInfo = pm.getPackageInfo(
                    app.packageName,
                    PackageManager.GET_PERMISSIONS
                );
                if (pkgInfo.requestedPermissions != null) {
                    JSArray perms = new JSArray();
                    for (String perm : pkgInfo.requestedPermissions) {
                        perms.put(perm);
                    }
                    appObj.put("permissions", perms);
                }
            } catch (Exception e) {
                appObj.put("permissions", new JSArray());
            }

            appsArray.put(appObj);
        }

        JSObject result = new JSObject();
        result.put("apps", appsArray);
        result.put("totalCount", apps.size());
        result.put("userApps", userApps);
        result.put("systemApps", systemApps);

        call.resolve(result);
    }
}
```

---

## 7. Database Implementation

### 7.1 SQLite Schema Creation

```typescript
// ioc-ingest.ts
const CREATE_TABLES_SQL = `
-- Package-based IoCs
CREATE TABLE IF NOT EXISTS ioc_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name TEXT NOT NULL UNIQUE,
  app_name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  platforms TEXT,
  aliases TEXT,
  date_added TEXT NOT NULL,
  last_updated TEXT NOT NULL
);

-- File Hash IoCs
CREATE TABLE IF NOT EXISTS ioc_file_hashes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'SHA-256',
  package_name TEXT,
  certificate TEXT,
  version TEXT,
  app_name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  date_added TEXT NOT NULL,
  UNIQUE(hash, algorithm)
);

-- Network IoCs
CREATE TABLE IF NOT EXISTS ioc_network (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator_type TEXT NOT NULL,
  indicator_value TEXT NOT NULL,
  app_name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  date_added TEXT NOT NULL,
  UNIQUE(indicator_type, indicator_value)
);
`;

const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_packages_name ON ioc_packages(package_name);
CREATE INDEX IF NOT EXISTS idx_packages_category ON ioc_packages(category);
CREATE INDEX IF NOT EXISTS idx_hashes_hash ON ioc_file_hashes(hash);
CREATE INDEX IF NOT EXISTS idx_network_value ON ioc_network(indicator_value);
CREATE INDEX IF NOT EXISTS idx_network_type ON ioc_network(indicator_type);
`;
```

### 7.2 SQLite Connection Management

```typescript
class IoCIngestService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.checkNativeEnvironment()) {
      console.log('[IoCIngest] Web mode - SQLite disabled');
      this.initialized = true;
      return;
    }

    this.sqlite = new SQLiteConnection(CapacitorSQLite);

    // Check existing connection
    const retCC = await this.sqlite.checkConnectionsConsistency();
    const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

    if (retCC.result && isConn) {
      this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
    } else {
      this.db = await this.sqlite.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        DB_VERSION,
        false
      );
    }

    await this.db.open();
    await this.createTables();
    this.initialized = true;
  }

  private checkNativeEnvironment(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Capacitor' in window &&
      (window as any).Capacitor?.isNativePlatform?.() === true
    );
  }
}
```

### 7.3 Indexed Query Implementation

```typescript
// Fast hash lookup with index
async findHashBySHA256(hash: string): Promise<ThreatMatch | null> {
  if (!this.db) return null;

  const result = await this.db.query(
    'SELECT * FROM ioc_file_hashes WHERE hash = ? AND algorithm = ?',
    [hash.toLowerCase(), 'SHA-256']
  );

  const row = result.values?.[0];
  if (!row) return null;

  return {
    indicator: row.hash,
    indicatorType: 'file_hash',
    appName: row.app_name,
    category: row.category,
    severity: row.severity,
    description: row.description || '',
    source: row.source,
  };
}

// Network lookup with subdomain matching
async findNetworkIndicator(value: string): Promise<ThreatMatch | null> {
  if (!this.db) return null;

  const normalizedValue = value.toLowerCase();

  // Try exact match first (uses index)
  let result = await this.db.query(
    'SELECT * FROM ioc_network WHERE indicator_value = ?',
    [normalizedValue]
  );

  // Try subdomain match
  if (!result.values?.length) {
    result = await this.db.query(
      `SELECT * FROM ioc_network
       WHERE ? LIKE '%.' || indicator_value
       OR indicator_value LIKE '%.' || ?
       LIMIT 1`,
      [normalizedValue, normalizedValue]
    );
  }

  const row = result.values?.[0];
  return row ? this.rowToThreatMatch(row) : null;
}

// Batch query for performance
async findPackages(packageNames: string[]): Promise<ThreatMatch[]> {
  if (!this.db || packageNames.length === 0) return [];

  const placeholders = packageNames.map(() => '?').join(',');
  const result = await this.db.query(
    `SELECT * FROM ioc_packages WHERE package_name IN (${placeholders})`,
    packageNames
  );

  return (result.values || []).map(row => this.rowToThreatMatch(row));
}
```

### 7.4 Transaction Support

```typescript
async loadIOCs(jsonData: AllIOCs): Promise<IngestStats> {
  const stats: IngestStats = {
    packagesLoaded: 0,
    hashesLoaded: 0,
    networkLoaded: 0,
    errors: [],
    duration: 0,
  };

  const startTime = Date.now();

  try {
    // Begin transaction for atomic insert
    await this.db.beginTransaction();

    for (const app of jsonData.apps) {
      // Insert packages
      if (app.platforms?.android?.packages) {
        for (const pkg of app.platforms.android.packages) {
          await this.insertPackage(app, pkg);
          stats.packagesLoaded++;
        }
      }

      // Insert hashes
      if (app.hashes?.sha256) {
        for (const [hash, info] of Object.entries(app.hashes.sha256)) {
          await this.insertHash(app, hash, info);
          stats.hashesLoaded++;
        }
      }

      // Insert network indicators
      if (app.network?.c2?.domains) {
        for (const domain of app.network.c2.domains) {
          await this.insertNetwork('c2_domain', domain, app);
          stats.networkLoaded++;
        }
      }
    }

    await this.db.commitTransaction();
  } catch (error) {
    await this.db?.rollbackTransaction();
    stats.errors.push(`Transaction failed: ${error}`);
  }

  stats.duration = Date.now() - startTime;
  return stats;
}
```

---

## 8. Synchronization Protocol

### 8.1 Sync Flow Diagram

```
┌─────────────┐                           ┌─────────────────┐
│   Client    │                           │  Supabase API   │
└──────┬──────┘                           └────────┬────────┘
       │                                           │
       │  1. Check last sync time                  │
       │  (localStorage: sync_stalkerware_signatures)
       │                                           │
       │  2. If > 24 hours, start sync             │
       │                                           │
       │  GET /ioc/stalkerware?limit=1000          │
       │─────────────────────────────────────────▶│
       │                                           │
       │◀─────────────────────────────────────────│
       │         { data: [...], count: N }         │
       │                                           │
       │  3. Store in localStorage                 │
       │     Key: stalkerware_{package_name}       │
       │                                           │
       │  GET /ioc/network?limit=1000              │
       │─────────────────────────────────────────▶│
       │                                           │
       │◀─────────────────────────────────────────│
       │         { data: [...], count: N }         │
       │                                           │
       │  4. Store network indicators              │
       │     Key: network_{type}_{value}           │
       │                                           │
       │  5. Update sync metadata                  │
       │     sync_stalkerware_signatures = {       │
       │       lastSync: ISO timestamp,            │
       │       recordCount: N,                     │
       │       version: 1                          │
       │     }                                     │
       │                                           │
```

### 8.2 Sync Implementation Details

```typescript
// Sync metadata structure
interface SyncMetadata {
  lastSync: string;      // ISO 8601 timestamp
  recordCount: number;   // Records synced
  version: number;       // Schema version
}

// Check if sync is needed
export function isSyncNeeded(): boolean {
  const syncMetadata = localStorage.getItem('sync_stalkerware_signatures');

  if (!syncMetadata) return true; // Never synced

  try {
    const metadata: SyncMetadata = JSON.parse(syncMetadata);
    const lastSync = new Date(metadata.lastSync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync >= 24; // Sync every 24 hours
  } catch {
    return true;
  }
}

// Sync individual category with error isolation
async function syncStalkerwareSignatures(): Promise<number> {
  const result = await fetchIoCData('ioc/stalkerware', { limit: '1000' });
  const signatures = result.data || [];

  // Clear existing data
  const existingKeys = Object.keys(localStorage).filter(key =>
    key.startsWith('stalkerware_')
  );
  existingKeys.forEach(key => localStorage.removeItem(key));

  // Store new data
  for (const signature of signatures) {
    const key = `stalkerware_${signature.package_name}`;
    localStorage.setItem(key, JSON.stringify(signature));

    // Also add to database for backward compatibility
    await db.addPackageIoC({
      packageName: signature.package_name,
      category: 'stalkerware',
      severity: signature.severity,
      description: signature.description || signature.app_name,
      source: 'SpyGuard',
    });
  }

  // Update sync metadata
  localStorage.setItem('sync_stalkerware_signatures', JSON.stringify({
    lastSync: new Date().toISOString(),
    recordCount: signatures.length,
    version: 1,
  }));

  return signatures.length;
}
```

### 8.3 Offline Mode Handling

```typescript
// In scanner.ts
async startScan(progressCallback?: ScanProgressCallback): Promise<ScanResult> {
  // ...

  // Phase: Sync IoCs (with graceful degradation)
  if (isSyncNeeded()) {
    progress = this.updateProgress(progress, 'syncing_iocs', 8,
      'Syncing threat intelligence from cloud...');
    progress.cloudSyncEnabled = true;
    progressCallback?.(progress);

    try {
      const syncResult = await syncIoCs();
      progress = this.addLogEntry(progress,
        `Synced ${syncResult.stalkerwareCount} signatures`);
    } catch (error) {
      // Graceful degradation - continue with cached data
      progress = this.addLogEntry(progress,
        'Cloud sync failed, using local database');
    }
  } else {
    progress = this.addLogEntry(progress, 'Using cached IoC database');
  }

  // Continue with scan using whatever data is available
  // ...
}
```

---

## 9. Network Monitoring Implementation

### 9.1 VPN-Based DNS Interception

```typescript
// network-monitor.ts
class NetworkMonitor {
  private isMonitoring = false;
  private vpnConnected = false;
  private threats: NetworkThreat[] = [];
  private dnsListener: PluginListenerHandle | null = null;

  async start(): Promise<void> {
    if (this.isMonitoring) return;

    // Reset state
    this.threats = [];
    this.monitoringStartTime = new Date().toISOString();

    // Start VPN service
    const result = await VpnService.startVpn();

    if (!result.success) {
      if (result.requiresPermission) {
        throw new Error('VPN permission required');
      }
      throw new Error(result.errorMessage || 'Failed to start VPN');
    }

    this.vpnConnected = true;
    this.isMonitoring = true;

    // Set up event listeners
    await this.setupListeners();
  }

  private async setupListeners(): Promise<void> {
    // Listen for DNS requests
    this.dnsListener = await VpnService.addListener('dnsRequest', (event) => {
      this.handleDnsRequest(event);
    });

    // Listen for VPN state changes
    this.stateListener = await VpnService.addListener('vpnStateChange', (event) => {
      this.handleStateChange(event);
    });
  }

  private async handleDnsRequest(event: DnsRequestEvent): Promise<void> {
    this.dnsQueriesCount++;

    // Notify external listener
    this.onDnsQuery?.(event);

    // Check against IoC database
    let threat: ThreatInfo | null = null;

    if (iocWorkerManager.isInitialized()) {
      // Use Web Worker for background processing
      threat = await iocWorkerManager.matchDnsQuery(event);
    } else {
      // Fallback to direct database query
      const match = await db.findNetworkIoC(event.domain);
      if (match) {
        threat = {
          indicator: match.value,
          indicatorType: match.type,
          appName: 'Unknown',
          category: match.category,
          severity: match.severity,
          description: match.description,
          source: match.source,
        };
      }
    }

    if (threat) {
      const networkThreat = this.createNetworkThreat(event, threat);
      this.threats.push(networkThreat);
      this.onThreatDetected?.(networkThreat);
    }
  }
}
```

### 9.2 Web Worker for Background Processing

```typescript
// ioc-worker-manager.ts
class IoCWorkerManager {
  private worker: Worker | null = null;
  private initialized = false;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  async initialize(iocData: any): Promise<void> {
    if (this.initialized) return;

    this.worker = new Worker(
      new URL('../workers/ioc-matcher.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event) => {
      const { requestId, result, error } = event.data;
      const pending = this.pendingRequests.get(requestId);

      if (pending) {
        this.pendingRequests.delete(requestId);
        if (error) pending.reject(error);
        else pending.resolve(result);
      }
    };

    // Initialize worker with IoC data
    await this.sendRequest('initialize', { iocData });
    this.initialized = true;
  }

  async matchDnsQuery(event: DnsRequestEvent): Promise<ThreatInfo | null> {
    return this.sendRequest('matchDns', { domain: event.domain });
  }

  private sendRequest(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}_${Math.random()}`;
      this.pendingRequests.set(requestId, { resolve, reject });
      this.worker?.postMessage({ requestId, type, payload });
    });
  }
}
```

### 9.3 DNS Query Matching Algorithm

```typescript
// In worker or main thread
function matchDomain(queryDomain: string, iocDomains: string[]): string | null {
  const normalizedQuery = queryDomain.toLowerCase();

  // Exact match
  if (iocDomains.includes(normalizedQuery)) {
    return normalizedQuery;
  }

  // Subdomain match
  // If IoC is "evil.com", match "api.evil.com", "www.evil.com"
  for (const iocDomain of iocDomains) {
    // Query is subdomain of IoC
    if (normalizedQuery.endsWith('.' + iocDomain)) {
      return iocDomain;
    }
    // IoC is subdomain of query (less common but possible)
    if (iocDomain.endsWith('.' + normalizedQuery)) {
      return iocDomain;
    }
  }

  return null;
}
```

---

## 10. Testing Strategy

### 10.1 Unit Testing

```typescript
// Example: IoC Engine tests
describe('IoCEngine', () => {
  let engine: IoCEngine;

  beforeEach(() => {
    engine = new IoCEngine();
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(engine['extractDomain']('https://evil.com/path')).toBe('evil.com');
      expect(engine['extractDomain']('http://sub.evil.com:8080/path')).toBe('sub.evil.com');
    });
  });

  describe('severityWeight', () => {
    it('should return correct weights', () => {
      expect(engine['severityWeight']('critical')).toBe(4);
      expect(engine['severityWeight']('high')).toBe(3);
      expect(engine['severityWeight']('medium')).toBe(2);
      expect(engine['severityWeight']('low')).toBe(1);
    });
  });

  describe('checkNetworkConnections', () => {
    it('should detect malicious domains', async () => {
      // Mock database
      jest.spyOn(db, 'getNetworkIoCs').mockResolvedValue([
        { value: 'evil.com', category: 'c2', severity: 'critical' }
      ]);

      const threats = await engine['checkNetworkConnections']([
        { url: 'https://evil.com/api', type: 'domain' }
      ]);

      expect(threats).toHaveLength(1);
      expect(threats[0].severity).toBe('critical');
    });

    it('should detect subdomain matches', async () => {
      jest.spyOn(db, 'getNetworkIoCs').mockResolvedValue([
        { value: 'evil.com', category: 'c2', severity: 'critical' }
      ]);

      const threats = await engine['checkNetworkConnections']([
        { url: 'https://api.evil.com', type: 'domain' }
      ]);

      expect(threats).toHaveLength(1);
    });
  });
});
```

### 10.2 Integration Testing

```typescript
// Example: Sync service integration tests
describe('IoC Sync Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should sync data from Supabase', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { package_name: 'com.test.stalker', severity: 'critical' }
        ],
        count: 1
      })
    });

    const result = await syncIoCs();

    expect(result.success).toBe(true);
    expect(result.stalkerwareCount).toBeGreaterThan(0);
  });

  it('should handle sync failures gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await syncIoCs();

    expect(result.success).toBe(false);
    expect(result.errors).toContain('stalkerware sync failed');
  });
});
```

### 10.3 End-to-End Testing

```typescript
// Example: Full scan E2E test
describe('System Scanner E2E', () => {
  it('should complete full scan cycle', async () => {
    const scanner = new SystemScanner();
    const progressUpdates: ScanProgress[] = [];

    const result = await scanner.startScan((progress) => {
      progressUpdates.push({ ...progress });
    });

    // Verify scan completed
    expect(result.status).toBe('completed');

    // Verify all phases executed
    const phases = progressUpdates.map(p => p.phase);
    expect(phases).toContain('initializing');
    expect(phases).toContain('scanning_files');
    expect(phases).toContain('analyzing_packages');
    expect(phases).toContain('completed');

    // Verify stats
    expect(result.stats.filesScanned).toBeGreaterThan(0);
  });
});
```

### 10.4 API Testing

```bash
# Health check
curl -X GET "https://zzeksqdidascmoyqlcps.supabase.co/functions/v1/make-server-91fc533e/health"

# Get stalkerware signatures
curl -X GET "https://zzeksqdidascmoyqlcps.supabase.co/functions/v1/make-server-91fc533e/ioc/stalkerware?limit=10" \
  -H "Authorization: Bearer {anon_key}"

# Check packages
curl -X POST "https://zzeksqdidascmoyqlcps.supabase.co/functions/v1/make-server-91fc533e/ioc/stalkerware/check" \
  -H "Authorization: Bearer {anon_key}" \
  -H "Content-Type: application/json" \
  -d '{"packageNames": ["com.mspy.android", "com.flexispy"]}'

# Combined check
curl -X POST "https://zzeksqdidascmoyqlcps.supabase.co/functions/v1/make-server-91fc533e/ioc/check-all" \
  -H "Authorization: Bearer {anon_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "hashes": ["abc123"],
    "packageNames": ["com.test.app"],
    "networkIndicators": ["evil.com"]
  }'
```

---

## 11. Deployment Configuration

### 11.1 Supabase Edge Function Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref zzeksqdidascmoyqlcps

# Deploy edge functions
supabase functions deploy make-server-91fc533e
```

### 11.2 Android Build Configuration

**`android/app/build.gradle`:**
```groovy
android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.stealthdetect.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation "androidx.coordinatorlayout:coordinatorlayout:1.2.0"
    implementation "androidx.webkit:webkit:1.8.0"
}
```

### 11.3 iOS Build Configuration

**Capacitor iOS settings:**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.stealthdetect.app',
  appName: 'StealthDetect',
  webDir: 'build',
  ios: {
    scheme: 'StealthDetect',
    backgroundColor: '#1a1a2e'
  }
};
```

### 11.4 Environment Variables

```bash
# .env.local (development)
VITE_SUPABASE_URL=https://zzeksqdidascmoyqlcps.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production (set in CI/CD)
SUPABASE_PROJECT_ID=zzeksqdidascmoyqlcps
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

---

## 12. Monitoring and Logging

### 12.1 Client-Side Logging

```typescript
// Logging utility
const LOG_PREFIX = '[StealthDetect]';

export const logger = {
  debug: (context: string, message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${LOG_PREFIX}[${context}] ${message}`, data || '');
    }
  },

  info: (context: string, message: string, data?: any) => {
    console.log(`${LOG_PREFIX}[${context}] ${message}`, data || '');
  },

  warn: (context: string, message: string, data?: any) => {
    console.warn(`${LOG_PREFIX}[${context}] ${message}`, data || '');
  },

  error: (context: string, message: string, error?: any) => {
    console.error(`${LOG_PREFIX}[${context}] ${message}`, error || '');
  }
};

// Usage
logger.info('Database', 'SQLite initialized');
logger.error('Sync', 'Failed to sync IoCs', error);
```

### 12.2 Edge Function Logging

```typescript
// Server-side logging with Hono logger middleware
import { logger } from "npm:hono/logger";

app.use('*', logger((message, ...rest) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...rest);
}));

// Custom logging in route handlers
iocRoutes.get('/ioc/stalkerware', async (c) => {
  const startTime = Date.now();

  try {
    const result = await fetchStalkerware();
    const duration = Date.now() - startTime;

    console.log(`[IoC] Fetched ${result.count} stalkerware signatures in ${duration}ms`);

    return c.json(result);
  } catch (error) {
    console.error(`[IoC] Error fetching stalkerware:`, error);
    return c.json({ error: String(error) }, 500);
  }
});
```

### 12.3 Performance Monitoring

```typescript
// Performance tracking
class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;

      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      this.metrics.get(operation)!.push(duration);

      // Log slow operations
      if (duration > 1000) {
        console.warn(`[Performance] Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  getStats(operation: string): { avg: number; min: number; max: number; count: number } {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    };
  }
}

export const perfTracker = new PerformanceTracker();

// Usage
const endTimer = perfTracker.startTimer('ioc-lookup');
const result = await db.findNetworkIoC(domain);
endTimer();
```

### 12.4 Error Reporting

```typescript
// Structured error reporting
interface ErrorReport {
  timestamp: string;
  context: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
}

class ErrorReporter {
  private errors: ErrorReport[] = [];
  private maxErrors = 100;

  report(context: string, error: Error, metadata?: Record<string, any>): void {
    const report: ErrorReport = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
      metadata
    };

    this.errors.push(report);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console
    console.error(`[ErrorReport][${context}]`, report);
  }

  getRecentErrors(count: number = 10): ErrorReport[] {
    return this.errors.slice(-count);
  }

  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

export const errorReporter = new ErrorReporter();
```

---

## Appendix A: Code Style Guidelines

### A.1 TypeScript Conventions

```typescript
// Use interfaces for data structures
interface ScanResult {
  id: string;
  status: ScanStatus;
  threats: ThreatDetection[];
}

// Use type aliases for unions/primitives
type Severity = 'critical' | 'high' | 'medium' | 'low';

// Use async/await over Promises
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  return response.json();
}

// Use optional chaining and nullish coalescing
const value = obj?.nested?.property ?? defaultValue;

// Export singletons at module level
export const db = new Database();
```

### A.2 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `IoCEngine`, `NetworkMonitor` |
| Interfaces | PascalCase | `ScanResult`, `ThreatDetection` |
| Functions | camelCase | `analyzeScanResults`, `findNetworkIoC` |
| Constants | SCREAMING_SNAKE_CASE | `STALKERWARE_PERMISSION_PATTERNS` |
| Files | kebab-case | `ioc-engine.ts`, `network-monitor.ts` |
| Database tables | snake_case | `ioc_packages`, `scan_history` |

---

## Appendix B: Troubleshooting Guide

### B.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| SQLite not initialized | Running in web mode | Check `isNative()` returns true |
| Sync fails | Network error | Check internet, retry with backoff |
| VPN permission denied | User rejected | Show permission explanation dialog |
| Slow queries | Missing indexes | Verify indexes created |
| Memory issues | Large IoC dataset | Use pagination, streaming |

### B.2 Debug Commands

```typescript
// Check database state
console.log('SQLite enabled:', db.isSQLiteEnabled());
console.log('IoC stats:', await db.getIoCStats());

// Check sync state
console.log('Sync needed:', isSyncNeeded());
console.log('Last sync:', getLastSyncInfo());

// Check VPN state
console.log('VPN status:', await networkMonitor.getVpnStatus());
console.log('Monitor state:', networkMonitor.getState());
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-02 | StealthDetect Team | Initial technical specification |

---

*This document is part of the StealthDetect project documentation.*
