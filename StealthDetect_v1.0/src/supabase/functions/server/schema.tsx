/**
 * Supabase Database Schema for Stealth Detect IoC Storage
 * 
 * This file contains SQL schema definitions for storing threat intelligence data.
 * Execute these schemas via Supabase Dashboard > SQL Editor
 */

export const SCHEMA_SQL = `
-- ============================================
-- IOC FILE HASHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ioc_file_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT UNIQUE NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'SHA-256',
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  source TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_hashes_hash ON ioc_file_hashes(hash);
CREATE INDEX IF NOT EXISTS idx_file_hashes_category ON ioc_file_hashes(category);
CREATE INDEX IF NOT EXISTS idx_file_hashes_severity ON ioc_file_hashes(severity);

-- ============================================
-- IOC PACKAGE NAMES TABLE (Stalkerware Apps)
-- ============================================
CREATE TABLE IF NOT EXISTS ioc_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name TEXT UNIQUE NOT NULL,
  app_name TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  permissions JSONB,
  indicators JSONB,
  source TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_name ON ioc_packages(package_name);
CREATE INDEX IF NOT EXISTS idx_packages_category ON ioc_packages(category);
CREATE INDEX IF NOT EXISTS idx_packages_severity ON ioc_packages(severity);

-- ============================================
-- IOC NETWORK INDICATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ioc_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('domain', 'ip', 'url', 'email')),
  indicator_value TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  source TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_type ON ioc_network(indicator_type);
CREATE INDEX IF NOT EXISTS idx_network_value ON ioc_network(indicator_value);
CREATE INDEX IF NOT EXISTS idx_network_category ON ioc_network(category);

-- ============================================
-- STALKERWARE SIGNATURES TABLE (SpyGuard Data)
-- ============================================
CREATE TABLE IF NOT EXISTS stalkerware_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name TEXT UNIQUE NOT NULL,
  app_name TEXT NOT NULL,
  developer TEXT,
  website TEXT,
  description TEXT,
  detection_method TEXT NOT NULL,
  permission_patterns JSONB,
  file_patterns JSONB,
  network_patterns JSONB,
  behavior_patterns JSONB,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  spyguard_verified BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stalkerware_package ON stalkerware_signatures(package_name);
CREATE INDEX IF NOT EXISTS idx_stalkerware_severity ON stalkerware_signatures(severity);
CREATE INDEX IF NOT EXISTS idx_stalkerware_verified ON stalkerware_signatures(spyguard_verified);

-- ============================================
-- IOC SYNC METADATA TABLE (Track last sync)
-- ============================================
CREATE TABLE IF NOT EXISTS ioc_sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT UNIQUE NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  record_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  metadata JSONB
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE ioc_file_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ioc_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ioc_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE stalkerware_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ioc_sync_metadata ENABLE ROW LEVEL SECURITY;

-- Public read access (threat intelligence is public)
CREATE POLICY "Public read access for file hashes" ON ioc_file_hashes
  FOR SELECT USING (true);

CREATE POLICY "Public read access for packages" ON ioc_packages
  FOR SELECT USING (true);

CREATE POLICY "Public read access for network indicators" ON ioc_network
  FOR SELECT USING (true);

CREATE POLICY "Public read access for stalkerware signatures" ON stalkerware_signatures
  FOR SELECT USING (true);

CREATE POLICY "Public read access for sync metadata" ON ioc_sync_metadata
  FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_ioc_file_hashes_updated_at
  BEFORE UPDATE ON ioc_file_hashes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ioc_packages_updated_at
  BEFORE UPDATE ON ioc_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ioc_network_updated_at
  BEFORE UPDATE ON ioc_network
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stalkerware_signatures_updated_at
  BEFORE UPDATE ON stalkerware_signatures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export const SCHEMA_DESCRIPTION = `
Database Schema Overview:

1. ioc_file_hashes
   - Stores malicious file SHA-256 hashes
   - Used for file-based threat detection
   
2. ioc_packages
   - Stores known stalkerware/spyware package names
   - Includes permission patterns and indicators
   
3. ioc_network
   - Stores malicious domains, IPs, URLs
   - Used for VPN-based network monitoring
   
4. stalkerware_signatures
   - Comprehensive stalkerware database (SpyGuard data)
   - Multi-factor detection (permissions, files, network, behavior)
   
5. ioc_sync_metadata
   - Tracks last sync time for offline-first architecture
   - Enables incremental updates

Security:
- Row Level Security (RLS) enabled on all tables
- Public read access (threat intel is public)
- Write access controlled via service role key (backend only)
`;
