/**
 * IoC Comparison Engine
 * Matches scan results against known Indicators of Compromise
 */

import { db, type FileHashIoC, type NetworkIoC, type PackageIoC, type ThreatDetection } from './database';
import { compareHashes, hashString } from './crypto';

// ==================== Types ====================

export interface ScanResult {
  fileHashes: Array<{ hash: string; fileName: string; size: number }>;
  networkConnections: Array<{ url: string; type: 'domain' | 'ip' }>;
  installedPackages: Array<{ packageName: string; version?: string; permissions?: string[] }>;
}

export interface MatchResult {
  threats: ThreatDetection[];
  stats: {
    filesScanned: number;
    networksChecked: number;
    packagesScanned: number;
    threatsFound: number;
  };
}

// ==================== IoC Matching Engine ====================

export class IoCEngine {
  /**
   * Main scan function - checks all scan results against IoC database
   */
  async analyzeScanResults(scanData: ScanResult): Promise<MatchResult> {
    const threats: ThreatDetection[] = [];

    // Check file hashes
    const fileThreats = await this.checkFileHashes(scanData.fileHashes);
    threats.push(...fileThreats);

    // Check network connections
    const networkThreats = await this.checkNetworkConnections(scanData.networkConnections);
    threats.push(...networkThreats);

    // Check installed packages
    const packageThreats = await this.checkPackages(scanData.installedPackages);
    threats.push(...packageThreats);

    // Sort by severity
    threats.sort((a, b) => this.severityWeight(b.severity) - this.severityWeight(a.severity));

    return {
      threats,
      stats: {
        filesScanned: scanData.fileHashes.length,
        networksChecked: scanData.networkConnections.length,
        packagesScanned: scanData.installedPackages.length,
        threatsFound: threats.length,
      },
    };
  }

  /**
   * Check file hashes against known malicious hashes
   */
  private async checkFileHashes(
    files: Array<{ hash: string; fileName: string; size: number }>
  ): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];
    const knownHashes = await db.getFileHashes();

    for (const file of files) {
      const match = knownHashes.find(ioc => compareHashes(ioc.hash, file.hash));

      if (match) {
        threats.push({
          id: `file_${Date.now()}_${Math.random()}`,
          type: 'file_hash',
          severity: match.severity,
          category: match.category,
          name: `Malicious File: ${file.fileName}`,
          description: match.description,
          matchedIoC: match.hash,
          evidence: {
            fileName: file.fileName,
            fileHash: file.hash,
            fileSize: file.size,
            algorithm: match.algorithm,
            source: match.source,
          },
          detectedAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    return threats;
  }

  /**
   * Check network connections against known malicious domains/IPs
   */
  private async checkNetworkConnections(
    connections: Array<{ url: string; type: 'domain' | 'ip' }>
  ): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];
    const knownNetworkIoCs = await db.getNetworkIoCs();

    for (const conn of connections) {
      // Extract domain from URL
      const domain = this.extractDomain(conn.url);
      
      // Check exact match
      let match = knownNetworkIoCs.find(ioc => 
        ioc.value === domain || ioc.value === conn.url
      );

      // Check subdomain match (e.g., evil.com matches sub.evil.com)
      // Use proper subdomain check: domain must end with ".ioc" or equal "ioc"
      if (!match) {
        match = knownNetworkIoCs.find(ioc => {
          if (!ioc.value || !domain) return false;
          // Exact match already checked above
          // Check if domain is a subdomain of the IoC (e.g., "sub.evil.com" matches IoC "evil.com")
          return domain.endsWith('.' + ioc.value);
        });
      }

      if (match) {
        threats.push({
          id: `network_${Date.now()}_${Math.random()}`,
          type: 'network',
          severity: match.severity,
          category: match.category,
          name: `Suspicious Network Connection: ${domain}`,
          description: match.description,
          matchedIoC: match.value,
          evidence: {
            url: conn.url,
            domain,
            type: conn.type,
            source: match.source,
          },
          detectedAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    return threats;
  }

  /**
   * Check installed packages against known stalkerware/spyware
   */
  private async checkPackages(
    packages: Array<{ packageName: string; version?: string; permissions?: string[] }>
  ): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];
    const knownPackages = await db.getPackageIoCs();

    for (const pkg of packages) {
      // Use exact package name matching only to prevent false positives
      // e.g., "com.spy" should NOT match "com.spyguard.app"
      const match = knownPackages.find(ioc =>
        ioc.packageName === pkg.packageName
      );

      if (match) {
        threats.push({
          id: `package_${Date.now()}_${Math.random()}`,
          type: 'package',
          severity: match.severity,
          category: match.category,
          name: `${this.getCategoryName(match.category)} Detected: ${pkg.packageName}`,
          description: match.description,
          matchedIoC: match.packageName,
          evidence: {
            packageName: pkg.packageName,
            version: pkg.version,
            permissions: pkg.permissions,
            platform: match.platform,
            source: match.source,
            signatures: match.signatures,
          },
          detectedAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    return threats;
  }

  /**
   * Check a single file hash against database
   */
  async checkSingleFileHash(hash: string): Promise<FileHashIoC | null> {
    return await db.findFileHash(hash);
  }

  /**
   * Check a single network connection
   */
  async checkSingleNetwork(url: string): Promise<NetworkIoC | null> {
    const domain = this.extractDomain(url);
    return await db.findNetworkIoC(domain);
  }

  /**
   * Check a single package
   */
  async checkSinglePackage(packageName: string): Promise<PackageIoC | null> {
    return await db.findPackageIoC(packageName);
  }

  // ==================== Helper Methods ====================

  private extractDomain(url: string): string {
    try {
      // Remove protocol
      let domain = url.replace(/^https?:\/\//, '');
      // Remove path
      domain = domain.split('/')[0];
      // Remove port
      domain = domain.split(':')[0];
      return domain.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private severityWeight(severity: string): number {
    const weights: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return weights[severity] || 0;
  }

  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      stalkerware: 'Stalkerware',
      spyware: 'Spyware',
      malware: 'Malware',
      tracking: 'Tracking Software',
      phishing: 'Phishing',
      c2: 'Command & Control',
      other: 'Threat',
    };
    return names[category] || 'Unknown Threat';
  }

  /**
   * Get threat statistics from database
   */
  async getThreatStats(): Promise<{
    totalIoCs: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const [fileHashes, networkIoCs, packageIoCs] = await Promise.all([
      db.getFileHashes(),
      db.getNetworkIoCs(),
      db.getPackageIoCs(),
    ]);

    const allIoCs = [
      ...fileHashes.map(h => ({ category: h.category, severity: h.severity })),
      ...networkIoCs.map(n => ({ category: n.category, severity: n.severity })),
      ...packageIoCs.map(p => ({ category: p.category, severity: p.severity })),
    ];

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    allIoCs.forEach(ioc => {
      byType[ioc.category] = (byType[ioc.category] || 0) + 1;
      bySeverity[ioc.severity] = (bySeverity[ioc.severity] || 0) + 1;
    });

    return {
      totalIoCs: allIoCs.length,
      byType,
      bySeverity,
    };
  }
}

// Export singleton instance
export const iocEngine = new IoCEngine();
