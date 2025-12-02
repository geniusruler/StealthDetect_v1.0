/**
 * IOC Auto-Loader
 * Automatically loads bundled threat intelligence data on first app start
 * Provides offline-first threat detection capability
 */

import { iocIngestService } from './ioc-ingest';
import { secureStorage, isNative } from './native';
import type { AllIOCs } from './ioc-types';

// ==================== Constants ====================

const STORAGE_KEYS = {
  IOC_LOADED: 'ioc_data_loaded',
  IOC_VERSION: 'ioc_data_version',
  IOC_LOAD_TIME: 'ioc_data_load_time',
  IOC_STATS: 'ioc_load_stats',
};

// Bundled IOC data URL (served from public folder)
const IOC_DATA_URL = '/All_IOCs.json';

// ==================== Types ====================

export interface IoCLoadResult {
  success: boolean;
  isFirstLoad: boolean;
  source: 'bundled' | 'cached' | 'none';
  stats: {
    packages: number;
    hashes: number;
    network: number;
  };
  loadTime: number;
  errors: string[];
}

// ==================== Web Storage Fallback ====================

/**
 * For web/browser mode, store a subset of IOC data in localStorage
 * (localStorage has size limits, so we store the most critical indicators)
 */
interface WebIoCCache {
  packages: string[];
  domains: string[];
  version: string;
  loadedAt: string;
}

const WEB_IOC_CACHE_KEY = 'web_ioc_cache';
const MAX_WEB_PACKAGES = 500;
const MAX_WEB_DOMAINS = 500;

async function loadIoCsToWebCache(data: AllIOCs): Promise<void> {
  const packages: string[] = [];
  const domains: string[] = [];

  // Extract package names
  for (const app of data.apps) {
    if (app.platforms?.android?.packages) {
      packages.push(...app.platforms.android.packages);
    }
    if (app.platforms?.ios?.bundles) {
      packages.push(...app.platforms.ios.bundles);
    }
  }

  // Extract C2 domains
  for (const app of data.apps) {
    if (app.network?.c2?.domains) {
      domains.push(...app.network.c2.domains);
    }
    if (app.websites) {
      domains.push(...app.websites);
    }
  }

  // Deduplicate and limit
  const uniquePackages = [...new Set(packages)].slice(0, MAX_WEB_PACKAGES);
  const uniqueDomains = [...new Set(domains)].slice(0, MAX_WEB_DOMAINS);

  const cache: WebIoCCache = {
    packages: uniquePackages,
    domains: uniqueDomains,
    version: data.generated_at,
    loadedAt: new Date().toISOString(),
  };

  localStorage.setItem(WEB_IOC_CACHE_KEY, JSON.stringify(cache));
  console.log(`[IoC-AutoLoader] Web cache loaded: ${uniquePackages.length} packages, ${uniqueDomains.length} domains`);
}

/**
 * Check if a domain is in the web cache
 */
export function isKnownMaliciousDomainWeb(domain: string): boolean {
  try {
    const cacheStr = localStorage.getItem(WEB_IOC_CACHE_KEY);
    if (!cacheStr) return false;

    const cache: WebIoCCache = JSON.parse(cacheStr);
    const normalizedDomain = domain.toLowerCase();

    // Check exact match
    if (cache.domains.includes(normalizedDomain)) {
      return true;
    }

    // Check if domain is subdomain of a known malicious domain
    for (const knownDomain of cache.domains) {
      if (normalizedDomain.endsWith('.' + knownDomain)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check if a package is in the web cache
 */
export function isKnownMaliciousPackageWeb(packageName: string): boolean {
  try {
    const cacheStr = localStorage.getItem(WEB_IOC_CACHE_KEY);
    if (!cacheStr) return false;

    const cache: WebIoCCache = JSON.parse(cacheStr);
    return cache.packages.includes(packageName);
  } catch {
    return false;
  }
}

// ==================== Main Auto-Loader ====================

/**
 * Check if IOC data has been loaded
 */
async function hasIoCDataLoaded(): Promise<boolean> {
  const loaded = await secureStorage.getItem(STORAGE_KEYS.IOC_LOADED);
  return loaded === 'true';
}

/**
 * Get loaded IOC version
 */
async function getLoadedIoCVersion(): Promise<string | null> {
  return await secureStorage.getItem(STORAGE_KEYS.IOC_VERSION);
}

/**
 * Fetch bundled IOC data
 */
async function fetchBundledIoCs(): Promise<AllIOCs | null> {
  try {
    console.log('[IoC-AutoLoader] Fetching bundled IOC data...');
    const response = await fetch(IOC_DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    // Validate structure
    if (!data.apps || !Array.isArray(data.apps)) {
      throw new Error('Invalid IOC data structure');
    }

    console.log(`[IoC-AutoLoader] Loaded ${data.apps.length} apps from bundled data`);
    return data as AllIOCs;
  } catch (error) {
    console.error('[IoC-AutoLoader] Failed to fetch bundled IOCs:', error);
    return null;
  }
}

/**
 * Auto-load IOC data on app start
 * - On native: Loads into SQLite database
 * - On web: Loads critical indicators into localStorage cache
 */
export async function autoLoadIoCs(force: boolean = false): Promise<IoCLoadResult> {
  const startTime = Date.now();
  const result: IoCLoadResult = {
    success: false,
    isFirstLoad: false,
    source: 'none',
    stats: { packages: 0, hashes: 0, network: 0 },
    loadTime: 0,
    errors: [],
  };

  try {
    // Check if already loaded (unless force reload)
    if (!force && await hasIoCDataLoaded()) {
      console.log('[IoC-AutoLoader] IOC data already loaded, skipping...');

      // Get cached stats
      const statsStr = await secureStorage.getItem(STORAGE_KEYS.IOC_STATS);
      if (statsStr) {
        try {
          result.stats = JSON.parse(statsStr);
        } catch {}
      }

      result.success = true;
      result.source = 'cached';
      result.loadTime = Date.now() - startTime;
      return result;
    }

    result.isFirstLoad = true;
    console.log('[IoC-AutoLoader] First load - initializing IOC database...');

    // Fetch bundled IOC data
    const iocData = await fetchBundledIoCs();
    if (!iocData) {
      result.errors.push('Failed to fetch bundled IOC data');
      result.loadTime = Date.now() - startTime;
      return result;
    }

    // Load based on platform
    if (isNative()) {
      // Native: Load into SQLite
      console.log('[IoC-AutoLoader] Loading IOCs into SQLite...');

      await iocIngestService.initialize();

      // Check if database needs population
      const needsPopulation = await iocIngestService.needsPopulation();

      if (needsPopulation || force) {
        if (force) {
          await iocIngestService.clearAll();
        }

        const ingestResult = await iocIngestService.loadIOCs(iocData);

        result.stats.packages = ingestResult.packagesLoaded;
        result.stats.hashes = ingestResult.hashesLoaded;
        result.stats.network = ingestResult.networkLoaded;

        if (ingestResult.errors.length > 0) {
          result.errors.push(...ingestResult.errors);
        }

        console.log('[IoC-AutoLoader] SQLite load complete:', result.stats);
      } else {
        // Database already populated, get current stats
        const dbStats = await iocIngestService.getStats();
        result.stats.packages = dbStats.packages;
        result.stats.hashes = dbStats.hashes;
        result.stats.network = dbStats.network;
      }
    } else {
      // Web: Load into localStorage cache
      console.log('[IoC-AutoLoader] Loading IOCs into web cache...');
      await loadIoCsToWebCache(iocData);

      // Count what we loaded
      const cacheStr = localStorage.getItem(WEB_IOC_CACHE_KEY);
      if (cacheStr) {
        const cache: WebIoCCache = JSON.parse(cacheStr);
        result.stats.packages = cache.packages.length;
        result.stats.network = cache.domains.length;
      }
    }

    // Mark as loaded
    await secureStorage.setItem(STORAGE_KEYS.IOC_LOADED, 'true');
    await secureStorage.setItem(STORAGE_KEYS.IOC_VERSION, iocData.generated_at);
    await secureStorage.setItem(STORAGE_KEYS.IOC_LOAD_TIME, new Date().toISOString());
    await secureStorage.setItem(STORAGE_KEYS.IOC_STATS, JSON.stringify(result.stats));

    result.success = true;
    result.source = 'bundled';
    result.loadTime = Date.now() - startTime;

    console.log(`[IoC-AutoLoader] IOC data loaded successfully in ${result.loadTime}ms`);

  } catch (error) {
    console.error('[IoC-AutoLoader] Error loading IOCs:', error);
    result.errors.push(`Load error: ${error}`);
  }

  result.loadTime = Date.now() - startTime;
  return result;
}

/**
 * Get IOC load status
 */
export async function getIoCLoadStatus(): Promise<{
  loaded: boolean;
  version: string | null;
  loadTime: string | null;
  stats: { packages: number; hashes: number; network: number } | null;
}> {
  const loaded = await hasIoCDataLoaded();
  const version = await getLoadedIoCVersion();
  const loadTime = await secureStorage.getItem(STORAGE_KEYS.IOC_LOAD_TIME);

  let stats = null;
  const statsStr = await secureStorage.getItem(STORAGE_KEYS.IOC_STATS);
  if (statsStr) {
    try {
      stats = JSON.parse(statsStr);
    } catch {}
  }

  return { loaded, version, loadTime, stats };
}

/**
 * Force reload IOC data (e.g., after app update)
 */
export async function forceReloadIoCs(): Promise<IoCLoadResult> {
  return autoLoadIoCs(true);
}

/**
 * Clear all loaded IOC data
 */
export async function clearLoadedIoCs(): Promise<void> {
  await secureStorage.removeItem(STORAGE_KEYS.IOC_LOADED);
  await secureStorage.removeItem(STORAGE_KEYS.IOC_VERSION);
  await secureStorage.removeItem(STORAGE_KEYS.IOC_LOAD_TIME);
  await secureStorage.removeItem(STORAGE_KEYS.IOC_STATS);

  if (isNative()) {
    await iocIngestService.clearAll();
  } else {
    localStorage.removeItem(WEB_IOC_CACHE_KEY);
  }

  console.log('[IoC-AutoLoader] All IOC data cleared');
}
