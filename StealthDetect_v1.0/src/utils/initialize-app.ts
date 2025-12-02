/**
 * App Initialization Helper
 * Run this once to set up the complete Stealth Detect system
 */

import { initializeDatabase, getDatabaseStats, syncIoCs } from './ioc-sync';

export interface InitializationResult {
  success: boolean;
  steps: {
    databaseInitialized: boolean;
    spyguardDataImported: boolean;
    iocsSynced: boolean;
  };
  stats: {
    stalkerwareCount: number;
    networkIndicatorsCount: number;
    totalThreats: number;
  };
  errors: string[];
  timestamp: string;
}

/**
 * Initialize the entire Stealth Detect system
 * This should be called once when the app first loads
 */
export async function initializeStealthDetect(): Promise<InitializationResult> {
  console.log('🚀 Initializing Stealth Detect...');
  
  const result: InitializationResult = {
    success: false,
    steps: {
      databaseInitialized: false,
      spyguardDataImported: false,
      iocsSynced: false,
    },
    stats: {
      stalkerwareCount: 0,
      networkIndicatorsCount: 0,
      totalThreats: 0,
    },
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Step 1: Check if database is already initialized
    console.log('📊 Checking database status...');
    let stats;
    try {
      stats = await getDatabaseStats();
      
      if (stats.stats.counts.stalkerware_signatures > 0) {
        console.log('✅ Database already initialized');
        result.steps.databaseInitialized = true;
        result.steps.spyguardDataImported = true;
        result.stats.stalkerwareCount = stats.stats.counts.stalkerware_signatures;
        result.stats.networkIndicatorsCount = stats.stats.counts.network_indicators;
        result.stats.totalThreats = stats.stats.counts.total;
      }
    } catch (error) {
      console.log('⚠️ Database not yet initialized');
    }

    // Step 2: Initialize database if needed
    if (!result.steps.databaseInitialized) {
      console.log('🗄️ Initializing database with SpyGuard data...');
      try {
        const initResult = await initializeDatabase();
        
        if (initResult.success) {
          result.steps.databaseInitialized = true;
          result.steps.spyguardDataImported = true;
          
          console.log('✅ Database initialized successfully');
          console.log(`   - Stalkerware signatures: ${initResult.import_results.stalkerware}`);
          console.log(`   - Network indicators: ${initResult.import_results.network}`);
          
          result.stats.stalkerwareCount = initResult.import_results.stalkerware;
          result.stats.networkIndicatorsCount = initResult.import_results.network;
        } else {
          result.errors.push('Database initialization failed');
        }
      } catch (error) {
        console.error('❌ Database initialization failed:', error);
        result.errors.push(`Database init error: ${error}`);
      }
    }

    // Step 3: Sync IoCs to local storage
    console.log('☁️ Syncing threat intelligence to local storage...');
    try {
      const syncResult = await syncIoCs();
      
      if (syncResult.success) {
        result.steps.iocsSynced = true;
        console.log('✅ IoCs synced successfully');
        console.log(`   - Stalkerware: ${syncResult.stalkerwareCount}`);
        console.log(`   - Network: ${syncResult.networkCount}`);
        console.log(`   - Packages: ${syncResult.packageCount}`);
        console.log(`   - File hashes: ${syncResult.fileHashCount}`);
      } else {
        result.errors.push('IoC sync failed');
        console.warn('⚠️ IoC sync completed with errors:', syncResult.errors);
      }
    } catch (error) {
      console.error('❌ IoC sync failed:', error);
      result.errors.push(`IoC sync error: ${error}`);
    }

    // Step 4: Get final stats
    try {
      const finalStats = await getDatabaseStats();
      result.stats.stalkerwareCount = finalStats.stats.counts.stalkerware_signatures;
      result.stats.networkIndicatorsCount = finalStats.stats.counts.network_indicators;
      result.stats.totalThreats = finalStats.stats.counts.total;
    } catch (error) {
      console.warn('Could not fetch final stats:', error);
    }

    // Determine overall success
    result.success = result.steps.databaseInitialized && 
                     result.steps.spyguardDataImported && 
                     result.errors.length === 0;

    if (result.success) {
      console.log('🎉 Stealth Detect initialized successfully!');
      console.log(`📊 Total threats in database: ${result.stats.totalThreats}`);
    } else {
      console.error('⚠️ Initialization completed with issues:', result.errors);
    }

    return result;

  } catch (error) {
    console.error('❌ Fatal initialization error:', error);
    result.errors.push(`Fatal error: ${error}`);
    return result;
  }
}

/**
 * Check if the app has been initialized
 */
export function isAppInitialized(): boolean {
  const lastSync = localStorage.getItem('sync_stalkerware_signatures');
  return lastSync !== null;
}

/**
 * Get initialization status
 */
export async function getInitializationStatus(): Promise<{
  initialized: boolean;
  lastSync: string | null;
  threatCount: number;
}> {
  const initialized = isAppInitialized();
  const lastSyncData = localStorage.getItem('last_full_sync');
  
  let lastSync = null;
  let threatCount = 0;

  if (lastSyncData) {
    try {
      const parsed = JSON.parse(lastSyncData);
      lastSync = parsed.timestamp;
      threatCount = parsed.counts.stalkerware + parsed.counts.network + 
                    parsed.counts.packages + parsed.counts.fileHashes;
    } catch (error) {
      console.error('Error parsing sync data:', error);
    }
  }

  return {
    initialized,
    lastSync,
    threatCount,
  };
}

/**
 * Display initialization banner (for development)
 */
export function displayInitBanner(result: InitializationResult): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                     STEALTH DETECT INITIALIZED                    ║
╠═══════════════════════════════════════════════════════════════════╣
║  Status: ${result.success ? '✅ SUCCESS' : '⚠️  PARTIAL'}                                             ║
║                                                                   ║
║  Database Initialized:    ${result.steps.databaseInitialized ? '✅' : '❌'}                                 ║
║  SpyGuard Data Imported:  ${result.steps.spyguardDataImported ? '✅' : '❌'}                                 ║
║  IoCs Synced Locally:     ${result.steps.iocsSynced ? '✅' : '❌'}                                 ║
║                                                                   ║
║  Threat Intelligence:                                             ║
║  ├─ Stalkerware Signatures:  ${String(result.stats.stalkerwareCount).padEnd(3)} apps                      ║
║  ├─ Network Indicators:      ${String(result.stats.networkIndicatorsCount).padEnd(3)} C2 domains             ║
║  └─ Total Threats:           ${String(result.stats.totalThreats).padEnd(3)} indicators               ║
║                                                                   ║
║  Timestamp: ${result.timestamp.substring(0, 19)}                    ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  if (result.errors.length > 0) {
    console.warn('⚠️ Errors during initialization:');
    result.errors.forEach(err => console.warn(`   - ${err}`));
  }
}
