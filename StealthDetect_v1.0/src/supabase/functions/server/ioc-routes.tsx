/**
 * IoC Management Routes
 * Handles threat intelligence data operations using KV store
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export const iocRoutes = new Hono();

// ============================================
// FILE HASHES ENDPOINTS
// ============================================

// Get all file hashes (with pagination and filtering)
iocRoutes.get('/make-server-91fc533e/ioc/file-hashes', async (c) => {
  try {
    const category = c.req.query('category');
    const severity = c.req.query('severity');
    const limit = parseInt(c.req.query('limit') || '1000');

    // Get all file hashes from KV store
    const allHashes = await kv.getByPrefix('ioc:file_hash:');
    let data = allHashes.map(item => item.value);

    // Apply filters
    if (category) {
      data = data.filter((hash: any) => hash.category === category);
    }
    if (severity) {
      data = data.filter((hash: any) => hash.severity === severity);
    }

    // Apply limit
    data = data.slice(0, limit);

    return c.json({ data, count: data.length });
  } catch (error) {
    console.error('Exception in file hashes endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Check if file hash exists (for quick lookups)
iocRoutes.post('/make-server-91fc533e/ioc/file-hashes/check', async (c) => {
  try {
    const { hashes } = await c.req.json();

    if (!Array.isArray(hashes)) {
      return c.json({ error: 'hashes must be an array' }, 400);
    }

    const matches = [];
    for (const hash of hashes) {
      const key = `ioc:file_hash:${hash}`;
      const data = await kv.get(key);
      if (data) {
        matches.push(data);
      }
    }

    return c.json({ matches });
  } catch (error) {
    console.error('Exception in file hash check endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Add file hash (admin only - requires service role)
iocRoutes.post('/make-server-91fc533e/ioc/file-hashes', async (c) => {
  try {
    const ioc = await c.req.json();

    const key = `ioc:file_hash:${ioc.hash}`;
    const record = {
      ...ioc,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, record);

    return c.json({ data: record, success: true });
  } catch (error) {
    console.error('Exception in add file hash endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============================================
// PACKAGE NAMES ENDPOINTS
// ============================================

// Get all package indicators
iocRoutes.get('/make-server-91fc533e/ioc/packages', async (c) => {
  try {
    const category = c.req.query('category');
    const severity = c.req.query('severity');
    const limit = parseInt(c.req.query('limit') || '1000');

    // Get all packages from KV store
    const allPackages = await kv.getByPrefix('ioc:package:');
    let data = allPackages.map(item => item.value);

    // Apply filters
    if (category) {
      data = data.filter((pkg: any) => pkg.category === category);
    }
    if (severity) {
      data = data.filter((pkg: any) => pkg.severity === severity);
    }

    // Apply limit
    data = data.slice(0, limit);

    return c.json({ data, count: data.length });
  } catch (error) {
    console.error('Exception in packages endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Check if package names exist
iocRoutes.post('/make-server-91fc533e/ioc/packages/check', async (c) => {
  try {
    const { packageNames } = await c.req.json();

    if (!Array.isArray(packageNames)) {
      return c.json({ error: 'packageNames must be an array' }, 400);
    }

    const matches = [];
    for (const pkgName of packageNames) {
      const key = `ioc:package:${pkgName}`;
      const data = await kv.get(key);
      if (data) {
        matches.push(data);
      }
    }

    return c.json({ matches });
  } catch (error) {
    console.error('Exception in package check endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Add package IoC
iocRoutes.post('/make-server-91fc533e/ioc/packages', async (c) => {
  try {
    const ioc = await c.req.json();

    const key = `ioc:package:${ioc.package_name}`;
    const record = {
      ...ioc,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, record);

    return c.json({ data: record, success: true });
  } catch (error) {
    console.error('Exception in add package endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============================================
// NETWORK INDICATORS ENDPOINTS
// ============================================

// Get all network indicators
iocRoutes.get('/make-server-91fc533e/ioc/network', async (c) => {
  try {
    const type = c.req.query('type');
    const category = c.req.query('category');
    const severity = c.req.query('severity');
    const limit = parseInt(c.req.query('limit') || '1000');

    // Get all network indicators from KV store
    const allIndicators = await kv.getByPrefix('ioc:network:');
    let data = allIndicators.map(item => item.value);

    // Apply filters
    if (type) {
      data = data.filter((ind: any) => ind.indicator_type === type);
    }
    if (category) {
      data = data.filter((ind: any) => ind.category === category);
    }
    if (severity) {
      data = data.filter((ind: any) => ind.severity === severity);
    }

    // Apply limit
    data = data.slice(0, limit);

    return c.json({ data, count: data.length });
  } catch (error) {
    console.error('Exception in network indicators endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Check network indicators
iocRoutes.post('/make-server-91fc533e/ioc/network/check', async (c) => {
  try {
    const { indicators } = await c.req.json();

    if (!Array.isArray(indicators)) {
      return c.json({ error: 'indicators must be an array' }, 400);
    }

    const matches = [];
    for (const indicator of indicators) {
      const key = `ioc:network:${indicator}`;
      const data = await kv.get(key);
      if (data) {
        matches.push(data);
      }
    }

    return c.json({ matches });
  } catch (error) {
    console.error('Exception in network check endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Add network IoC
iocRoutes.post('/make-server-91fc533e/ioc/network', async (c) => {
  try {
    const ioc = await c.req.json();

    const key = `ioc:network:${ioc.indicator_value}`;
    const record = {
      ...ioc,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, record);

    return c.json({ data: record, success: true });
  } catch (error) {
    console.error('Exception in add network indicator endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============================================
// STALKERWARE SIGNATURES ENDPOINTS
// ============================================

// Get all stalkerware signatures
iocRoutes.get('/make-server-91fc533e/ioc/stalkerware', async (c) => {
  try {
    const verified = c.req.query('verified');
    const severity = c.req.query('severity');
    const limit = parseInt(c.req.query('limit') || '1000');

    // Get all stalkerware signatures from KV store
    const allSignatures = await kv.getByPrefix('stalkerware:');
    let data = allSignatures.map(item => item.value);

    // Apply filters
    if (verified !== undefined) {
      data = data.filter((sig: any) => sig.spyguard_verified === (verified === 'true'));
    }
    if (severity) {
      data = data.filter((sig: any) => sig.severity === severity);
    }

    // Apply limit
    data = data.slice(0, limit);

    return c.json({ data, count: data.length });
  } catch (error) {
    console.error('Exception in stalkerware signatures endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Check stalkerware signatures
iocRoutes.post('/make-server-91fc533e/ioc/stalkerware/check', async (c) => {
  try {
    const { packageNames } = await c.req.json();

    if (!Array.isArray(packageNames)) {
      return c.json({ error: 'packageNames must be an array' }, 400);
    }

    const matches = [];
    for (const pkgName of packageNames) {
      const key = `stalkerware:${pkgName}`;
      const data = await kv.get(key);
      if (data) {
        matches.push(data);
      }
    }

    return c.json({ matches });
  } catch (error) {
    console.error('Exception in stalkerware check endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Add stalkerware signature
iocRoutes.post('/make-server-91fc533e/ioc/stalkerware', async (c) => {
  try {
    const signature = await c.req.json();

    const key = `stalkerware:${signature.package_name}`;
    const record = {
      ...signature,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, record);

    return c.json({ data: record, success: true });
  } catch (error) {
    console.error('Exception in add stalkerware signature endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Bulk import stalkerware signatures
iocRoutes.post('/make-server-91fc533e/ioc/stalkerware/bulk', async (c) => {
  try {
    const { signatures } = await c.req.json();

    if (!Array.isArray(signatures)) {
      return c.json({ error: 'signatures must be an array' }, 400);
    }

    const results = [];
    for (const signature of signatures) {
      const key = `stalkerware:${signature.package_name}`;
      const record = {
        ...signature,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await kv.set(key, record);
      results.push(record);
    }

    return c.json({ data: results, count: results.length, success: true });
  } catch (error) {
    console.error('Exception in bulk import endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============================================
// SYNC METADATA ENDPOINTS
// ============================================

// Get sync metadata
iocRoutes.get('/make-server-91fc533e/ioc/sync-metadata', async (c) => {
  try {
    const allMetadata = await kv.getByPrefix('sync_metadata:');
    const data = allMetadata.map(item => item.value);

    return c.json({ data });
  } catch (error) {
    console.error('Exception in sync metadata endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Update sync metadata
iocRoutes.post('/make-server-91fc533e/ioc/sync-metadata', async (c) => {
  try {
    const metadata = await c.req.json();

    const key = `sync_metadata:${metadata.table_name}`;
    const record = {
      ...metadata,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, record);

    return c.json({ data: record, success: true });
  } catch (error) {
    console.error('Exception in update sync metadata endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============================================
// COMBINED THREAT CHECK ENDPOINT
// ============================================

// Check all IoC types at once (optimized for scanning)
iocRoutes.post('/make-server-91fc533e/ioc/check-all', async (c) => {
  try {
    const { hashes = [], packageNames = [], networkIndicators = [] } = await c.req.json();

    const results: any = {
      fileHashMatches: [],
      packageMatches: [],
      networkMatches: [],
      stalkerwareMatches: [],
    };

    // Check file hashes
    for (const hash of hashes) {
      const data = await kv.get(`ioc:file_hash:${hash}`);
      if (data) {
        results.fileHashMatches.push(data);
      }
    }

    // Check packages
    for (const pkgName of packageNames) {
      const data = await kv.get(`ioc:package:${pkgName}`);
      if (data) {
        results.packageMatches.push(data);
      }
    }

    // Check stalkerware
    for (const pkgName of packageNames) {
      const data = await kv.get(`stalkerware:${pkgName}`);
      if (data) {
        results.stalkerwareMatches.push(data);
      }
    }

    // Check network indicators
    for (const indicator of networkIndicators) {
      const data = await kv.get(`ioc:network:${indicator}`);
      if (data) {
        results.networkMatches.push(data);
      }
    }

    return c.json(results);
  } catch (error) {
    console.error('Exception in check-all endpoint:', error);
    return c.json({ error: String(error) }, 500);
  }
});
