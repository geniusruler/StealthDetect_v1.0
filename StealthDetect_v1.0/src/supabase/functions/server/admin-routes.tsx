/**
 * Admin Routes for Database Management
 * These routes should be protected in production
 */

import { Hono } from 'npm:hono';
import { importSpyGuardData, SPYGUARD_STALKERWARE_DATABASE, SPYGUARD_NETWORK_INDICATORS } from './spyguard-import.tsx';
import * as kv from './kv_store.tsx';

export const adminRoutes = new Hono();

// Import SpyGuard data endpoint
adminRoutes.post('/make-server-91fc533e/admin/import-spyguard', async (c) => {
  try {
    console.log('Admin: Initiating SpyGuard data import...');
    const results = await importSpyGuardData();

    return c.json({
      success: results.errors.length === 0,
      results: {
        stalkerware_imported: results.stalkerware,
        network_indicators_imported: results.network,
        total_stalkerware_in_database: SPYGUARD_STALKERWARE_DATABASE.length,
        total_network_in_database: SPYGUARD_NETWORK_INDICATORS.length,
      },
      errors: results.errors,
      message: results.errors.length === 0
        ? 'SpyGuard data imported successfully'
        : 'SpyGuard data imported with errors',
    });
  } catch (error) {
    console.error('Exception in import-spyguard endpoint:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Get database statistics
adminRoutes.get('/make-server-91fc533e/admin/stats', async (c) => {
  try {
    const stats: any = {};

    // Count stalkerware signatures
    const stalkerwareData = await kv.getByPrefix('stalkerware:');
    const stalkerwareCount = stalkerwareData.length;

    // Count network indicators
    const networkData = await kv.getByPrefix('ioc:network:');
    const networkCount = networkData.length;

    // Count file hashes
    const fileHashData = await kv.getByPrefix('ioc:file_hash:');
    const fileHashCount = fileHashData.length;

    // Count package IoCs
    const packageData = await kv.getByPrefix('ioc:package:');
    const packageCount = packageData.length;

    // Get sync metadata
    const syncMetadata = await kv.getByPrefix('sync_metadata:');

    stats.counts = {
      stalkerware_signatures: stalkerwareCount,
      network_indicators: networkCount,
      file_hashes: fileHashCount,
      package_iocs: packageCount,
      total: stalkerwareCount + networkCount + fileHashCount + packageCount,
    };

    stats.sync_metadata = syncMetadata.map(item => item.value);

    // Get severity breakdown for stalkerware
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    stalkerwareData.forEach((item: any) => {
      const severity = item.value?.severity;
      if (severity && severityCounts.hasOwnProperty(severity)) {
        severityCounts[severity as keyof typeof severityCounts]++;
      }
    });

    stats.severity_breakdown = severityCounts;

    return c.json({ stats, success: true });
  } catch (error) {
    console.error('Exception in stats endpoint:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Clear all IoC data (DANGEROUS - for development only)
adminRoutes.post('/make-server-91fc533e/admin/clear-all', async (c) => {
  try {
    console.log('Admin: Clearing all IoC data...');

    // Get all IoC-related keys
    const stalkerwareKeys = (await kv.getByPrefix('stalkerware:')).map(item => item.key);
    const networkKeys = (await kv.getByPrefix('ioc:network:')).map(item => item.key);
    const fileHashKeys = (await kv.getByPrefix('ioc:file_hash:')).map(item => item.key);
    const packageKeys = (await kv.getByPrefix('ioc:package:')).map(item => item.key);
    const metadataKeys = (await kv.getByPrefix('sync_metadata:')).map(item => item.key);

    // Delete all keys
    const allKeys = [...stalkerwareKeys, ...networkKeys, ...fileHashKeys, ...packageKeys, ...metadataKeys];
    if (allKeys.length > 0) {
      await kv.mdel(allKeys);
    }

    console.log(`✓ All IoC data cleared (${allKeys.length} records)`);

    return c.json({
      success: true,
      message: `All IoC data cleared successfully (${allKeys.length} records)`,
    });
  } catch (error) {
    console.error('Exception in clear-all endpoint:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});

// Initialize database with SpyGuard data
adminRoutes.post('/make-server-91fc533e/admin/initialize', async (c) => {
  try {
    console.log('Admin: Initializing database...');

    // Import SpyGuard data
    const importResults = await importSpyGuardData();

    return c.json({
      success: true,
      message: 'Database initialized successfully',
      import_results: importResults,
    });
  } catch (error) {
    console.error('Exception in initialize endpoint:', error);
    return c.json({ error: String(error), success: false }, 500);
  }
});
