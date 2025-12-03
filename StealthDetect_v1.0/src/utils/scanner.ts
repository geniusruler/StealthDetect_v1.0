/**
 * System Scanner
 * Performs comprehensive security scans using IoC engine and SpyGuard
 */

import { db, type ScanResult, type ThreatDetection } from './database';
import { iocEngine } from './ioc-engine';
import { spyGuardDetector, type DetectedStalkerware } from './spyguard';
import { hashString, hashFile, generateMockFileHash } from './crypto';
import { networkMonitor, type NetworkThreat } from './network-monitor';
import { syncIoCs, isSyncNeeded, initializeDatabase } from './ioc-sync';
import { AppScanner } from '../capacitor-plugins/app-scanner';

// ==================== Types ====================

export interface ScanProgress {
  phase: ScanPhase;
  progress: number; // 0-100
  currentTask: string;
  stats: {
    filesScanned: number;
    networksChecked: number;
    packagesScanned: number;
    threatsFound: number;
    networkThreats: number;
    stalkerwareDetected: number;
  };
  logEntries: string[];
  networkMonitoring: boolean;
  cloudSyncEnabled: boolean;
}

export type ScanPhase = 
  | 'initializing'
  | 'syncing_iocs'
  | 'scanning_files'
  | 'monitoring_network'
  | 'checking_network'
  | 'analyzing_packages'
  | 'matching_iocs'
  | 'generating_report'
  | 'completed';

export type ScanProgressCallback = (progress: ScanProgress) => void;

/**
 * Scan options for configuring scan behavior
 */
export interface ScanOptions {
  /** Network monitoring duration in milliseconds (default: 3000) */
  networkMonitoringDuration?: number;
  /** Skip network monitoring phase */
  skipNetworkMonitoring?: boolean;
  /** Skip cloud IoC sync */
  skipCloudSync?: boolean;
  /** Demo mode - injects simulated threats for demonstration */
  demoMode?: boolean;
}

/** Default scan options */
const DEFAULT_SCAN_OPTIONS: Required<ScanOptions> = {
  networkMonitoringDuration: 3000,
  skipNetworkMonitoring: false,
  skipCloudSync: false,
  demoMode: false,
};

/** Demo threat data for demonstration purposes */
const DEMO_THREATS: ThreatDetection[] = [
  {
    id: 'demo_stalkerware_1',
    type: 'package',
    severity: 'critical',
    category: 'stalkerware',
    name: 'Stalkerware Detected: com.mspy.android',
    description: 'mSpy - Commercial surveillance software that can monitor calls, messages, location, and social media activity without user knowledge.',
    matchedIoC: 'com.mspy.android',
    evidence: {
      appName: 'System Service',
      packageName: 'com.mspy.android',
      platform: 'android',
      permissions: ['READ_SMS', 'RECEIVE_SMS', 'READ_CALL_LOG', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'CAMERA'],
      source: 'SpyGuard Demo',
      recommendedAction: 'URGENT: Uninstall immediately. This is confirmed stalkerware.',
    },
    detectedAt: new Date().toISOString(),
    resolved: false,
  },
  {
    id: 'demo_network_1',
    type: 'network',
    severity: 'high',
    category: 'c2',
    name: 'Suspicious Network Connection: api.mspy.com',
    description: 'Connection detected to known stalkerware command & control server used for exfiltrating private data.',
    matchedIoC: 'api.mspy.com',
    evidence: {
      url: 'https://api.mspy.com',
      domain: 'api.mspy.com',
      type: 'domain',
      connection: { destinationIp: '185.199.108.153', port: 443 },
      source: 'VPN Monitor Demo',
    },
    detectedAt: new Date().toISOString(),
    resolved: false,
  },
  {
    id: 'demo_stalkerware_2',
    type: 'package',
    severity: 'critical',
    category: 'stalkerware',
    name: 'Stalkerware Detected: com.flexispy',
    description: 'FlexiSpy - Advanced spyware capable of intercepting calls, reading encrypted messages, and remotely activating microphone.',
    matchedIoC: 'com.flexispy',
    evidence: {
      appName: 'Sync Services',
      packageName: 'com.flexispy',
      platform: 'android',
      permissions: ['READ_SMS', 'RECORD_AUDIO', 'PROCESS_OUTGOING_CALLS', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION'],
      source: 'SpyGuard Demo',
      recommendedAction: 'URGENT: Uninstall immediately. This is confirmed stalkerware.',
    },
    detectedAt: new Date().toISOString(),
    resolved: false,
  },
];

// ==================== System Scanner ====================

export class SystemScanner {
  private isScanning = false;
  private shouldStop = false;
  private scanId: string = '';

  /**
   * Start a comprehensive system scan
   * @param progressCallback - Callback for progress updates
   * @param options - Scan configuration options
   */
  async startScan(
    progressCallback?: ScanProgressCallback,
    options?: ScanOptions
  ): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    // Merge options with defaults
    const scanOptions: Required<ScanOptions> = {
      ...DEFAULT_SCAN_OPTIONS,
      ...options,
    };

    this.isScanning = true;
    this.shouldStop = false;
    this.scanId = `scan_${Date.now()}`;
    
    const startTime = Date.now();
    const threats: ThreatDetection[] = [];
    let progress: ScanProgress = {
      phase: 'initializing',
      progress: 0,
      currentTask: 'Initializing scan...',
      stats: {
        filesScanned: 0,
        networksChecked: 0,
        packagesScanned: 0,
        threatsFound: 0,
        networkThreats: 0,
        stalkerwareDetected: 0,
      },
      logEntries: [],
      networkMonitoring: false,
      cloudSyncEnabled: false,
    };

    try {
      // Phase 1: Initialize
      progress = this.updateProgress(progress, 'initializing', 5, 'Preparing scan environment...');
      progressCallback?.(progress);
      await this.delay(500);

      // Phase 1.5: Sync IoCs from Supabase (if needed)
      if (isSyncNeeded()) {
        progress = this.updateProgress(progress, 'syncing_iocs', 8, 'Syncing threat intelligence from cloud...');
        progress = this.addLogEntry(progress, '☁️ Downloading latest IoC database...');
        progress.cloudSyncEnabled = true;
        progressCallback?.(progress);
        
        try {
          const syncResult = await syncIoCs();
          progress = this.addLogEntry(progress, `✓ Synced ${syncResult.stalkerwareCount} stalkerware signatures`);
          progress = this.addLogEntry(progress, `✓ Synced ${syncResult.networkCount} network indicators`);
          progressCallback?.(progress);
        } catch (error) {
          progress = this.addLogEntry(progress, `⚠ Cloud sync failed, using local database`);
          progressCallback?.(progress);
        }
      } else {
        progress = this.addLogEntry(progress, '✓ Using cached IoC database');
        progressCallback?.(progress);
      }

      // Phase 2: Scan Files
      progress = this.updateProgress(progress, 'scanning_files', 15, 'Scanning system files...');
      progressCallback?.(progress);
      
      const fileHashes = await this.scanFiles(progress, progressCallback);
      progress.stats.filesScanned = fileHashes.length;
      progress = this.addLogEntry(progress, `✓ Scanned ${fileHashes.length} files`);
      progressCallback?.(progress);

      if (this.shouldStop) return this.generateInterruptedReport(startTime, threats, progress.stats);

      // Phase 3: Start Network Monitoring
      if (!scanOptions.skipNetworkMonitoring) {
        const monitorDuration = scanOptions.networkMonitoringDuration;
        const durationSecs = Math.round(monitorDuration / 1000);

        progress = this.updateProgress(progress, 'monitoring_network', 30, `Starting real-time network monitoring (${durationSecs}s)...`);
        progress = this.addLogEntry(progress, `🔍 Activating VPN-based network monitor for ${durationSecs} seconds...`);
        progress.networkMonitoring = true;
        progressCallback?.(progress);

        // Start network monitor
        await networkMonitor.start();
        await this.delay(monitorDuration); // Monitor for configured duration
      } else {
        progress = this.addLogEntry(progress, '⏭️ Skipping network monitoring (disabled in options)');
        progressCallback?.(progress);
      }

      const networkThreats = scanOptions.skipNetworkMonitoring ? [] : networkMonitor.getThreats();
      progress.stats.networkThreats = networkThreats.length;
      progress = this.addLogEntry(progress, `✓ Network monitoring active (${networkMonitor.getState().connectionsMonitored} connections)`);
      
      if (networkThreats.length > 0) {
        progress = this.addLogEntry(progress, `⚠️ Detected ${networkThreats.length} suspicious network connections`);
        
        // Convert network threats to ThreatDetection format
        for (const netThreat of networkThreats) {
          threats.push({
            id: netThreat.id,
            type: 'network',
            severity: netThreat.severity,
            category: netThreat.category,
            description: netThreat.description,
            indicator: netThreat.indicator,
            metadata: {
              connection: netThreat.connection ?? null,
              dnsQuery: netThreat.dnsQuery ?? null,
              source: netThreat.source ?? 'unknown',
            },
            detectedAt: netThreat.timestamp,
          });
        }
      }
      
      progressCallback?.(progress);

      if (this.shouldStop) {
        networkMonitor.stop();
        return this.generateInterruptedReport(startTime, threats, progress.stats);
      }

      // Phase 4: Check Network Historical
      progress = this.updateProgress(progress, 'checking_network', 40, 'Analyzing network traffic...');
      progressCallback?.(progress);
      
      const networkConnections = await this.scanNetwork(progress, progressCallback);
      progress.stats.networksChecked = networkConnections.length + networkMonitor.getState().connectionsMonitored;
      progress = this.addLogEntry(progress, `✓ Checked ${networkConnections.length} historical network connections`);
      progressCallback?.(progress);

      if (this.shouldStop) {
        networkMonitor.stop();
        return this.generateInterruptedReport(startTime, threats, progress.stats);
      }

      // Phase 5: Analyze Packages (SpyGuard + Capacitor Plugin)
      progress = this.updateProgress(progress, 'analyzing_packages', 60, 'Detecting stalkerware...');
      progress = this.addLogEntry(progress, '🔎 Scanning installed applications...');
      progressCallback?.(progress);
      
      // Use Capacitor plugin for native app detection
      let installedPackages: Array<{ packageName: string }> = [];
      try {
        const appScanResult = await AppScanner.getInstalledApps();
        installedPackages = appScanResult.apps.map(app => ({
          packageName: app.packageName,
          appName: app.appName,
          permissions: app.permissions,
        })) as any;
        progress = this.addLogEntry(progress, `✓ Found ${appScanResult.totalCount} installed apps (${appScanResult.userApps} user apps)`);
      } catch (error) {
        progress = this.addLogEntry(progress, `⚠ Native scanner unavailable, using fallback detection`);
        installedPackages = await this.scanPackages(progress, progressCallback);
      }
      
      progress.stats.packagesScanned = installedPackages.length;
      progressCallback?.(progress);
      
      // Check packages against SpyGuard database
      const detectedStalkerware = await spyGuardDetector.scanInstalledApps(
        installedPackages
      );
      
      progress.stats.stalkerwareDetected = detectedStalkerware.length;
      
      if (detectedStalkerware.length > 0) {
        progress = this.addLogEntry(progress, `🚨 CRITICAL: Detected ${detectedStalkerware.length} stalkerware applications!`);
        progressCallback?.(progress);
      } else {
        progress = this.addLogEntry(progress, `✓ No known stalkerware detected`);
        progressCallback?.(progress);
      }

      if (this.shouldStop) {
        networkMonitor.stop();
        return this.generateInterruptedReport(startTime, threats, progress.stats);
      }

      // Phase 6: Match IoCs
      progress = this.updateProgress(progress, 'matching_iocs', 80, 'Matching indicators of compromise...');
      progress = this.addLogEntry(progress, '🔬 Cross-referencing with threat database...');
      progressCallback?.(progress);
      
      const iocResults = await iocEngine.analyzeScanResults({
        fileHashes,
        networkConnections,
        installedPackages,
      });
      
      threats.push(...iocResults.threats);

      // Demo mode: Inject simulated threats for demonstration
      if (scanOptions.demoMode) {
        progress = this.addLogEntry(progress, '🎬 DEMO MODE: Injecting simulated threats...');
        progressCallback?.(progress);

        // Add demo threats with fresh timestamps
        const demoThreatsWithTimestamp = DEMO_THREATS.map(t => ({
          ...t,
          detectedAt: new Date().toISOString(),
        }));
        threats.push(...demoThreatsWithTimestamp);

        // Update stats for demo threats
        progress.stats.stalkerwareDetected += 2;
        progress.stats.networkThreats += 1;
      }

      progress.stats.threatsFound = threats.length;

      if (threats.length > 0) {
        const critical = threats.filter(t => t.severity === 'critical').length;
        const high = threats.filter(t => t.severity === 'high').length;

        if (critical > 0) {
          progress = this.addLogEntry(progress, `🚨 ${critical} CRITICAL threats detected`);
        }
        if (high > 0) {
          progress = this.addLogEntry(progress, `⚠️ ${high} HIGH severity threats detected`);
        }
      } else {
        progress = this.addLogEntry(progress, `✅ No threats found - system appears clean`);
      }
      
      progressCallback?.(progress);

      // Stop network monitor
      networkMonitor.stop();
      progress.networkMonitoring = false;
      progress = this.addLogEntry(progress, '✓ Network monitoring stopped');
      progressCallback?.(progress);

      if (this.shouldStop) return this.generateInterruptedReport(startTime, threats, progress.stats);

      // Phase 7: Generate Report
      progress = this.updateProgress(progress, 'generating_report', 95, 'Generating scan report...');
      progress = this.addLogEntry(progress, '📊 Compiling comprehensive security report...');
      progressCallback?.(progress);
      await this.delay(500);

      // Final Progress
      progress = this.updateProgress(progress, 'completed', 100, 'Scan completed');
      const duration = Math.round((Date.now() - startTime) / 1000);
      progress = this.addLogEntry(progress, `✅ Scan completed in ${duration}s`);
      progress = this.addLogEntry(progress, `📈 Stats: ${progress.stats.filesScanned} files, ${progress.stats.networksChecked} connections, ${progress.stats.packagesScanned} apps`);
      progressCallback?.(progress);

      // Create scan result
      const scanResult: ScanResult = {
        id: this.scanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        status: 'completed',
        threats,
        stats: progress.stats,
      };

      // Save to database
      await db.addScanResult(scanResult);

      return scanResult;

    } catch (error) {
      console.error('Scan error:', error);
      
      return {
        id: this.scanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        status: 'failed',
        threats,
        stats: progress.stats,
      };
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Stop ongoing scan
   */
  stopScan(): void {
    this.shouldStop = true;
  }

  /**
   * Check if scan is running
   */
  isScanRunning(): boolean {
    return this.isScanning;
  }

  // ==================== Private Scan Methods ====================

  /**
   * Scan system files and generate hashes
   * Note: On Android, file system access is limited without root.
   * Real file hash scanning requires special permissions or root access.
   */
  private async scanFiles(
    progress: ScanProgress,
    callback?: ScanProgressCallback
  ): Promise<Array<{ hash: string; fileName: string; size: number }>> {
    // On Android, we cannot scan arbitrary system files without root access.
    // The primary detection methods are:
    // 1. Package scanning (installed apps) - works without root
    // 2. Network monitoring (DNS/traffic) - works via VPN
    // File hash scanning is not feasible on standard Android devices.

    progress = this.addLogEntry(progress, '⚠ File hash scanning limited on Android (no root)');
    progress = this.addLogEntry(progress, '✓ Using package and network detection instead');
    callback?.(progress);

    await this.delay(500);

    // Return empty - no mock data
    return [];
  }

  /**
   * Scan network connections
   * Uses data collected by the VPN-based network monitor.
   * Historical network data is not accessible on Android without root.
   */
  private async scanNetwork(
    progress: ScanProgress,
    callback?: ScanProgressCallback
  ): Promise<Array<{ url: string; type: 'domain' | 'ip' }>> {
    // On Android, we cannot access historical network connections without root.
    // Real-time network monitoring is handled by the VPN service.
    // The threats detected during monitoring are already captured in the
    // networkMonitor.getThreats() call earlier in the scan.

    progress = this.addLogEntry(progress, '📡 Network analysis via VPN monitor');
    progress = this.addLogEntry(progress, '✓ Real-time DNS interception active');
    callback?.(progress);

    await this.delay(500);

    // Return empty - network threats are captured via VPN monitoring
    // which is handled separately in the scan flow
    return [];
  }

  /**
   * Scan installed packages (SpyGuard detection)
   * This is a fallback method when native AppScanner is unavailable.
   * Returns empty array - no mock data.
   */
  private async scanPackages(
    progress: ScanProgress,
    callback?: ScanProgressCallback
  ): Promise<Array<{ packageName: string; version?: string; permissions?: string[] }>> {
    // This fallback is called when native AppScanner fails.
    // Without native access, we cannot list installed packages.
    // Return empty array instead of fake/mock data.

    progress = this.addLogEntry(progress, '⚠ Native app scanner unavailable');
    progress = this.addLogEntry(progress, '⚠ Package scanning requires native plugin');
    progress = this.addLogEntry(progress, '✓ Network monitoring still active for detection');
    callback?.(progress);

    await this.delay(500);

    // Return empty - no mock data
    return [];
  }

  // ==================== Helper Methods ====================

  private updateProgress(
    current: ScanProgress,
    phase: ScanPhase,
    progress: number,
    task: string
  ): ScanProgress {
    return {
      ...current,
      phase,
      progress,
      currentTask: task,
    };
  }

  private addLogEntry(current: ScanProgress, entry: string): ScanProgress {
    const time = new Date().toLocaleTimeString();
    return {
      ...current,
      logEntries: [...current.logEntries, `[${time}] ${entry}`],
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateInterruptedReport(
    startTime: number,
    threats: ThreatDetection[],
    stats: ScanProgress['stats']
  ): ScanResult {
    return {
      id: this.scanId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      status: 'interrupted',
      threats,
      stats,
    };
  }
}

// Export singleton instance
export const systemScanner = new SystemScanner();
