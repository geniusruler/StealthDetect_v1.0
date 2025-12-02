/**
 * VPN Service Plugin Definitions
 * Provides DNS request monitoring via Android VpnService
 */

import type { PluginListenerHandle } from '@capacitor/core';

// ==================== Plugin Interface ====================

export interface VpnServicePlugin {
  /**
   * Start the VPN service for DNS monitoring
   * Returns success status and whether user permission is required
   */
  startVpn(): Promise<StartVpnResult>;

  /**
   * Stop the VPN service
   */
  stopVpn(): Promise<StopVpnResult>;

  /**
   * Get current VPN connection status
   */
  getVpnStatus(): Promise<VpnStatus>;

  /**
   * Check if VPN permission has been granted
   */
  checkPermission(): Promise<PermissionResult>;

  /**
   * Request VPN permission from user
   * Opens Android VPN consent dialog
   */
  requestPermission(): Promise<PermissionResult>;

  /**
   * Add listener for DNS request events
   * Fired for each DNS query intercepted by the VPN
   */
  addListener(
    eventName: 'dnsRequest',
    listenerFunc: (event: DnsRequestEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for VPN state changes
   */
  addListener(
    eventName: 'vpnStateChange',
    listenerFunc: (event: VpnStateChangeEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for connection events
   */
  addListener(
    eventName: 'connectionEvent',
    listenerFunc: (event: ConnectionEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all event listeners
   */
  removeAllListeners(): Promise<void>;
}

// ==================== Result Types ====================

export interface StartVpnResult {
  success: boolean;
  requiresPermission: boolean;
  errorMessage?: string;
}

export interface StopVpnResult {
  success: boolean;
  errorMessage?: string;
}

export interface PermissionResult {
  granted: boolean;
}

export interface VpnStatus {
  connected: boolean;
  startTime: string | null;
  packetsProcessed: number;
  dnsQueriesIntercepted: number;
}

// ==================== Event Types ====================

export interface DnsRequestEvent {
  /** ISO timestamp of the DNS query */
  timestamp: string;
  /** Domain being queried */
  domain: string;
  /** DNS query type */
  queryType: DnsQueryType;
  /** Package name of app making the request (if available) */
  sourceApp: string | null;
  /** Source port of the request */
  sourcePort: number;
  /** DNS server IP */
  destinationIp: string;
  /** Whether this request was blocked */
  blocked: boolean;
}

export type DnsQueryType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'PTR' | 'OTHER';

export interface VpnStateChangeEvent {
  /** New VPN state */
  state: VpnState;
  /** ISO timestamp of state change */
  timestamp: string;
  /** Error message if state is 'error' */
  errorMessage?: string;
}

export type VpnState = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface ConnectionEvent {
  /** ISO timestamp */
  timestamp: string;
  /** Protocol used */
  protocol: 'TCP' | 'UDP';
  /** Source IP address */
  sourceIp: string;
  /** Source port */
  sourcePort: number;
  /** Destination IP address */
  destIp: string;
  /** Destination port */
  destPort: number;
  /** Package name of source app (if available) */
  sourceApp: string | null;
  /** Bytes received */
  bytesIn: number;
  /** Bytes sent */
  bytesOut: number;
}

// ==================== Utility Types ====================

export interface VpnPluginConfig {
  /** Whether to enable detailed logging */
  debugMode?: boolean;
  /** DNS servers to use (default: 8.8.8.8, 8.8.4.4) */
  dnsServers?: string[];
  /** Whether to block malicious domains automatically */
  autoBlock?: boolean;
  /** List of domains to always allow */
  whitelist?: string[];
}
