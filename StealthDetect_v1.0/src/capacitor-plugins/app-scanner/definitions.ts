/**
 * Capacitor Plugin: App Scanner
 * Native iOS/Android plugin for scanning installed applications
 */

export interface InstalledApp {
  packageName: string;
  bundleId: string;
  appName: string;
  version: string;
  installDate: string;
  permissions: string[];
  size: number;
  isSystemApp: boolean;
}

export interface AppScanResult {
  apps: InstalledApp[];
  totalCount: number;
  systemApps: number;
  userApps: number;
}

export interface FileHashResult {
  packageName: string;
  hashes: {
    sha256: string;
    md5: string;
    file: string;
  }[];
}

export interface AppScannerPlugin {
  /**
   * Get list of all installed applications
   * 
   * Note: On iOS, this is restricted. Only jailbroken devices or
   * apps using private APIs can enumerate all installed apps.
   * Standard implementation returns limited information.
   */
  getInstalledApps(): Promise<AppScanResult>;

  /**
   * Get detailed information about a specific app
   */
  getAppInfo(options: { packageName: string }): Promise<InstalledApp>;

  /**
   * Check if specific apps are installed (URL scheme-based detection for iOS)
   * This is the ONLY reliable method on non-jailbroken iOS
   */
  checkAppsInstalled(options: { packageNames: string[] }): Promise<{ installed: string[] }>;

  /**
   * Get app permissions (Android only)
   */
  getAppPermissions(options: { packageName: string }): Promise<{ permissions: string[] }>;

  /**
   * Generate file hashes for app binaries
   * Note: Requires file system access, may need jailbreak on iOS
   */
  generateFileHashes(options: { packageName: string }): Promise<FileHashResult>;

  /**
   * Check for suspicious permission patterns
   */
  analyzePermissions(options: { packageName: string }): Promise<{
    packageName: string;
    suspiciousPatterns: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
}
