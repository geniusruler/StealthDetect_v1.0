/**
 * IoC Synchronization Service
 * Downloads threat intelligence from Supabase and stores locally
 * Implements offline-first architecture
 */

import { projectId, publicAnonKey } from './supabase/info';
import { db } from './database';

const SUPABASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-91fc533e`;

interface SyncResult {
  success: boolean;
  stalkerwareCount: number;
  networkCount: number;
  packageCount: number;
  fileHashCount: number;
  errors: string[];
  timestamp: string;
}

interface SyncMetadata {
  lastSync: string;
  recordCount: number;
  version: number;
}

/**
 * Fetch IoC data from Supabase backend
 */
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

/**
 * Sync stalkerware signatures from Supabase to local storage
 */
async function syncStalkerwareSignatures(): Promise<number> {
  try {
    console.log('Syncing stalkerware signatures...');
    
    const result = await fetchIoCData('ioc/stalkerware', { limit: '1000' });
    const signatures = result.data || [];

    // Clear existing stalkerware data
    const existingKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('stalkerware_')
    );
    existingKeys.forEach(key => localStorage.removeItem(key));

    // Store each signature
    for (const signature of signatures) {
      const key = `stalkerware_${signature.package_name}`;
      localStorage.setItem(key, JSON.stringify(signature));
      
      // Also add to package IoCs for backward compatibility
      await db.addPackageIoC({
        packageName: signature.package_name,
        category: 'stalkerware',
        severity: signature.severity,
        description: signature.description || signature.app_name,
        source: 'SpyGuard',
        metadata: {
          app_name: signature.app_name,
          spyguard_verified: signature.spyguard_verified,
          permission_patterns: signature.permission_patterns,
        },
      });
    }

    // Update local sync metadata
    localStorage.setItem('sync_stalkerware_signatures', JSON.stringify({
      lastSync: new Date().toISOString(),
      recordCount: signatures.length,
      version: 1,
    }));

    console.log(`✓ Synced ${signatures.length} stalkerware signatures`);
    return signatures.length;
  } catch (error) {
    console.error('Error syncing stalkerware signatures:', error);
    throw error;
  }
}

/**
 * Sync network indicators from Supabase to local storage
 */
async function syncNetworkIndicators(): Promise<number> {
  try {
    console.log('Syncing network indicators...');
    
    const result = await fetchIoCData('ioc/network', { limit: '1000' });
    const indicators = result.data || [];

    // Clear existing network data
    const existingKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('network_')
    );
    existingKeys.forEach(key => localStorage.removeItem(key));

    // Store each indicator
    for (const indicator of indicators) {
      const key = `network_${indicator.indicator_type}_${indicator.indicator_value}`;
      localStorage.setItem(key, JSON.stringify(indicator));
      
      // Also add to database
      await db.addNetworkIoC({
        type: indicator.indicator_type,
        value: indicator.indicator_value,
        category: indicator.category,
        severity: indicator.severity,
        description: indicator.description,
        source: indicator.source,
      });
    }

    // Update local sync metadata
    localStorage.setItem('sync_network_indicators', JSON.stringify({
      lastSync: new Date().toISOString(),
      recordCount: indicators.length,
      version: 1,
    }));

    console.log(`✓ Synced ${indicators.length} network indicators`);
    return indicators.length;
  } catch (error) {
    console.error('Error syncing network indicators:', error);
    throw error;
  }
}

/**
 * Sync package IoCs from Supabase to local storage
 */
async function syncPackageIoCs(): Promise<number> {
  try {
    console.log('Syncing package IoCs...');
    
    const result = await fetchIoCData('ioc/packages', { limit: '1000' });
    const packages = result.data || [];

    // Store each package
    for (const pkg of packages) {
      await db.addPackageIoC({
        packageName: pkg.package_name,
        category: pkg.category,
        severity: pkg.severity,
        description: pkg.description,
        source: pkg.source,
        metadata: pkg.metadata,
      });
    }

    // Update local sync metadata
    localStorage.setItem('sync_package_iocs', JSON.stringify({
      lastSync: new Date().toISOString(),
      recordCount: packages.length,
      version: 1,
    }));

    console.log(`✓ Synced ${packages.length} package IoCs`);
    return packages.length;
  } catch (error) {
    console.error('Error syncing package IoCs:', error);
    throw error;
  }
}

/**
 * Sync file hash IoCs from Supabase to local storage
 */
async function syncFileHashIoCs(): Promise<number> {
  try {
    console.log('Syncing file hash IoCs...');
    
    const result = await fetchIoCData('ioc/file-hashes', { limit: '1000' });
    const fileHashes = result.data || [];

    // Store each file hash
    for (const hash of fileHashes) {
      await db.addFileHash({
        hash: hash.hash,
        algorithm: hash.algorithm,
        category: hash.category,
        severity: hash.severity,
        description: hash.description,
        source: hash.source,
      });
    }

    // Update local sync metadata
    localStorage.setItem('sync_file_hashes', JSON.stringify({
      lastSync: new Date().toISOString(),
      recordCount: fileHashes.length,
      version: 1,
    }));

    console.log(`✓ Synced ${fileHashes.length} file hash IoCs`);
    return fileHashes.length;
  } catch (error) {
    console.error('Error syncing file hash IoCs:', error);
    throw error;
  }
}

/**
 * Check if sync is needed (based on last sync time)
 */
export function isSyncNeeded(): boolean {
  const syncMetadata = localStorage.getItem('sync_stalkerware_signatures');
  
  if (!syncMetadata) {
    return true; // Never synced before
  }

  try {
    const metadata: SyncMetadata = JSON.parse(syncMetadata);
    const lastSync = new Date(metadata.lastSync);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    // Sync every 24 hours
    return hoursSinceSync >= 24;
  } catch (error) {
    console.error('Error checking sync metadata:', error);
    return true;
  }
}

/**
 * Get last sync information
 */
export function getLastSyncInfo(): { lastSync: string; recordCount: number } | null {
  const syncMetadata = localStorage.getItem('sync_stalkerware_signatures');
  
  if (!syncMetadata) {
    return null;
  }

  try {
    const metadata: SyncMetadata = JSON.parse(syncMetadata);
    return {
      lastSync: metadata.lastSync,
      recordCount: metadata.recordCount,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Perform full IoC sync from Supabase to local storage
 */
export async function syncIoCs(): Promise<SyncResult> {
  console.log('Starting full IoC sync...');
  
  const result: SyncResult = {
    success: false,
    stalkerwareCount: 0,
    networkCount: 0,
    packageCount: 0,
    fileHashCount: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Sync stalkerware signatures
    try {
      result.stalkerwareCount = await syncStalkerwareSignatures();
    } catch (error) {
      result.errors.push(`Stalkerware sync failed: ${error}`);
    }

    // Sync network indicators
    try {
      result.networkCount = await syncNetworkIndicators();
    } catch (error) {
      result.errors.push(`Network sync failed: ${error}`);
    }

    // Sync package IoCs
    try {
      result.packageCount = await syncPackageIoCs();
    } catch (error) {
      result.errors.push(`Package sync failed: ${error}`);
    }

    // Sync file hashes
    try {
      result.fileHashCount = await syncFileHashIoCs();
    } catch (error) {
      result.errors.push(`File hash sync failed: ${error}`);
    }

    result.success = result.errors.length === 0;
    
    // Store overall sync metadata
    localStorage.setItem('last_full_sync', JSON.stringify({
      timestamp: result.timestamp,
      success: result.success,
      counts: {
        stalkerware: result.stalkerwareCount,
        network: result.networkCount,
        packages: result.packageCount,
        fileHashes: result.fileHashCount,
      },
    }));

    console.log('✓ Full IoC sync complete', result);
    return result;
  } catch (error) {
    console.error('Exception during IoC sync:', error);
    result.errors.push(`Sync exception: ${error}`);
    return result;
  }
}

/**
 * Initialize database by importing SpyGuard data
 * This should be called once to populate the Supabase database
 */
export async function initializeDatabase(): Promise<any> {
  try {
    console.log('Initializing database with SpyGuard data...');
    
    const response = await fetch(`${SUPABASE_URL}/admin/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize database: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✓ Database initialized:', result);
    
    return result;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get database statistics from Supabase
 */
export async function getDatabaseStats(): Promise<any> {
  try {
    const response = await fetch(`${SUPABASE_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching database stats:', error);
    throw error;
  }
}

/**
 * Check specific package names against Supabase database
 * (For real-time scanning)
 */
export async function checkPackagesAgainstCloud(packageNames: string[]): Promise<any[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/ioc/stalkerware/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ packageNames }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check packages: ${response.statusText}`);
    }

    const result = await response.json();
    return result.matches || [];
  } catch (error) {
    console.error('Error checking packages against cloud:', error);
    return [];
  }
}

/**
 * Check network indicators against Supabase database
 */
export async function checkNetworkAgainstCloud(indicators: string[]): Promise<any[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/ioc/network/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ indicators }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check network indicators: ${response.statusText}`);
    }

    const result = await response.json();
    return result.matches || [];
  } catch (error) {
    console.error('Error checking network against cloud:', error);
    return [];
  }
}
