/**
 * VPN-based Network Monitoring System
 * Monitors network traffic for connections to known stalkerware infrastructure
 *
 * Uses the VPN Service Plugin for DNS interception and Web Worker for IoC matching
 */

import { VpnService } from '../capacitor-plugins/vpn-service';
import type {
  DnsRequestEvent,
  VpnStatus,
  VpnStateChangeEvent,
} from '../capacitor-plugins/vpn-service/definitions';
import { iocWorkerManager, type ThreatInfo } from './ioc-worker-manager';
import { db } from './database';
import type { PluginListenerHandle } from '@capacitor/core';

// ==================== Types ====================

export interface NetworkConnection {
  timestamp: string;
  domain: string;
  ip: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'HTTPS';
  bytesIn: number;
  bytesOut: number;
  appPackage?: string;
}

export interface DnsQuery {
  timestamp: string;
  domain: string;
  queryType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT';
  response: string[];
  appPackage?: string;
}

export interface NetworkThreat {
  id: string;
  timestamp: string;
  type: 'domain' | 'ip' | 'dns_query';
  indicator: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  appName?: string;
  sourceApp?: string;
  dnsQuery?: DnsRequestEvent;
  source: string;
}

export interface NetworkMonitorState {
  isMonitoring: boolean;
  vpnConnected: boolean;
  connectionsMonitored: number;
  dnsQueriesMonitored: number;
  threatsDetected: number;
  startTime: string | null;
  workerInitialized: boolean;
}

// ==================== Network Monitor Class ====================

class NetworkMonitor {
  private isMonitoring = false;
  private vpnConnected = false;
  private threats: NetworkThreat[] = [];
  private dnsQueriesCount = 0;
  private connectionsCount = 0;
  private monitoringStartTime: string | null = null;

  // Event listeners
  private dnsListener: PluginListenerHandle | null = null;
  private stateListener: PluginListenerHandle | null = null;

  // Callbacks for external consumers
  private onThreatDetected: ((threat: NetworkThreat) => void) | null = null;
  private onDnsQuery: ((event: DnsRequestEvent) => void) | null = null;

  /**
   * Start network monitoring with VPN
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('[NetworkMonitor] Already monitoring');
      return;
    }

    console.log('[NetworkMonitor] Starting with VPN plugin...');

    // Reset state
    this.threats = [];
    this.dnsQueriesCount = 0;
    this.connectionsCount = 0;
    this.monitoringStartTime = new Date().toISOString();

    try {
      // Start VPN service
      const result = await VpnService.startVpn();

      if (!result.success) {
        if (result.requiresPermission) {
          throw new Error('VPN permission required - please grant permission and try again');
        }
        throw new Error(result.errorMessage || 'Failed to start VPN');
      }

      this.vpnConnected = true;
      this.isMonitoring = true;

      // Set up event listeners
      await this.setupListeners();

      console.log('[NetworkMonitor] Started successfully');
    } catch (error) {
      console.error('[NetworkMonitor] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop network monitoring
   */
  async stop(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[NetworkMonitor] Stopping...');

    // Remove listeners
    await this.removeListeners();

    // Stop VPN
    try {
      await VpnService.stopVpn();
    } catch (error) {
      console.error('[NetworkMonitor] Error stopping VPN:', error);
    }

    this.vpnConnected = false;
    this.isMonitoring = false;

    console.log('[NetworkMonitor] Stopped');
  }

  /**
   * Get current monitoring state
   */
  getState(): NetworkMonitorState {
    return {
      isMonitoring: this.isMonitoring,
      vpnConnected: this.vpnConnected,
      connectionsMonitored: this.connectionsCount,
      dnsQueriesMonitored: this.dnsQueriesCount,
      threatsDetected: this.threats.length,
      startTime: this.monitoringStartTime,
      workerInitialized: iocWorkerManager.isInitialized(),
    };
  }

  /**
   * Get all detected threats
   */
  getThreats(): NetworkThreat[] {
    return [...this.threats];
  }

  /**
   * Get VPN status from plugin
   */
  async getVpnStatus(): Promise<VpnStatus> {
    return await VpnService.getVpnStatus();
  }

  /**
   * Check if VPN permission is granted
   */
  async checkVpnPermission(): Promise<boolean> {
    const result = await VpnService.checkPermission();
    return result.granted;
  }

  /**
   * Request VPN permission
   */
  async requestVpnPermission(): Promise<boolean> {
    const result = await VpnService.requestPermission();
    return result.granted;
  }

  /**
   * Set callback for when a threat is detected
   */
  setOnThreatDetected(callback: (threat: NetworkThreat) => void): void {
    this.onThreatDetected = callback;
  }

  /**
   * Set callback for DNS query events
   */
  setOnDnsQuery(callback: (event: DnsRequestEvent) => void): void {
    this.onDnsQuery = callback;
  }

  /**
   * Clear callbacks
   */
  clearCallbacks(): void {
    this.onThreatDetected = null;
    this.onDnsQuery = null;
  }

  // ==================== Private Methods ====================

  private async setupListeners(): Promise<void> {
    // Listen for DNS request events
    this.dnsListener = await VpnService.addListener('dnsRequest', (event) => {
      this.handleDnsRequest(event);
    });

    // Listen for VPN state changes
    this.stateListener = await VpnService.addListener('vpnStateChange', (event) => {
      this.handleStateChange(event);
    });
  }

  private async removeListeners(): Promise<void> {
    if (this.dnsListener) {
      await this.dnsListener.remove();
      this.dnsListener = null;
    }

    if (this.stateListener) {
      await this.stateListener.remove();
      this.stateListener = null;
    }
  }

  private async handleDnsRequest(event: DnsRequestEvent): Promise<void> {
    this.dnsQueriesCount++;

    // Notify external listener
    if (this.onDnsQuery) {
      this.onDnsQuery(event);
    }

    // Check against IoC database using Web Worker
    let threat: ThreatInfo | null = null;

    if (iocWorkerManager.isInitialized()) {
      threat = await iocWorkerManager.matchDnsQuery(event);
    } else {
      // Fallback to database query if worker not initialized
      const match = await db.findNetworkIoC(event.domain);
      if (match) {
        threat = {
          indicator: match.value,
          indicatorType: match.type,
          appName: 'Unknown',
          category: match.category,
          severity: match.severity,
          description: match.description,
          source: match.source,
        };
      }
    }

    if (threat) {
      const networkThreat = this.createNetworkThreat(event, threat);
      this.threats.push(networkThreat);

      console.warn('[NetworkMonitor] Threat detected:', networkThreat);

      // Notify external listener
      if (this.onThreatDetected) {
        this.onThreatDetected(networkThreat);
      }
    }
  }

  private handleStateChange(event: VpnStateChangeEvent): void {
    console.log('[NetworkMonitor] VPN state changed:', event.state);

    switch (event.state) {
      case 'connected':
        this.vpnConnected = true;
        break;
      case 'disconnected':
        this.vpnConnected = false;
        break;
      case 'error':
        console.error('[NetworkMonitor] VPN error:', event.errorMessage);
        this.vpnConnected = false;
        break;
    }
  }

  private createNetworkThreat(event: DnsRequestEvent, threat: ThreatInfo): NetworkThreat {
    return {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: event.timestamp,
      type: 'dns_query',
      indicator: event.domain,
      severity: threat.severity,
      category: threat.category,
      description: threat.description,
      appName: threat.appName,
      sourceApp: event.sourceApp || undefined,
      dnsQuery: event,
      source: threat.source,
    };
  }

  /**
   * Export network monitoring report
   */
  exportReport(): string {
    const report = {
      monitoring_period: {
        start: this.monitoringStartTime,
        end: new Date().toISOString(),
      },
      statistics: {
        dns_queries_monitored: this.dnsQueriesCount,
        connections_monitored: this.connectionsCount,
        threats_detected: this.threats.length,
      },
      threats: this.threats,
    };

    return JSON.stringify(report, null, 2);
  }
}

// ==================== Export Singleton ====================

export const networkMonitor = new NetworkMonitor();
