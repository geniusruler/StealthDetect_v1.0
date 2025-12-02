/**
 * App Initialization Helper
 * Run this once to set up the complete Stealth Detect system
 */

import { autoLoadIoCs, getIoCLoadStatus, type IoCLoadResult } from './ioc-auto-loader';
import { db } from './database';

export interface InitializationResult {
  success: boolean;
  steps: {
    databaseInitialized: boolean;
    iocDataLoaded: boolean;
    vpnServiceReady: boolean;
  };
  stats: {
    packagesCount: number;
    networkIndicatorsCount: number;
    hashesCount: number;
    totalThreats: number;
  };
  errors: string[];
  timestamp: string;
  loadTime: number;
}

/**
 * Initialize the entire Stealth Detect system
 * This should be called once when the app first loads
 */
export async function initializeStealthDetect(): Promise<InitializationResult> {
  console.log('[Init] Initializing Stealth Detect...');
  const startTime = Date.now();

  const result: InitializationResult = {
    success: false,
    steps: {
      databaseInitialized: false,
      iocDataLoaded: false,
      vpnServiceReady: false,
    },
    stats: {
      packagesCount: 0,
      networkIndicatorsCount: 0,
      hashesCount: 0,
      totalThreats: 0,
    },
    errors: [],
    timestamp: new Date().toISOString(),
    loadTime: 0,
  };

  try {
    // Step 1: Initialize local database
    console.log('[Init] Initializing local database...');
    try {
      await db.initialize();
      result.steps.databaseInitialized = true;
      console.log('[Init] Database initialized');
    } catch (error) {
      console.error('[Init] Database initialization failed:', error);
      result.errors.push(`Database init error: ${error}`);
    }

    // Step 2: Auto-load IOC data from bundled file
    console.log('[Init] Loading threat intelligence data...');
    try {
      const loadResult: IoCLoadResult = await autoLoadIoCs();

      if (loadResult.success) {
        result.steps.iocDataLoaded = true;
        result.stats.packagesCount = loadResult.stats.packages;
        result.stats.networkIndicatorsCount = loadResult.stats.network;
        result.stats.hashesCount = loadResult.stats.hashes;
        result.stats.totalThreats = loadResult.stats.packages + loadResult.stats.network + loadResult.stats.hashes;

        if (loadResult.isFirstLoad) {
          console.log('[Init] IOC data loaded (first load):', result.stats);
        } else {
          console.log('[Init] IOC data already present:', result.stats);
        }
      } else {
        result.errors.push('IOC data loading failed');
        if (loadResult.errors.length > 0) {
          result.errors.push(...loadResult.errors);
        }
        console.warn('[Init] IOC load completed with errors:', loadResult.errors);
      }
    } catch (error) {
      console.error('[Init] IOC loading failed:', error);
      result.errors.push(`IOC load error: ${error}`);
    }

    // Step 3: VPN service is ready (native plugin registered in MainActivity)
    // The VPN doesn't need to be started automatically, just ready for use
    result.steps.vpnServiceReady = true;
    console.log('[Init] VPN service ready');

    // Determine overall success
    result.success = result.steps.databaseInitialized &&
                     result.steps.iocDataLoaded &&
                     result.errors.length === 0;

    result.loadTime = Date.now() - startTime;

    if (result.success) {
      console.log(`[Init] Stealth Detect initialized successfully in ${result.loadTime}ms`);
      console.log(`[Init] Threats loaded: ${result.stats.totalThreats}`);
    } else {
      console.warn('[Init] Initialization completed with issues:', result.errors);
    }

    return result;

  } catch (error) {
    console.error('[Init] Fatal initialization error:', error);
    result.errors.push(`Fatal error: ${error}`);
    result.loadTime = Date.now() - startTime;
    return result;
  }
}

/**
 * Check if the app has been initialized
 */
export async function isAppInitialized(): Promise<boolean> {
  const status = await getIoCLoadStatus();
  return status.loaded;
}

/**
 * Get initialization status
 */
export async function getInitializationStatus(): Promise<{
  initialized: boolean;
  lastLoadTime: string | null;
  threatCount: number;
  stats: { packages: number; network: number; hashes: number } | null;
}> {
  const status = await getIoCLoadStatus();

  return {
    initialized: status.loaded,
    lastLoadTime: status.loadTime,
    threatCount: status.stats
      ? status.stats.packages + status.stats.network + status.stats.hashes
      : 0,
    stats: status.stats,
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
║  Status: ${result.success ? 'SUCCESS' : 'PARTIAL'}                                           ║
║                                                                   ║
║  Database Initialized:    ${result.steps.databaseInitialized ? 'Yes' : 'No '}                               ║
║  IOC Data Loaded:         ${result.steps.iocDataLoaded ? 'Yes' : 'No '}                               ║
║  VPN Service Ready:       ${result.steps.vpnServiceReady ? 'Yes' : 'No '}                               ║
║                                                                   ║
║  Threat Intelligence:                                             ║
║  - Package Signatures:  ${String(result.stats.packagesCount).padStart(5)} apps                       ║
║  - Network Indicators:  ${String(result.stats.networkIndicatorsCount).padStart(5)} domains                   ║
║  - File Hashes:         ${String(result.stats.hashesCount).padStart(5)} hashes                    ║
║  - Total Threats:       ${String(result.stats.totalThreats).padStart(5)} indicators                ║
║                                                                   ║
║  Load Time: ${String(result.loadTime).padStart(5)}ms                                          ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  if (result.errors.length > 0) {
    console.warn('Errors during initialization:');
    result.errors.forEach(err => console.warn(`   - ${err}`));
  }
}
