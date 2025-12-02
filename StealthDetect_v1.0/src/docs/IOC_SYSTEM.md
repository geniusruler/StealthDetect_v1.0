# Indicators of Compromise (IoC) System

Documentation for the threat intelligence detection system.

## Overview

The IoC system detects threats using three categories:

1. **Stalkerware Signatures** - Known stalkerware app identifiers
2. **Network Indicators** - Malicious C2 server domains
3. **File Hashes** - Known malware file signatures

## Architecture

### Data Storage (KV Store)

All IoC data is stored in Supabase KV store with these key prefixes:

- `ioc:stalkerware:{id}` - Stalkerware signatures
- `ioc:network:{id}` - Network indicators
- `ioc:file:{id}` - File hashes

### Detection Engine (`/utils/ioc-engine.ts`)

**Stalkerware Detection**
```typescript
const result = await detectStalkerware(installedApps);
// Returns matches based on package names and signatures
```

**Network Detection**
```typescript
const result = await detectMaliciousNetwork(connections);
// Returns matches based on domain/IP indicators
```

**File Hash Detection**
```typescript
const result = await detectMaliciousFiles(fileHashes);
// Returns matches based on hash comparison
```

### Data Source

Based on **SpyGuard** methodology:
- 27+ real stalkerware signatures
- 15+ verified C2 domains
- Privacy-preserving hash comparison

## API Endpoints

### Get IoC Data

```bash
# Get all stalkerware signatures
GET /make-server-91fc533e/ioc/stalkerware

# Get network indicators
GET /make-server-91fc533e/ioc/network

# Get file hashes
GET /make-server-91fc533e/ioc/files
```

### Populate Database (Admin)

```bash
POST /make-server-91fc533e/admin/populate
```

## Privacy

✅ Only hash comparisons, no actual files stored  
✅ All processing done locally  
✅ Threat intelligence downloaded, not uploaded  
✅ No personal data in IoC system

## Updates

Threat intelligence is updated from the cloud database but can be cached locally for offline operation.

Sync frequency: On-demand (user initiated)
