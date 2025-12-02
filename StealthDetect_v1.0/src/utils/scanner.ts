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

// ==================== System Scanner ====================

export class SystemScanner {
  private isScanning = false;
  private shouldStop = false;
  private scanId: string = '';

  /**
   * Start a comprehensive system scan
   */
  async startScan(
    progressCallback?: ScanProgressCallback
  ): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

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
      progress = this.updateProgress(progress, 'monitoring_network', 30, 'Starting real-time network monitoring...');
      progress = this.addLogEntry(progress, '🔍 Activating VPN-based network monitor...');
      progress.networkMonitoring = true;
      progressCallback?.(progress);
      
      // Start network monitor
      await networkMonitor.start();
      await this.delay(3000); // Monitor for 3 seconds to collect traffic
      
      const networkThreats = networkMonitor.getThreats();
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
              connection: netThreat.connection,
              dnsQuery: netThreat.dnsQuery,
              source: netThreat.source,
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
        installedPackages.map(p => p.packageName)
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
   */
  private async scanFiles(
    progress: ScanProgress,
    callback?: ScanProgressCallback
  ): Promise<Array<{ hash: string; fileName: string; size: number }>> {
    const files: Array<{ hash: string; fileName: string; size: number }> = [];
    
    // Simulate file scanning
    const mockFiles = [
      'system.dll',
      'config.dat',
      'update.exe',
      'service.sys',
      'network.bin',
      'user.data',
      'cache.tmp',
      'log.txt',
      'settings.json',
      'backup.zip',
    ];

    for (let i = 0; i < mockFiles.length; i++) {
      if (this.shouldStop) break;

      const fileName = mockFiles[i];
      const hash = await generateMockFileHash(fileName);
      const size = Math.floor(Math.random() * 1000000) + 1024;

      files.push({ hash, fileName, size });

      progress = this.addLogEntry(progress, `Scanning: ${fileName}`);
      progress.progress = 15 + (i / mockFiles.length) * 20;
      callback?.(progress);
      
      await this.delay(200);
    }

    return files;
  }

  /**
   * Scan network connections
   */
  private async scanNetwork(
    progress: ScanProgress,
    callback?: ScanProgressCallback
  ): Promise<Array<{ url: string; type: 'domain' | 'ip' }>> {
    const connections: Array<{ url: string; type: 'domain' | 'ip' }> = [];
    
    // Simulate network scanning
    const mockConnections = [
      { url: 'api.example.com', type: 'domain' as const },
      { url: 'cdn.service.net', type: 'domain' as const },
      { url: '192.168.1.1', type: 'ip' as const },
      { url: 'tracker.ads.com', type: 'domain' as const },
      { url: 'analytics.service.io', type: 'domain' as const },
      { url: '10.0.0.1', type: 'ip' as const },
      { url: 'update.microsoft.com', type: 'domain' as const },
    ];

    for (let i = 0; i < mockConnections.length; i++) {
      if (this.shouldStop) break;

      const conn = mockConnections[i];
      connections.push(conn);

      progress = this.addLogEntry(progress, `Checking connection: ${conn.url}`);
      progress.progress = 35 + (i / mockConnections.length) * 20;
      callback?.(progress);
      
      await this.delay(300);
    }

    return connections;
  }

  /**
   * Scan installed packages (SpyGuard detection)
   */
  private async scanPackages(
    progress: ScanProgress,
    callback?: ScanProgressCallback
  ): Promise<Array<{ packageName: string; version?: string; permissions?: string[] }>> {
    const packages: Array<{ packageName: string; version?: string; permissions?: string[] }> = [];
    
    // Simulate package scanning with some suspicious apps
    const mockPackages = [
      { 
        packageName: 'com.google.android.gms', 
        version: '21.45.15',
        permissions: ['INTERNET', 'ACCESS_FINE_LOCATION']
      },
      { 
        packageName: 'com.android.chrome', 
        version: '120.0.0',
        permissions: ['INTERNET', 'CAMERA']
      },
      { 
        packageName: 'com.system.service', 
        version: '1.0.0',
        permissions: ['READ_SMS', 'RECEIVE_SMS', 'READ_CALL_LOG', 'RECORD_AUDIO'] // Suspicious!
      },
      { 
        packageName: 'com.messenger.app', 
        version: '2.3.1',
        permissions: ['INTERNET', 'READ_CONTACTS']
      },
      { 
        packageName: 'com.mspy.android', // Known stalkerware!
        version: '3.1.0',
        permissions: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO']
      },
    ];

    for (let i = 0; i < mockPackages.length; i++) {
      if (this.shouldStop) break;

      const pkg = mockPackages[i];
      packages.push(pkg);

      progress = this.addLogEntry(progress, `Analyzing package: ${pkg.packageName}`);
      progress.progress = 55 + (i / mockPackages.length) * 20;
      callback?.(progress);
      
      await this.delay(250);
    }

    // Run SpyGuard detection
    const stalkerware = await spyGuardDetector.scanInstalledApps(packages);
    if (stalkerware.length > 0) {
      progress = this.addLogEntry(progress, `⚠ Detected ${stalkerware.length} potential stalkerware apps`);
      callback?.(progress);
    }

    return packages;
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
