/**
 * IoC Ingestion Service
 * Parses All_IOCs.json and loads into SQLite database
 * Provides indexed queries for fast threat detection
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import type {
  AllIOCs,
  MalwareApp,
  HashInfo,
  IoCPackageRow,
  IoCNetworkRow,
  IoCFileHashRow,
  Severity,
  NetworkIndicatorType,
} from './ioc-types';
import { categoryToSeverity, isValidAllIOCs } from './ioc-types';

// ==================== Constants ====================

const DB_NAME = 'stealthdetect_ioc';
const DB_VERSION = 1;

// ==================== SQL Schema ====================

const CREATE_TABLES_SQL = `
-- Package-based IoCs (stalkerware, spyware detection)
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

-- File Hash IoCs (SHA256)
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

-- Network IoCs (domains, IPs, C2 servers)
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

-- Scan History
CREATE TABLE IF NOT EXISTS scan_history (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT NOT NULL,
  threats TEXT NOT NULL,
  stats TEXT NOT NULL,
  network_monitoring INTEGER DEFAULT 0
);

-- PIN Storage (encrypted)
CREATE TABLE IF NOT EXISTS pin_storage (
  type TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  algorithm TEXT DEFAULT 'SHA-256',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sync Metadata
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

const CREATE_INDEXES_SQL = `
-- Package indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_packages_name ON ioc_packages(package_name);
CREATE INDEX IF NOT EXISTS idx_packages_category ON ioc_packages(category);
CREATE INDEX IF NOT EXISTS idx_packages_severity ON ioc_packages(severity);

-- Hash indexes
CREATE INDEX IF NOT EXISTS idx_hashes_hash ON ioc_file_hashes(hash);
CREATE INDEX IF NOT EXISTS idx_hashes_package ON ioc_file_hashes(package_name);
CREATE INDEX IF NOT EXISTS idx_hashes_app ON ioc_file_hashes(app_name);

-- Network indexes
CREATE INDEX IF NOT EXISTS idx_network_value ON ioc_network(indicator_value);
CREATE INDEX IF NOT EXISTS idx_network_type ON ioc_network(indicator_type);
CREATE INDEX IF NOT EXISTS idx_network_app ON ioc_network(app_name);

-- Scan history index
CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scan_history(timestamp DESC);
`;

// ==================== IoC Ingest Service ====================

export interface IngestStats {
  packagesLoaded: number;
  hashesLoaded: number;
  networkLoaded: number;
  errors: string[];
  duration: number;
}

export interface ThreatMatch {
  indicator: string;
  indicatorType: string;
  appName: string;
  category: string;
  severity: Severity;
  description: string;
  source: string;
}

class IoCIngestService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private initialized = false;
  private isNativeEnvironment = false;

  /**
   * Initialize the SQLite database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check if running in native Capacitor environment
    this.isNativeEnvironment = this.checkNativeEnvironment();

    if (!this.isNativeEnvironment) {
      console.log('[IoCIngest] Running in web mode - SQLite disabled');
      this.initialized = true;
      return;
    }

    try {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      // Check connection consistency
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
      console.log('[IoCIngest] SQLite database initialized');
    } catch (error) {
      console.error('[IoCIngest] Failed to initialize SQLite:', error);
      throw error;
    }
  }

  private checkNativeEnvironment(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        'Capacitor' in window &&
        (window as any).Capacitor?.isNativePlatform?.() === true
      );
    } catch {
      return false;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    await this.db.execute(CREATE_TABLES_SQL);
    await this.db.execute(CREATE_INDEXES_SQL);
    console.log('[IoCIngest] Tables and indexes created');
  }

  /**
   * Load All_IOCs.json data into SQLite database
   */
  async loadIOCs(jsonData: AllIOCs): Promise<IngestStats> {
    const startTime = Date.now();
    const stats: IngestStats = {
      packagesLoaded: 0,
      hashesLoaded: 0,
      networkLoaded: 0,
      errors: [],
      duration: 0,
    };

    if (!isValidAllIOCs(jsonData)) {
      stats.errors.push('Invalid All_IOCs.json structure');
      return stats;
    }

    if (!this.isNativeEnvironment || !this.db) {
      console.log('[IoCIngest] Skipping SQLite load - not in native environment');
      stats.duration = Date.now() - startTime;
      return stats;
    }

    try {
      // Use transaction for atomic insert
      await this.db.beginTransaction();

      for (const app of jsonData.apps) {
        try {
          // Insert Android packages
          if (app.platforms?.android?.packages) {
            for (const pkg of app.platforms.android.packages) {
              await this.insertPackage(app, pkg);
              stats.packagesLoaded++;
            }
          }

          // Insert iOS bundles as packages too
          if (app.platforms?.ios?.bundles) {
            for (const bundle of app.platforms.ios.bundles) {
              await this.insertPackage(app, bundle);
              stats.packagesLoaded++;
            }
          }

          // Insert file hashes
          if (app.hashes?.sha256) {
            for (const [hash, info] of Object.entries(app.hashes.sha256)) {
              await this.insertHash(app, hash, info);
              stats.hashesLoaded++;
            }
          }

          // Insert C2 domains
          if (app.network?.c2?.domains) {
            for (const domain of app.network.c2.domains) {
              await this.insertNetwork('c2_domain', domain, app);
              stats.networkLoaded++;
            }
          }

          // Insert C2 IPs
          if (app.network?.c2?.ips) {
            for (const ip of app.network.c2.ips) {
              await this.insertNetwork('c2_ip', ip, app);
              stats.networkLoaded++;
            }
          }

          // Insert resolved hosts
          if (app.network?.resolved_hosts) {
            for (const host of app.network.resolved_hosts) {
              await this.insertNetwork('resolved_host', host, app);
              stats.networkLoaded++;
            }
          }

          // Insert websites as domains
          if (app.websites) {
            for (const website of app.websites) {
              await this.insertNetwork('domain', website, app);
              stats.networkLoaded++;
            }
          }
        } catch (error) {
          stats.errors.push(`Error processing app ${app.name}: ${error}`);
        }
      }

      await this.db.commitTransaction();

      // Update sync metadata
      await this.updateSyncMetadata('last_ioc_load', new Date().toISOString());
      await this.updateSyncMetadata('ioc_version', jsonData.generated_at);
      await this.updateSyncMetadata('apps_count', String(jsonData.stats.apps_total));

      console.log('[IoCIngest] IoCs loaded successfully:', stats);
    } catch (error) {
      await this.db?.rollbackTransaction();
      stats.errors.push(`Transaction failed: ${error}`);
      console.error('[IoCIngest] Failed to load IoCs:', error);
    }

    stats.duration = Date.now() - startTime;
    return stats;
  }

  // ==================== Insert Methods ====================

  private async insertPackage(app: MalwareApp, packageName: string): Promise<void> {
    if (!this.db) return;

    const sql = `
      INSERT OR REPLACE INTO ioc_packages
      (package_name, app_name, category, severity, description, source, platforms, aliases, date_added, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = new Date().toISOString();
    const sources = Object.values(app.sources).flat().join(', ');

    await this.db.run(sql, [
      packageName,
      app.name,
      app.category,
      categoryToSeverity(app.category),
      `Known ${app.category} application: ${app.name}`,
      sources,
      JSON.stringify(app.platforms || {}),
      JSON.stringify(app.aliases || []),
      now,
      now,
    ]);
  }

  private async insertHash(app: MalwareApp, hash: string, info: HashInfo): Promise<void> {
    if (!this.db) return;

    const sql = `
      INSERT OR REPLACE INTO ioc_file_hashes
      (hash, algorithm, package_name, certificate, version, app_name, category, severity, description, source, date_added)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const sources = Object.values(app.sources).flat().join(', ');

    await this.db.run(sql, [
      hash.toLowerCase(),
      'SHA-256',
      info.package || null,
      info.certificate || null,
      info.version || null,
      app.name,
      app.category,
      categoryToSeverity(app.category),
      `${app.name} binary hash`,
      sources,
      new Date().toISOString(),
    ]);
  }

  private async insertNetwork(
    type: NetworkIndicatorType,
    value: string,
    app: MalwareApp
  ): Promise<void> {
    if (!this.db) return;

    const sql = `
      INSERT OR REPLACE INTO ioc_network
      (indicator_type, indicator_value, app_name, category, severity, description, source, date_added)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const sources = Object.values(app.sources).flat().join(', ');
    const description =
      type === 'c2_domain' || type === 'c2_ip'
        ? `${app.name} command & control infrastructure`
        : `${app.name} associated network indicator`;

    await this.db.run(sql, [
      type,
      value.toLowerCase(),
      app.name,
      app.category,
      categoryToSeverity(app.category),
      description,
      sources,
      new Date().toISOString(),
    ]);
  }

  private async updateSyncMetadata(key: string, value: string): Promise<void> {
    if (!this.db) return;

    const sql = `
      INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
      VALUES (?, ?, ?)
    `;

    await this.db.run(sql, [key, value, new Date().toISOString()]);
  }

  // ==================== Query Methods ====================

  /**
   * Find a package by name (exact match)
   */
  async findPackageByName(packageName: string): Promise<ThreatMatch | null> {
    if (!this.isNativeEnvironment || !this.db) return null;

    const result = await this.db.query(
      'SELECT * FROM ioc_packages WHERE package_name = ?',
      [packageName]
    );

    const row = result.values?.[0] as IoCPackageRow | undefined;
    if (!row) return null;

    return {
      indicator: row.package_name,
      indicatorType: 'package',
      appName: row.app_name,
      category: row.category,
      severity: row.severity as Severity,
      description: row.description || '',
      source: row.source,
    };
  }

  /**
   * Find a hash by SHA-256 value
   */
  async findHashBySHA256(hash: string): Promise<ThreatMatch | null> {
    if (!this.isNativeEnvironment || !this.db) return null;

    const result = await this.db.query(
      'SELECT * FROM ioc_file_hashes WHERE hash = ? AND algorithm = ?',
      [hash.toLowerCase(), 'SHA-256']
    );

    const row = result.values?.[0] as IoCFileHashRow | undefined;
    if (!row) return null;

    return {
      indicator: row.hash,
      indicatorType: 'file_hash',
      appName: row.app_name,
      category: row.category,
      severity: row.severity as Severity,
      description: row.description || '',
      source: row.source,
    };
  }

  /**
   * Find network indicator (domain/IP) with subdomain matching
   */
  async findNetworkIndicator(value: string): Promise<ThreatMatch | null> {
    if (!this.isNativeEnvironment || !this.db) return null;

    const normalizedValue = value.toLowerCase();

    // Try exact match first
    let result = await this.db.query(
      'SELECT * FROM ioc_network WHERE indicator_value = ?',
      [normalizedValue]
    );

    // Try subdomain match (e.g., "api.evil.com" matches "evil.com")
    if (!result.values?.length) {
      result = await this.db.query(
        `SELECT * FROM ioc_network
         WHERE ? LIKE '%.' || indicator_value
         OR indicator_value LIKE '%.' || ?
         LIMIT 1`,
        [normalizedValue, normalizedValue]
      );
    }

    const row = result.values?.[0] as IoCNetworkRow | undefined;
    if (!row) return null;

    return {
      indicator: row.indicator_value,
      indicatorType: row.indicator_type,
      appName: row.app_name,
      category: row.category,
      severity: row.severity as Severity,
      description: row.description || '',
      source: row.source,
    };
  }

  /**
   * Check multiple packages at once (batch query)
   */
  async findPackages(packageNames: string[]): Promise<ThreatMatch[]> {
    if (!this.isNativeEnvironment || !this.db || packageNames.length === 0) return [];

    const placeholders = packageNames.map(() => '?').join(',');
    const result = await this.db.query(
      `SELECT * FROM ioc_packages WHERE package_name IN (${placeholders})`,
      packageNames
    );

    return (result.values || []).map((row: any) => ({
      indicator: row.package_name,
      indicatorType: 'package',
      appName: row.app_name,
      category: row.category,
      severity: row.severity as Severity,
      description: row.description || '',
      source: row.source,
    }));
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    packages: number;
    hashes: number;
    network: number;
    lastSync: string | null;
  }> {
    if (!this.isNativeEnvironment || !this.db) {
      return { packages: 0, hashes: 0, network: 0, lastSync: null };
    }

    const [packagesResult, hashesResult, networkResult, syncResult] = await Promise.all([
      this.db.query('SELECT COUNT(*) as count FROM ioc_packages'),
      this.db.query('SELECT COUNT(*) as count FROM ioc_file_hashes'),
      this.db.query('SELECT COUNT(*) as count FROM ioc_network'),
      this.db.query("SELECT value FROM sync_metadata WHERE key = 'last_ioc_load'"),
    ]);

    return {
      packages: packagesResult.values?.[0]?.count || 0,
      hashes: hashesResult.values?.[0]?.count || 0,
      network: networkResult.values?.[0]?.count || 0,
      lastSync: syncResult.values?.[0]?.value || null,
    };
  }

  /**
   * Clear all IoC data (for refresh)
   */
  async clearAll(): Promise<void> {
    if (!this.isNativeEnvironment || !this.db) return;

    await this.db.execute('DELETE FROM ioc_packages');
    await this.db.execute('DELETE FROM ioc_file_hashes');
    await this.db.execute('DELETE FROM ioc_network');
    console.log('[IoCIngest] All IoC data cleared');
  }

  /**
   * Check if database needs to be populated
   */
  async needsPopulation(): Promise<boolean> {
    if (!this.isNativeEnvironment) return false;

    const stats = await this.getStats();
    return stats.packages === 0 && stats.hashes === 0 && stats.network === 0;
  }

  /**
   * Check if service is running in native mode
   */
  isNative(): boolean {
    return this.isNativeEnvironment;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.sqlite && this.db) {
      await this.sqlite.closeConnection(DB_NAME, false);
      this.db = null;
    }
    this.initialized = false;
  }
}

// Export singleton instance
export const iocIngestService = new IoCIngestService();
