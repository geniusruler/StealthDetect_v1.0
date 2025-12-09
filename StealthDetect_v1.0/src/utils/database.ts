/**
 * StealthDetect Database
 * Stores Indicators of Compromise (IoCs), scan history, and PIN hashes
 * Uses SQLite on Android, localStorage fallback in browser
 */

import { secureStorage, isNative } from './native';
import { iocIngestService, type ThreatMatch } from './ioc-ingest';

// ==================== Types ====================

export interface FileHashIoC {
  hash: string;
  algorithm: 'SHA-256' | 'MD5' | 'SHA-1';
  fileName?: string;
  category: 'stalkerware' | 'malware' | 'spyware' | 'tracking' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string; // e.g., "SpyGuard", "Manual", "Community"
  dateAdded: string; // ISO date
  metadata?: Record<string, any>;
}

export interface NetworkIoC {
  type: 'domain' | 'ip' | 'url';
  value: string;
  category: 'c2' | 'phishing' | 'tracking' | 'malicious';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
  dateAdded: string;
}

export interface PackageIoC {
  packageName: string; // e.g., "com.example.stalkerware"
  platform: 'ios' | 'android' | 'both';
  category: 'stalkerware' | 'spyware' | 'tracking';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  source: string;
  dateAdded: string;
  signatures?: string[]; // Additional identifiers
}

export interface ScanResult {
  id: string;
  timestamp: string; // ISO date
  duration: number; // milliseconds
  status: 'completed' | 'interrupted' | 'failed';
  threats: ThreatDetection[];
  stats: {
    filesScanned: number;
    networksChecked: number;
    packagesScanned: number;
    threatsFound: number;
  };
}

export interface ThreatDetection {
  id: string;
  type: 'file_hash' | 'network' | 'package' | 'behavior';
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  name: string;
  description: string;
  matchedIoC?: string; // ID or hash of matched IoC
  evidence: Record<string, any>;
  detectedAt: string; // ISO date
  resolved: boolean;
}

export interface PINHash {
  type: 'main' | 'duress';
  hash: string;
  algorithm: 'SHA-256';
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SOSSettings {
  enabled: boolean;
  enableSMS: boolean;
  enableCall: boolean;
  enableAudioRecording: boolean;
  enablePhotoCapture: boolean;
  holdDuration: number; // milliseconds, default 1500
  emergencyNumber: string; // "911"
  lastUpdated: string;
}

export interface SOSActivationLog {
  id: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  actions: {
    smsSent: boolean;
    smsRecipients: string[];
    callMade: boolean;
    audioRecorded: boolean;
    photoTaken: boolean;
  };
  status: 'completed' | 'partial' | 'failed';
  errorDetails?: string;
}

// ==================== Database Keys ====================

const DB_KEYS = {
  FILE_HASHES: 'ioc_file_hashes',
  NETWORK_IOCS: 'ioc_networks',
  PACKAGE_IOCS: 'ioc_packages',
  SCAN_HISTORY: 'scan_history',
  PIN_HASHES: 'pin_hashes',
  LAST_UPDATE: 'ioc_last_update',
  DB_VERSION: 'db_version',
  // SOS Feature
  EMERGENCY_CONTACTS: 'sos_emergency_contacts',
  SOS_SETTINGS: 'sos_settings',
  SOS_ACTIVATION_LOG: 'sos_activation_log',
};

const CURRENT_DB_VERSION = '1.0.0';

// ==================== Database Class ====================

class Database {
  private initialized = false;
  private useSQLite = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Use SQLite on native platforms (Android)
    this.useSQLite = isNative();

    if (this.useSQLite) {
      try {
        await iocIngestService.initialize();
        console.log('[Database] SQLite initialized for native platform');
      } catch (error) {
        console.warn('[Database] SQLite init failed, falling back to localStorage:', error);
        this.useSQLite = false;
      }
    }

    // Check database version and migrate if needed
    const version = await this.getDbVersion();
    if (version !== CURRENT_DB_VERSION) {
      await this.migrate(version, CURRENT_DB_VERSION);
    }

    // Initialize with default IoCs if empty (only for localStorage mode)
    if (!this.useSQLite) {
      const fileHashes = await this.getFileHashes();
      if (fileHashes.length === 0) {
        await this.loadDefaultIoCs();
      }
    }

    this.initialized = true;
  }

  /**
   * Check if using SQLite backend
   */
  isSQLiteEnabled(): boolean {
    return this.useSQLite;
  }

  private async getDbVersion(): Promise<string | null> {
    return await secureStorage.getItem(DB_KEYS.DB_VERSION);
  }

  private async migrate(from: string | null, to: string): Promise<void> {
    console.log(`Migrating database from ${from} to ${to}`);
    // Migration logic here if needed in future
    await secureStorage.setItem(DB_KEYS.DB_VERSION, to);
  }

  // ==================== File Hash IoCs ====================

  async getFileHashes(): Promise<FileHashIoC[]> {
    const data = await secureStorage.getItem(DB_KEYS.FILE_HASHES);
    return data ? JSON.parse(data) : [];
  }

  async addFileHash(ioc: Omit<FileHashIoC, 'dateAdded'>): Promise<void> {
    const hashes = await this.getFileHashes();
    const newIoC: FileHashIoC = {
      ...ioc,
      dateAdded: new Date().toISOString(),
    };
    hashes.push(newIoC);
    await secureStorage.setItem(DB_KEYS.FILE_HASHES, JSON.stringify(hashes));
  }

  async removeFileHash(hash: string): Promise<void> {
    const hashes = await this.getFileHashes();
    const filtered = hashes.filter(h => h.hash !== hash);
    await secureStorage.setItem(DB_KEYS.FILE_HASHES, JSON.stringify(filtered));
  }

  async findFileHash(hash: string): Promise<FileHashIoC | null> {
    // Use SQLite if available (faster indexed lookup)
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

  private threatMatchToFileHash(match: ThreatMatch): FileHashIoC {
    return {
      hash: match.indicator,
      algorithm: 'SHA-256',
      category: match.category as FileHashIoC['category'],
      severity: match.severity,
      description: match.description,
      source: match.source,
      dateAdded: new Date().toISOString(),
    };
  }

  // ==================== Network IoCs ====================

  async getNetworkIoCs(): Promise<NetworkIoC[]> {
    const data = await secureStorage.getItem(DB_KEYS.NETWORK_IOCS);
    return data ? JSON.parse(data) : [];
  }

  async addNetworkIoC(ioc: Omit<NetworkIoC, 'dateAdded'>): Promise<void> {
    const iocs = await this.getNetworkIoCs();
    const newIoC: NetworkIoC = {
      ...ioc,
      dateAdded: new Date().toISOString(),
    };
    iocs.push(newIoC);
    await secureStorage.setItem(DB_KEYS.NETWORK_IOCS, JSON.stringify(iocs));
  }

  async findNetworkIoC(value: string): Promise<NetworkIoC | null> {
    // Use SQLite if available (faster indexed lookup with subdomain matching)
    if (this.useSQLite) {
      const match = await iocIngestService.findNetworkIndicator(value);
      if (match) {
        return this.threatMatchToNetworkIoC(match);
      }
      return null;
    }

    // Fallback to localStorage
    const iocs = await this.getNetworkIoCs();
    return iocs.find(ioc => ioc.value === value) || null;
  }

  private threatMatchToNetworkIoC(match: ThreatMatch): NetworkIoC {
    return {
      type: match.indicatorType.includes('ip') ? 'ip' : 'domain',
      value: match.indicator,
      category: match.category as NetworkIoC['category'],
      severity: match.severity,
      description: match.description,
      source: match.source,
      dateAdded: new Date().toISOString(),
    };
  }

  // ==================== Package IoCs ====================

  async getPackageIoCs(): Promise<PackageIoC[]> {
    const data = await secureStorage.getItem(DB_KEYS.PACKAGE_IOCS);
    return data ? JSON.parse(data) : [];
  }

  async addPackageIoC(ioc: Omit<PackageIoC, 'dateAdded'>): Promise<void> {
    const iocs = await this.getPackageIoCs();
    const newIoC: PackageIoC = {
      ...ioc,
      dateAdded: new Date().toISOString(),
    };
    iocs.push(newIoC);
    await secureStorage.setItem(DB_KEYS.PACKAGE_IOCS, JSON.stringify(iocs));
  }

  async findPackageIoC(packageName: string): Promise<PackageIoC | null> {
    // Use SQLite if available (faster indexed lookup)
    if (this.useSQLite) {
      const match = await iocIngestService.findPackageByName(packageName);
      if (match) {
        return this.threatMatchToPackageIoC(match);
      }
      return null;
    }

    // Fallback to localStorage
    const iocs = await this.getPackageIoCs();
    return iocs.find(ioc => ioc.packageName === packageName) || null;
  }

  /**
   * Check multiple packages at once (batch query - only available with SQLite)
   */
  async findPackages(packageNames: string[]): Promise<PackageIoC[]> {
    if (this.useSQLite) {
      const matches = await iocIngestService.findPackages(packageNames);
      return matches.map(m => this.threatMatchToPackageIoC(m));
    }

    // Fallback: check each package individually
    const iocs = await this.getPackageIoCs();
    return iocs.filter(ioc => packageNames.includes(ioc.packageName));
  }

  private threatMatchToPackageIoC(match: ThreatMatch): PackageIoC {
    return {
      packageName: match.indicator,
      platform: 'android',
      category: match.category as PackageIoC['category'],
      severity: match.severity,
      description: match.description,
      source: match.source,
      dateAdded: new Date().toISOString(),
    };
  }

  // ==================== Scan History ====================

  async getScanHistory(limit?: number): Promise<ScanResult[]> {
    const data = await secureStorage.getItem(DB_KEYS.SCAN_HISTORY);
    const history: ScanResult[] = data ? JSON.parse(data) : [];
    
    // Sort by timestamp descending
    history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return limit ? history.slice(0, limit) : history;
  }

  async addScanResult(scan: ScanResult): Promise<void> {
    const history = await this.getScanHistory();
    history.push(scan);
    
    // Keep only last 50 scans
    const limited = history.slice(-50);
    
    await secureStorage.setItem(DB_KEYS.SCAN_HISTORY, JSON.stringify(limited));
  }

  async getLatestScan(): Promise<ScanResult | null> {
    const history = await this.getScanHistory(1);
    return history[0] || null;
  }

  async clearScanHistory(): Promise<void> {
    await secureStorage.setItem(DB_KEYS.SCAN_HISTORY, JSON.stringify([]));
  }

  // ==================== PIN Hashes ====================

  async getPINHashes(): Promise<PINHash[]> {
    const data = await secureStorage.getItem(DB_KEYS.PIN_HASHES);
    return data ? JSON.parse(data) : [];
  }

  async setPINHash(type: 'main' | 'duress', hash: string): Promise<void> {
    const pins = await this.getPINHashes();
    const existing = pins.find(p => p.type === type);
    
    const now = new Date().toISOString();
    
    if (existing) {
      existing.hash = hash;
      existing.updatedAt = now;
    } else {
      pins.push({
        type,
        hash,
        algorithm: 'SHA-256',
        createdAt: now,
        updatedAt: now,
      });
    }
    
    await secureStorage.setItem(DB_KEYS.PIN_HASHES, JSON.stringify(pins));
  }

  async getPINHash(type: 'main' | 'duress'): Promise<string | null> {
    const pins = await this.getPINHashes();
    const pin = pins.find(p => p.type === type);
    return pin ? pin.hash : null;
  }

  // ==================== Emergency Contacts ====================

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const data = await secureStorage.getItem(DB_KEYS.EMERGENCY_CONTACTS);
    return data ? JSON.parse(data) : [];
  }

  async addEmergencyContact(contact: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmergencyContact> {
    const contacts = await this.getEmergencyContacts();
    const now = new Date().toISOString();

    const newContact: EmergencyContact = {
      ...contact,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    // If this is marked as primary, unmark others
    if (newContact.isPrimary) {
      contacts.forEach(c => c.isPrimary = false);
    }

    contacts.push(newContact);
    await secureStorage.setItem(DB_KEYS.EMERGENCY_CONTACTS, JSON.stringify(contacts));
    return newContact;
  }

  async updateEmergencyContact(id: string, updates: Partial<Omit<EmergencyContact, 'id' | 'createdAt'>>): Promise<void> {
    const contacts = await this.getEmergencyContacts();
    const index = contacts.findIndex(c => c.id === id);

    if (index === -1) return;

    // If setting as primary, unmark others
    if (updates.isPrimary) {
      contacts.forEach(c => c.isPrimary = false);
    }

    contacts[index] = {
      ...contacts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await secureStorage.setItem(DB_KEYS.EMERGENCY_CONTACTS, JSON.stringify(contacts));
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    const contacts = await this.getEmergencyContacts();
    const filtered = contacts.filter(c => c.id !== id);
    await secureStorage.setItem(DB_KEYS.EMERGENCY_CONTACTS, JSON.stringify(filtered));
  }

  // ==================== SOS Settings ====================

  async getSOSSettings(): Promise<SOSSettings> {
    const data = await secureStorage.getItem(DB_KEYS.SOS_SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
    // Return default settings
    return {
      enabled: true,
      enableSMS: true,
      enableCall: true,
      enableAudioRecording: false,
      enablePhotoCapture: false,
      holdDuration: 1500,
      emergencyNumber: '911',
      lastUpdated: new Date().toISOString(),
    };
  }

  async updateSOSSettings(updates: Partial<SOSSettings>): Promise<void> {
    const current = await this.getSOSSettings();
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    await secureStorage.setItem(DB_KEYS.SOS_SETTINGS, JSON.stringify(updated));
  }

  // ==================== SOS Activation Log ====================

  async getSOSActivationLogs(limit?: number): Promise<SOSActivationLog[]> {
    const data = await secureStorage.getItem(DB_KEYS.SOS_ACTIVATION_LOG);
    const logs: SOSActivationLog[] = data ? JSON.parse(data) : [];

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return limit ? logs.slice(0, limit) : logs;
  }

  async addSOSActivationLog(log: Omit<SOSActivationLog, 'id' | 'timestamp'>): Promise<SOSActivationLog> {
    const logs = await this.getSOSActivationLogs();

    const newLog: SOSActivationLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    logs.push(newLog);

    // Keep only last 100 logs
    const limited = logs.slice(-100);

    await secureStorage.setItem(DB_KEYS.SOS_ACTIVATION_LOG, JSON.stringify(limited));
    return newLog;
  }

  // ==================== Default IoCs ====================

  private async loadDefaultIoCs(): Promise<void> {
    // SpyGuard known stalkerware packages (from their repo)
    const spyGuardPackages: Omit<PackageIoC, 'dateAdded'>[] = [
      {
        packageName: 'com.spy.phone.app',
        platform: 'both',
        category: 'stalkerware',
        severity: 'critical',
        description: 'Known stalkerware application',
        source: 'SpyGuard',
      },
      {
        packageName: 'com.mspy.android',
        platform: 'android',
        category: 'stalkerware',
        severity: 'critical',
        description: 'mSpy stalkerware',
        source: 'SpyGuard',
      },
      {
        packageName: 'com.flexispy',
        platform: 'both',
        category: 'stalkerware',
        severity: 'critical',
        description: 'FlexiSpy monitoring software',
        source: 'SpyGuard',
      },
    ];

    // Add default packages
    for (const pkg of spyGuardPackages) {
      await this.addPackageIoC(pkg);
    }

    console.log('✅ Loaded default IoCs from SpyGuard database');
  }

  // ==================== Utility Methods ====================

  async getIoCStats(): Promise<{
    fileHashes: number;
    networkIoCs: number;
    packageIoCs: number;
    lastUpdate: string | null;
  }> {
    // Use SQLite stats if available
    if (this.useSQLite) {
      const stats = await iocIngestService.getStats();
      return {
        fileHashes: stats.hashes,
        networkIoCs: stats.network,
        packageIoCs: stats.packages,
        lastUpdate: stats.lastSync,
      };
    }

    // Fallback to localStorage
    const [fileHashes, networkIoCs, packageIoCs, lastUpdate] = await Promise.all([
      this.getFileHashes(),
      this.getNetworkIoCs(),
      this.getPackageIoCs(),
      secureStorage.getItem(DB_KEYS.LAST_UPDATE),
    ]);

    return {
      fileHashes: fileHashes.length,
      networkIoCs: networkIoCs.length,
      packageIoCs: packageIoCs.length,
      lastUpdate,
    };
  }

  /**
   * Get the IoC ingest service for direct SQLite operations
   */
  getIngestService() {
    return iocIngestService;
  }

  async updateLastUpdate(): Promise<void> {
    await secureStorage.setItem(DB_KEYS.LAST_UPDATE, new Date().toISOString());
  }

  async clearAllIoCs(): Promise<void> {
    await secureStorage.setItem(DB_KEYS.FILE_HASHES, JSON.stringify([]));
    await secureStorage.setItem(DB_KEYS.NETWORK_IOCS, JSON.stringify([]));
    await secureStorage.setItem(DB_KEYS.PACKAGE_IOCS, JSON.stringify([]));
  }
}

// Export singleton instance
export const db = new Database();

// Initialize on import
db.initialize().catch(console.error);
