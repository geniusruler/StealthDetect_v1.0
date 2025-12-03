/**
 * Capacitor Plugin Implementation: App Scanner
 * Uses native Android plugin when available, returns empty on web
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import type { AppScannerPlugin, AppScanResult, InstalledApp, FileHashResult } from './definitions';

// Register the native plugin
const NativeAppScanner = registerPlugin<AppScannerPlugin>('AppScanner');

/**
 * Check if we're running on a native platform with the plugin available
 */
function isNativeAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AppScanner');
}

class AppScannerImpl implements AppScannerPlugin {
  /**
   * Get installed apps - uses native plugin on Android
   * Returns empty list on web (no mock data)
   */
  async getInstalledApps(): Promise<AppScanResult> {
    // Use native plugin if available
    if (isNativeAvailable()) {
      console.log('[AppScanner] Using native implementation');
      try {
        const result = await NativeAppScanner.getInstalledApps();
        console.log(`[AppScanner] Found ${result.totalCount} apps (${result.userApps} user apps)`);
        return result;
      } catch (error) {
        console.error('[AppScanner] Native call failed:', error);
        throw error;
      }
    }

    // Web fallback - return empty (no mock data for production)
    console.log('[AppScanner] Not on native platform - returning empty list');
    return {
      apps: [],
      totalCount: 0,
      systemApps: 0,
      userApps: 0,
    };
  }

  async getAppInfo(options: { packageName: string }): Promise<InstalledApp> {
    if (isNativeAvailable()) {
      return await NativeAppScanner.getAppInfo(options);
    }
    throw new Error('App info not available on web platform');
  }

  async checkAppsInstalled(options: { packageNames: string[] }): Promise<{ installed: string[] }> {
    if (isNativeAvailable()) {
      console.log(`[AppScanner] Checking ${options.packageNames.length} packages for stalkerware`);
      try {
        const result = await NativeAppScanner.checkAppsInstalled(options);
        if (result.installed.length > 0) {
          console.warn('[AppScanner] STALKERWARE DETECTED:', result.installed);
        }
        return result;
      } catch (error) {
        console.error('[AppScanner] checkAppsInstalled failed:', error);
        throw error;
      }
    }

    // Web fallback - return empty (no mock stalkerware detection)
    console.log('[AppScanner] Not on native platform - cannot check installed apps');
    return { installed: [] };
  }

  async getAppPermissions(options: { packageName: string }): Promise<{ permissions: string[] }> {
    if (isNativeAvailable()) {
      return await NativeAppScanner.getAppPermissions(options);
    }
    return { permissions: [] };
  }

  async generateFileHashes(options: { packageName: string }): Promise<FileHashResult> {
    // File hashing not implemented for security reasons
    console.log('[AppScanner] File hash generation not available');
    return {
      packageName: options.packageName,
      hashes: [],
    };
  }

  async analyzePermissions(options: { packageName: string }): Promise<{
    packageName: string;
    suspiciousPatterns: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    if (isNativeAvailable()) {
      return await NativeAppScanner.analyzePermissions(options);
    }

    // Web fallback
    return {
      packageName: options.packageName,
      suspiciousPatterns: [],
      riskLevel: 'low',
    };
  }
}

// Export singleton instance
export const AppScanner = new AppScannerImpl();

/**
 * Stalkerware URL Scheme Database
 * For use with iOS URL scheme detection
 */
export const STALKERWARE_URL_SCHEMES: Record<string, string> = {
  // Known stalkerware URL schemes
  'com.mspy.android': 'mspy://',
  'com.flexispy': 'flexispy://',
  'com.hoverwatch.app': 'hoverwatch://',
  'com.thetruthspy.app': 'thetruthspy://',
  'com.spyera.android': 'spyera://',

  // Note: Most stalkerware intentionally doesn't register URL schemes
  // to avoid detection. This approach has limited effectiveness.
  // Network monitoring (VPN approach) is more reliable.
};
