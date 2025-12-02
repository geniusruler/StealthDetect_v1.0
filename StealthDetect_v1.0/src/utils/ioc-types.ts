/**
 * TypeScript interfaces for All_IOCs.json structure
 * Defines the shape of the threat intelligence data
 */

// ==================== Root Structure ====================

export interface AllIOCs {
  generated_at: string;
  apps: MalwareApp[];
  related_companies: { [companyName: string]: RelatedCompany };
  stats: {
    apps_total: number;
    sample_hashes_matched: number;
    sample_hashes_unmatched: number;
  };
}

// ==================== App/Malware Entry ====================

export interface MalwareApp {
  name: string;
  category: MalwareCategory;
  aliases?: string[];
  platforms?: {
    android?: {
      packages: string[];
      certificates: string[];
    };
    ios?: {
      bundles: string[];
    };
  };
  hashes?: {
    sha256: { [hashValue: string]: HashInfo };
  };
  websites?: string[];
  distribution?: string[];
  network?: NetworkInfo;
  sources: { [fieldPath: string]: string[] };
}

export type MalwareCategory = 'stalkerware' | 'watchware' | 'spyware' | 'tracking' | 'other';

export interface HashInfo {
  package?: string;
  certificate?: string;
  version?: string;
}

export interface NetworkInfo {
  c2?: {
    domains?: string[];
    ips?: string[];
  };
  resolved_hosts?: string[];
}

// ==================== Related Companies ====================

export interface RelatedCompany {
  raw_sections?: RawSection[];
  companies?: CompanyDetails[];
  providers?: ProviderInfo[][];
  articles?: string[];
}

export interface RawSection {
  company?: Array<Record<string, unknown>>;
  providers?: Array<Record<string, unknown>>;
  article?: string[];
}

export interface CompanyDetails {
  name: string;
  address?: string;
  country?: string;
  registration_number?: string;
  phone?: string[];
  creation_date?: string;
  email?: string[];
  google_tag?: string[];
  twitter?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  linkedin?: string;
  telegram?: string;
  people?: PersonInfo[];
}

export interface PersonInfo {
  previous_director?: PersonDetail[];
  director?: PersonDetail[];
  lead_dev?: PersonDetail[];
}

export interface PersonDetail {
  name: string;
  linkedin?: string;
}

export interface ProviderInfo {
  support?: SupportProvider[];
}

export interface SupportProvider {
  company?: Array<{
    name?: string;
    website?: string;
    proof?: string;
  }>;
}

// ==================== SQLite Table Types ====================

export interface IoCPackageRow {
  id?: number;
  package_name: string;
  app_name: string;
  category: MalwareCategory;
  severity: Severity;
  description: string;
  source: string;
  platforms: string; // JSON stringified
  aliases: string; // JSON stringified
  date_added: string;
  last_updated: string;
}

export interface IoCNetworkRow {
  id?: number;
  indicator_type: NetworkIndicatorType;
  indicator_value: string;
  app_name: string;
  category: string;
  severity: Severity;
  description: string;
  source: string;
  date_added: string;
}

export interface IoCFileHashRow {
  id?: number;
  hash: string;
  algorithm: HashAlgorithm;
  package_name: string | null;
  certificate: string | null;
  version: string | null;
  app_name: string;
  category: string;
  severity: Severity;
  description: string;
  source: string;
  date_added: string;
}

export interface ScanHistoryRow {
  id: string;
  timestamp: string;
  duration: number;
  status: ScanStatus;
  threats: string; // JSON stringified ThreatDetection[]
  stats: string; // JSON stringified stats object
  network_monitoring: number; // 0 or 1
}

export interface PinStorageRow {
  type: 'main' | 'duress';
  hash: string;
  algorithm: string;
  created_at: string;
  updated_at: string;
}

export interface SyncMetadataRow {
  key: string;
  value: string;
  updated_at: string;
}

// ==================== Enums ====================

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type NetworkIndicatorType = 'domain' | 'ip' | 'url' | 'c2_domain' | 'c2_ip' | 'resolved_host';

export type HashAlgorithm = 'SHA-256' | 'MD5' | 'SHA-1';

export type ScanStatus = 'completed' | 'interrupted' | 'failed';

// ==================== Utility Functions ====================

/**
 * Map malware category to severity level
 */
export function categoryToSeverity(category: MalwareCategory): Severity {
  const map: Record<MalwareCategory, Severity> = {
    stalkerware: 'critical',
    spyware: 'critical',
    watchware: 'high',
    tracking: 'medium',
    other: 'low',
  };
  return map[category] || 'medium';
}

/**
 * Type guard to check if an object is a valid MalwareApp
 */
export function isMalwareApp(obj: unknown): obj is MalwareApp {
  if (typeof obj !== 'object' || obj === null) return false;
  const app = obj as Record<string, unknown>;
  return (
    typeof app.name === 'string' &&
    typeof app.category === 'string' &&
    typeof app.sources === 'object'
  );
}

/**
 * Type guard to check if All_IOCs.json is valid
 */
export function isValidAllIOCs(obj: unknown): obj is AllIOCs {
  if (typeof obj !== 'object' || obj === null) return false;
  const data = obj as Record<string, unknown>;
  return (
    typeof data.generated_at === 'string' &&
    Array.isArray(data.apps) &&
    typeof data.stats === 'object'
  );
}
