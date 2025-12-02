# StealthDetect Backend Functional Specification

**Version:** 1.0
**Date:** December 2, 2025
**Project:** StealthDetect - Stalkerware Detection Application

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Backend Components](#3-backend-components)
4. [Data Models](#4-data-models)
5. [API Specification](#5-api-specification)
6. [Core Services](#6-core-services)
7. [Database Design](#7-database-design)
8. [Security Considerations](#8-security-considerations)
9. [Performance Requirements](#9-performance-requirements)
10. [Error Handling](#10-error-handling)

---

## 1. Executive Summary

### 1.1 Purpose

StealthDetect is a privacy-focused mobile application designed to detect stalkerware, spyware, and monitoring software on mobile devices. The backend system provides threat intelligence services, IoC (Indicators of Compromise) management, and supports an offline-first architecture for user privacy.

### 1.2 Scope

This document specifies the functional requirements for the StealthDetect backend system, including:
- Cloud-based threat intelligence API
- Local SQLite database for native platforms
- IoC synchronization services
- Network traffic analysis support
- SpyGuard integration for stalkerware detection

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| VPN-based Network Monitoring | Intercepts DNS queries to detect malicious connections |
| Offline-First Architecture | Full functionality without internet connection |
| Multi-Factor Detection | File hashes, network indicators, package signatures |
| SpyGuard Integration | Verified stalkerware database from security researchers |
| Privacy-Preserving | No user data uploaded; all processing local |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     StealthDetect Mobile App                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React UI  │  │  Capacitor  │  │   Native VPN Service    │  │
│  │   (Vite)    │  │   Bridge    │  │   (DNS Interception)    │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│  ┌──────┴────────────────┴──────────────────────┴──────────┐    │
│  │                  Service Layer                           │    │
│  │  ┌────────────┐ ┌─────────────┐ ┌──────────────────┐    │    │
│  │  │ IoC Engine │ │   Scanner   │ │  Network Monitor │    │    │
│  │  └────────────┘ └─────────────┘ └──────────────────┘    │    │
│  │  ┌────────────┐ ┌─────────────┐ ┌──────────────────┐    │    │
│  │  │  SpyGuard  │ │  Database   │ │   IoC Sync       │    │    │
│  │  └────────────┘ └─────────────┘ └──────────────────┘    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │              Local Storage Layer                           │  │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐ │  │
│  │  │  SQLite (Native)    │  │  localStorage (Web/Preview) │ │  │
│  │  └─────────────────────┘  └─────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ HTTPS
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Edge Functions (Deno)                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │  IoC Routes  │  │ Admin Routes │  │ Health Check     │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                      KV Store                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐   │  │
│  │  │ File Hashes │ │  Packages   │ │ Network Indicators │   │  │
│  │  └─────────────┘ └─────────────┘ └────────────────────┘   │  │
│  │  ┌─────────────┐ ┌─────────────┐                          │  │
│  │  │ Stalkerware │ │Sync Metadata│                          │  │
│  │  └─────────────┘ └─────────────┘                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18.3 + Vite | UI Framework |
| Mobile Bridge | Capacitor 6.x | Native platform access |
| Backend Runtime | Deno (Edge Functions) | Serverless API |
| API Framework | Hono | Lightweight HTTP routing |
| Cloud Database | Supabase KV Store | Threat intelligence storage |
| Local Database | SQLite (Capacitor) | Offline IoC storage |
| Authentication | Supabase Auth (anon key) | API access control |

### 2.3 Deployment Model

- **Cloud Backend:** Supabase Edge Functions
- **Mobile App:** Android (APK), iOS (IPA)
- **Web Preview:** Figma Make / Browser-based testing
- **Update Mechanism:** Over-the-air IoC database sync

---

## 3. Backend Components

### 3.1 Supabase Edge Functions

#### 3.1.1 Main Server (`index.tsx`)

**Purpose:** Entry point for all backend API requests

**Responsibilities:**
- CORS configuration for cross-origin requests
- Request logging middleware
- Route mounting for IoC and Admin endpoints
- Health check endpoint

**Configuration:**
```typescript
// CORS Settings
origin: "*"
allowHeaders: ["Content-Type", "Authorization"]
allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
maxAge: 600 // seconds
```

#### 3.1.2 IoC Routes (`ioc-routes.tsx`)

**Purpose:** Threat intelligence data management

**Endpoints Provided:**
- File hash management
- Package indicator management
- Network indicator management
- Stalkerware signature management
- Combined threat checking

#### 3.1.3 Admin Routes (`admin-routes.tsx`)

**Purpose:** Administrative functions for database management

**Responsibilities:**
- Database initialization
- SpyGuard data import
- Database statistics
- Data cleanup operations

#### 3.1.4 KV Store (`kv_store.tsx`)

**Purpose:** Key-Value storage abstraction layer

**Operations:**
- `get(key)` - Retrieve single value
- `set(key, value)` - Store single value
- `delete(key)` - Remove single value
- `getByPrefix(prefix)` - Batch retrieval by key prefix

**Key Prefixes:**
| Prefix | Data Type |
|--------|-----------|
| `ioc:file_hash:` | File hash indicators |
| `ioc:package:` | Package name indicators |
| `ioc:network:` | Network indicators |
| `stalkerware:` | Stalkerware signatures |
| `sync_metadata:` | Sync tracking data |

### 3.2 Client-Side Services

#### 3.2.1 IoC Engine (`ioc-engine.ts`)

**Purpose:** Core threat detection logic

**Capabilities:**
- File hash comparison against known malware
- Network connection analysis for malicious domains/IPs
- Package name matching for stalkerware detection
- Severity-based threat prioritization

**Key Methods:**
```typescript
analyzeScanResults(scanData: ScanResult): Promise<MatchResult>
checkSingleFileHash(hash: string): Promise<FileHashIoC | null>
checkSingleNetwork(url: string): Promise<NetworkIoC | null>
checkSinglePackage(packageName: string): Promise<PackageIoC | null>
getThreatStats(): Promise<ThreatStats>
```

#### 3.2.2 Database Service (`database.ts`)

**Purpose:** Unified data access layer

**Features:**
- Dual-mode operation (SQLite native / localStorage web)
- Automatic initialization and migration
- Scan history management
- PIN hash storage (encrypted)

**Storage Backends:**
| Platform | Storage | Features |
|----------|---------|----------|
| Android | SQLite | Indexed queries, transactions |
| iOS | SQLite | Indexed queries, transactions |
| Web | localStorage | JSON serialization |

#### 3.2.3 IoC Sync Service (`ioc-sync.ts`)

**Purpose:** Cloud-to-local data synchronization

**Features:**
- Incremental sync (24-hour intervals)
- Offline resilience
- Multi-table sync support
- Sync metadata tracking

**Sync Flow:**
```
1. Check last sync timestamp
2. If > 24 hours, initiate sync
3. Download stalkerware signatures
4. Download network indicators
5. Download package IoCs
6. Download file hashes
7. Update local database
8. Record sync metadata
```

#### 3.2.4 IoC Ingest Service (`ioc-ingest.ts`)

**Purpose:** SQLite database population from All_IOCs.json

**Capabilities:**
- Parses comprehensive IoC JSON file
- Creates indexed SQLite tables
- Supports batch inserts with transactions
- Provides fast indexed lookups

**Tables Created:**
- `ioc_packages` - Package-based detection
- `ioc_file_hashes` - Hash-based detection
- `ioc_network` - Network-based detection
- `scan_history` - Scan records
- `pin_storage` - User authentication
- `sync_metadata` - Sync tracking

#### 3.2.5 Network Monitor (`network-monitor.ts`)

**Purpose:** Real-time network traffic analysis

**Features:**
- VPN-based DNS interception
- Real-time threat matching
- Connection logging
- Threat alerting callbacks

**Integration:**
```typescript
// Start monitoring
await networkMonitor.start();

// Set threat callback
networkMonitor.setOnThreatDetected((threat) => {
  // Handle detected threat
});

// Get current state
const state = networkMonitor.getState();
```

#### 3.2.6 SpyGuard Detector (`spyguard.ts`)

**Purpose:** Stalkerware-specific detection engine

**Detection Methods:**
1. Known package name matching
2. Suspicious app name patterns
3. Dangerous permission combinations
4. Multi-factor behavioral analysis

**Known Stalkerware Categories:**
| Category | Count | Severity |
|----------|-------|----------|
| Commercial Stalkerware | 23+ | Critical |
| Parental Control Apps | 8+ | High |
| GPS Tracking Apps | 6+ | Medium |
| Hidden/Disguised Apps | 4+ | Critical |

#### 3.2.7 System Scanner (`scanner.ts`)

**Purpose:** Comprehensive system security scan

**Scan Phases:**
1. `initializing` - Prepare scan environment
2. `syncing_iocs` - Download latest threat intelligence
3. `scanning_files` - Hash system files
4. `monitoring_network` - Capture network traffic
5. `checking_network` - Analyze captured traffic
6. `analyzing_packages` - Scan installed apps
7. `matching_iocs` - Compare against IoC database
8. `generating_report` - Compile results
9. `completed` - Finalize scan

**Progress Reporting:**
```typescript
interface ScanProgress {
  phase: ScanPhase;
  progress: number; // 0-100
  currentTask: string;
  stats: ScanStats;
  logEntries: string[];
  networkMonitoring: boolean;
  cloudSyncEnabled: boolean;
}
```

---

## 4. Data Models

### 4.1 File Hash IoC

```typescript
interface FileHashIoC {
  hash: string;                    // SHA-256 hash value
  algorithm: 'SHA-256' | 'MD5' | 'SHA-1';
  fileName?: string;               // Original filename if known
  category: 'stalkerware' | 'malware' | 'spyware' | 'tracking' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;                  // e.g., "SpyGuard", "VirusTotal"
  dateAdded: string;               // ISO 8601 timestamp
  metadata?: Record<string, any>;
}
```

### 4.2 Network IoC

```typescript
interface NetworkIoC {
  type: 'domain' | 'ip' | 'url';
  value: string;                   // The actual indicator
  category: 'c2' | 'phishing' | 'tracking' | 'malicious';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
  dateAdded: string;
}
```

### 4.3 Package IoC

```typescript
interface PackageIoC {
  packageName: string;             // e.g., "com.mspy.android"
  platform: 'ios' | 'android' | 'both';
  category: 'stalkerware' | 'spyware' | 'tracking';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
  dateAdded: string;
  signatures?: string[];           // Additional identifiers
}
```

### 4.4 Stalkerware Signature

```typescript
interface StalkerwareSignature {
  id: string;                      // UUID
  package_name: string;
  app_name: string;
  developer?: string;
  website?: string;
  description: string;
  detection_method: string;
  permission_patterns?: string[];
  file_patterns?: string[];
  network_patterns?: string[];
  behavior_patterns?: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  spyguard_verified: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}
```

### 4.5 Scan Result

```typescript
interface ScanResult {
  id: string;                      // Unique scan identifier
  timestamp: string;               // ISO 8601 timestamp
  duration: number;                // Milliseconds
  status: 'completed' | 'interrupted' | 'failed';
  threats: ThreatDetection[];
  stats: {
    filesScanned: number;
    networksChecked: number;
    packagesScanned: number;
    threatsFound: number;
  };
}
```

### 4.6 Threat Detection

```typescript
interface ThreatDetection {
  id: string;
  type: 'file_hash' | 'network' | 'package' | 'behavior';
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  name: string;
  description: string;
  matchedIoC?: string;             // ID or hash of matched IoC
  evidence: Record<string, any>;   // Detection evidence
  detectedAt: string;
  resolved: boolean;
}
```

### 4.7 Network Threat

```typescript
interface NetworkThreat {
  id: string;
  timestamp: string;
  type: 'domain' | 'ip' | 'dns_query';
  indicator: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  appName?: string;
  sourceApp?: string;
  dnsQuery?: DnsRequestEvent;
  source: string;
}
```

---

## 5. API Specification

### 5.1 Base URL

```
https://{project_id}.supabase.co/functions/v1/make-server-91fc533e
```

### 5.2 Authentication

All requests require the Supabase anonymous key in the Authorization header:

```http
Authorization: Bearer {public_anon_key}
Content-Type: application/json
```

### 5.3 Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T12:00:00.000Z",
  "services": ["ioc-management", "spyguard-integration", "threat-intelligence"]
}
```

### 5.4 File Hash Endpoints

#### 5.4.1 Get File Hashes

**Endpoint:** `GET /ioc/file-hashes`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| severity | string | Filter by severity |
| limit | number | Max results (default: 1000) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "hash": "abc123...",
      "algorithm": "SHA-256",
      "category": "malware",
      "severity": "critical",
      "description": "Known malware hash",
      "source": "SpyGuard",
      "created_at": "2025-12-02T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### 5.4.2 Check File Hashes

**Endpoint:** `POST /ioc/file-hashes/check`

**Request Body:**
```json
{
  "hashes": ["hash1", "hash2", "hash3"]
}
```

**Response:**
```json
{
  "matches": [
    {
      "hash": "hash1",
      "category": "stalkerware",
      "severity": "critical",
      "description": "Known stalkerware binary"
    }
  ]
}
```

#### 5.4.3 Add File Hash

**Endpoint:** `POST /ioc/file-hashes`

**Request Body:**
```json
{
  "hash": "abc123...",
  "algorithm": "SHA-256",
  "category": "malware",
  "severity": "high",
  "description": "Description of the threat",
  "source": "Manual"
}
```

**Response:**
```json
{
  "data": { ... },
  "success": true
}
```

### 5.5 Package Endpoints

#### 5.5.1 Get Packages

**Endpoint:** `GET /ioc/packages`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| severity | string | Filter by severity |
| limit | number | Max results (default: 1000) |

#### 5.5.2 Check Packages

**Endpoint:** `POST /ioc/packages/check`

**Request Body:**
```json
{
  "packageNames": ["com.example.app1", "com.example.app2"]
}
```

#### 5.5.3 Add Package

**Endpoint:** `POST /ioc/packages`

**Request Body:**
```json
{
  "package_name": "com.example.stalkerware",
  "category": "stalkerware",
  "severity": "critical",
  "description": "Known stalkerware application",
  "source": "SpyGuard"
}
```

### 5.6 Network Indicator Endpoints

#### 5.6.1 Get Network Indicators

**Endpoint:** `GET /ioc/network`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by type (domain/ip/url) |
| category | string | Filter by category |
| severity | string | Filter by severity |
| limit | number | Max results (default: 1000) |

#### 5.6.2 Check Network Indicators

**Endpoint:** `POST /ioc/network/check`

**Request Body:**
```json
{
  "indicators": ["evil.com", "192.168.1.100"]
}
```

#### 5.6.3 Add Network Indicator

**Endpoint:** `POST /ioc/network`

**Request Body:**
```json
{
  "indicator_type": "domain",
  "indicator_value": "malicious.example.com",
  "category": "c2",
  "severity": "critical",
  "description": "Command and control server",
  "source": "Threat Intel"
}
```

### 5.7 Stalkerware Signature Endpoints

#### 5.7.1 Get Stalkerware Signatures

**Endpoint:** `GET /ioc/stalkerware`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| verified | boolean | Filter by SpyGuard verification |
| severity | string | Filter by severity |
| limit | number | Max results (default: 1000) |

#### 5.7.2 Check Stalkerware

**Endpoint:** `POST /ioc/stalkerware/check`

**Request Body:**
```json
{
  "packageNames": ["com.mspy.android", "com.flexispy"]
}
```

#### 5.7.3 Bulk Import Signatures

**Endpoint:** `POST /ioc/stalkerware/bulk`

**Request Body:**
```json
{
  "signatures": [
    {
      "package_name": "com.example.stalkerware",
      "app_name": "Hidden Tracker",
      "severity": "critical",
      "spyguard_verified": true
    }
  ]
}
```

### 5.8 Combined Check Endpoint

**Endpoint:** `POST /ioc/check-all`

**Purpose:** Efficient single-request threat checking for all IoC types

**Request Body:**
```json
{
  "hashes": ["hash1", "hash2"],
  "packageNames": ["com.app1", "com.app2"],
  "networkIndicators": ["domain1.com", "192.168.1.1"]
}
```

**Response:**
```json
{
  "fileHashMatches": [...],
  "packageMatches": [...],
  "networkMatches": [...],
  "stalkerwareMatches": [...]
}
```

### 5.9 Admin Endpoints

#### 5.9.1 Initialize Database

**Endpoint:** `POST /admin/initialize`

**Purpose:** Populate database with SpyGuard data

**Response:**
```json
{
  "success": true,
  "stats": {
    "stalkerware": 150,
    "network": 200,
    "packages": 100,
    "hashes": 500
  }
}
```

#### 5.9.2 Get Statistics

**Endpoint:** `GET /admin/stats`

**Response:**
```json
{
  "tables": {
    "file_hashes": 500,
    "packages": 100,
    "network": 200,
    "stalkerware": 150
  },
  "lastUpdate": "2025-12-02T12:00:00.000Z"
}
```

---

## 6. Core Services

### 6.1 VPN Service Plugin

**Purpose:** Native Android/iOS VPN for DNS interception

**Interface:**
```typescript
interface VpnServicePlugin {
  startVpn(): Promise<StartVpnResult>;
  stopVpn(): Promise<StopVpnResult>;
  getVpnStatus(): Promise<VpnStatus>;
  checkPermission(): Promise<PermissionResult>;
  requestPermission(): Promise<PermissionResult>;
  addListener(event: 'dnsRequest', callback): Promise<PluginListenerHandle>;
  addListener(event: 'vpnStateChange', callback): Promise<PluginListenerHandle>;
  addListener(event: 'connectionEvent', callback): Promise<PluginListenerHandle>;
}
```

**DNS Request Event:**
```typescript
interface DnsRequestEvent {
  timestamp: string;
  domain: string;
  queryType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'PTR' | 'OTHER';
  sourceApp: string | null;
  sourcePort: number;
  destinationIp: string;
  blocked: boolean;
}
```

**VPN States:**
- `connected` - VPN tunnel active
- `disconnected` - VPN stopped
- `connecting` - VPN starting
- `error` - VPN error occurred

### 6.2 App Scanner Plugin

**Purpose:** Native app enumeration for stalkerware detection

**Interface:**
```typescript
interface AppScannerPlugin {
  getInstalledApps(): Promise<{
    apps: InstalledApp[];
    totalCount: number;
    userApps: number;
    systemApps: number;
  }>;
}

interface InstalledApp {
  packageName: string;
  appName: string;
  permissions: string[];
  isSystemApp: boolean;
}
```

### 6.3 Secure Storage Service

**Purpose:** Platform-appropriate secure data storage

**Operations:**
```typescript
interface SecureStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

**Platform Implementation:**
| Platform | Backend | Security |
|----------|---------|----------|
| Android | Capacitor Preferences | SharedPreferences (encrypted) |
| iOS | Capacitor Preferences | Keychain |
| Web | localStorage | None (preview only) |

### 6.4 Cryptographic Services

**Purpose:** Hash generation and comparison

**Functions:**
```typescript
// Generate SHA-256 hash of string
hashString(input: string): Promise<string>;

// Generate hash of file content
hashFile(fileContent: ArrayBuffer): Promise<string>;

// Constant-time hash comparison
compareHashes(hash1: string, hash2: string): boolean;

// Generate mock file hash for testing
generateMockFileHash(fileName: string): Promise<string>;

// Create stalkerware signature
createStalkerwareSignature(
  packageName: string,
  fileData: ArrayBuffer | null,
  metadata: object
): Promise<StalkerwareSignature>;
```

---

## 7. Database Design

### 7.1 Cloud Database (Supabase KV)

**Key Structure:**
```
ioc:file_hash:{hash}     -> FileHashIoC
ioc:package:{name}       -> PackageIoC
ioc:network:{indicator}  -> NetworkIoC
stalkerware:{package}    -> StalkerwareSignature
sync_metadata:{table}    -> SyncMetadata
```

### 7.2 Local Database (SQLite)

**Schema:**
```sql
-- Package-based IoCs
CREATE TABLE ioc_packages (
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
CREATE TABLE ioc_file_hashes (
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
CREATE TABLE ioc_network (
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

-- Scan History
CREATE TABLE scan_history (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT NOT NULL,
  threats TEXT NOT NULL,
  stats TEXT NOT NULL,
  network_monitoring INTEGER DEFAULT 0
);

-- PIN Storage
CREATE TABLE pin_storage (
  type TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  algorithm TEXT DEFAULT 'SHA-256',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sync Metadata
CREATE TABLE sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 7.3 Indexes

```sql
-- Package indexes
CREATE INDEX idx_packages_name ON ioc_packages(package_name);
CREATE INDEX idx_packages_category ON ioc_packages(category);
CREATE INDEX idx_packages_severity ON ioc_packages(severity);

-- Hash indexes
CREATE INDEX idx_hashes_hash ON ioc_file_hashes(hash);
CREATE INDEX idx_hashes_package ON ioc_file_hashes(package_name);
CREATE INDEX idx_hashes_app ON ioc_file_hashes(app_name);

-- Network indexes
CREATE INDEX idx_network_value ON ioc_network(indicator_value);
CREATE INDEX idx_network_type ON ioc_network(indicator_type);
CREATE INDEX idx_network_app ON ioc_network(app_name);

-- Scan history index
CREATE INDEX idx_scans_timestamp ON scan_history(timestamp DESC);
```

---

## 8. Security Considerations

### 8.1 Data Privacy

| Aspect | Implementation |
|--------|----------------|
| User Data | Never uploaded to cloud |
| Scan Results | Stored locally only |
| Network Traffic | Processed on-device |
| IoC Database | Downloaded, not contributed to |
| PIN Storage | SHA-256 hashed |

### 8.2 API Security

- **Authentication:** Supabase anonymous key (rate-limited)
- **CORS:** Configured for mobile app origins
- **RLS:** Row-level security on all tables
- **TLS:** All communication over HTTPS

### 8.3 Local Security

- **SQLite:** No encryption (device-level protection)
- **PIN:** SHA-256 hashed, stored in secure preferences
- **Duress PIN:** Separate hash for emergency data wipe

### 8.4 VPN Security

- **No Traffic Logging:** Only DNS queries analyzed
- **Local Processing:** No network data leaves device
- **Transparent:** User can see all intercepted queries

---

## 9. Performance Requirements

### 9.1 Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| API Health Check | < 100ms | 500ms |
| Single IoC Lookup | < 50ms | 200ms |
| Batch IoC Check (100 items) | < 500ms | 2s |
| Full IoC Sync | < 30s | 60s |
| Local SQLite Query | < 10ms | 50ms |

### 9.2 Capacity Requirements

| Metric | Current | Target |
|--------|---------|--------|
| IoC Database Size | ~150 stalkerware | 500+ |
| Network Indicators | ~200 domains/IPs | 1000+ |
| File Hashes | ~500 hashes | 5000+ |
| Scan History | Last 50 scans | Last 100 |

### 9.3 Sync Requirements

| Metric | Specification |
|--------|---------------|
| Sync Interval | 24 hours (automatic) |
| Manual Sync | On-demand (user initiated) |
| Bandwidth | < 1MB per full sync |
| Offline Grace | Indefinite (cached data) |

---

## 10. Error Handling

### 10.1 API Error Responses

**Standard Error Format:**
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

**HTTP Status Codes:**
| Code | Meaning | Usage |
|------|---------|-------|
| 200 | Success | Successful request |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid/missing auth |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Error | Server error |

### 10.2 Sync Error Handling

```typescript
interface SyncResult {
  success: boolean;
  stalkerwareCount: number;
  networkCount: number;
  packageCount: number;
  fileHashCount: number;
  errors: string[];     // Partial failures logged
  timestamp: string;
}
```

**Fallback Strategy:**
1. Attempt cloud sync
2. If failed, use cached data
3. Log error for diagnostics
4. Continue with offline mode

### 10.3 Scan Error Handling

**Scan States:**
- `completed` - All phases successful
- `interrupted` - User cancelled
- `failed` - Unrecoverable error

**Partial Results:**
- Failed scans still return partial results
- Network errors don't block package scanning
- Individual IoC lookup failures are logged, not fatal

---

## Appendix A: SpyGuard Integration

### A.1 Data Source

StealthDetect integrates with the SpyGuard project for stalkerware signatures:
- Repository: https://github.com/SpyGuard/SpyGuard
- License: GPL-3.0
- Update Frequency: Weekly

### A.2 Known Stalkerware Database

**Commercial Stalkerware (Critical):**
- mSpy, FlexiSpy, Spyera, Cocospy
- ThetruthSpy, XNSPY, Hoverwatch
- iKeyMonitor, Spyfone, Copy9

**Parental Control (High):**
- Qustodio, MMGuardian, FamiSafe
- Bark, OurPact, Mobicip

**GPS Trackers (Medium):**
- Life360, Family Locator, Glympse

### A.3 Permission Patterns

**Stalkerware Permission Combinations:**
```
READ_SMS + RECEIVE_SMS + READ_CALL_LOG + RECORD_AUDIO
ACCESS_FINE_LOCATION + READ_SMS + READ_CONTACTS
CAMERA + RECORD_AUDIO + READ_CALL_LOG + READ_SMS
SYSTEM_ALERT_WINDOW + READ_CALL_LOG + READ_SMS + ACCESS_FINE_LOCATION
```

---

## Appendix B: API Quick Reference

### B.1 Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /health | Service health check |
| GET | /ioc/file-hashes | List file hashes |
| POST | /ioc/file-hashes | Add file hash |
| POST | /ioc/file-hashes/check | Check file hashes |
| GET | /ioc/packages | List packages |
| POST | /ioc/packages | Add package |
| POST | /ioc/packages/check | Check packages |
| GET | /ioc/network | List network indicators |
| POST | /ioc/network | Add network indicator |
| POST | /ioc/network/check | Check network indicators |
| GET | /ioc/stalkerware | List stalkerware |
| POST | /ioc/stalkerware | Add stalkerware |
| POST | /ioc/stalkerware/check | Check stalkerware |
| POST | /ioc/stalkerware/bulk | Bulk import |
| POST | /ioc/check-all | Combined check |
| POST | /admin/initialize | Init database |
| GET | /admin/stats | Get statistics |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-02 | StealthDetect Team | Initial specification |

---

*This document is part of the StealthDetect project documentation.*
