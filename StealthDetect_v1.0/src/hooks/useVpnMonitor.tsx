/**
 * useVpnMonitor Hook
 * Connects native VPN DNS events to React components
 * Provides real-time network monitoring and threat detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VpnService } from '../capacitor-plugins/vpn-service/implementation';
import type {
  VpnStatus,
  DnsRequestEvent,
  VpnStateChangeEvent,
  ConnectionEvent,
} from '../capacitor-plugins/vpn-service/definitions';
import { iocIngestService } from '../utils/ioc-ingest';
import { isKnownMaliciousDomainWeb } from '../utils/ioc-auto-loader';
import { isNative } from '../utils/native';

// ==================== Types ====================

export interface DnsEvent extends DnsRequestEvent {
  id: string;
  isThreat: boolean;
  threatInfo?: {
    appName: string;
    category: string;
    severity: string;
    description: string;
  };
}

export interface NetworkStats {
  totalConnections: number;
  suspiciousConnections: number;
  dnsQueriesTotal: number;
  threatsDetected: number;
  bytesIn: number;
  bytesOut: number;
}

export interface VpnMonitorState {
  // VPN Status
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  startTime: string | null;

  // Network Data
  recentDnsEvents: DnsEvent[];
  threats: DnsEvent[];
  stats: NetworkStats;

  // Status info
  packetsProcessed: number;
  dnsQueriesIntercepted: number;
}

// ==================== Constants ====================

const MAX_EVENTS = 100; // Keep last 100 events in memory
const MAX_THREATS = 50; // Keep last 50 threats

// ==================== Hook ====================

export function useVpnMonitor() {
  const [state, setState] = useState<VpnMonitorState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    startTime: null,
    recentDnsEvents: [],
    threats: [],
    stats: {
      totalConnections: 0,
      suspiciousConnections: 0,
      dnsQueriesTotal: 0,
      threatsDetected: 0,
      bytesIn: 0,
      bytesOut: 0,
    },
    packetsProcessed: 0,
    dnsQueriesIntercepted: 0,
  });

  const listenersRef = useRef<{ remove: () => Promise<void> }[]>([]);
  const eventIdCounter = useRef(0);

  /**
   * Check if a domain is a known threat
   */
  const checkDomainThreat = useCallback(
    async (domain: string): Promise<DnsEvent['threatInfo'] | null> => {
      try {
        // On native, use iocIngestService directly (bypasses db.useSQLite flag issues)
        if (isNative()) {
          console.log('[VpnMonitor] Checking domain in SQLite:', domain);
          const match = await iocIngestService.findNetworkIndicator(domain);
          console.log('[VpnMonitor] SQLite match result:', match);
          if (match) {
            return {
              appName: match.appName || 'Unknown',
              category: match.category,
              severity: match.severity,
              description: match.description,
            };
          }
        } else {
          // On web, use cached IOC data
          if (isKnownMaliciousDomainWeb(domain)) {
            return {
              appName: 'Unknown',
              category: 'stalkerware',
              severity: 'high',
              description: 'Known malicious domain',
            };
          }
        }
        return null;
      } catch (error) {
        console.error('[VpnMonitor] Error checking domain threat:', error);
        return null;
      }
    },
    []
  );

  /**
   * Handle DNS request event from VPN
   */
  const handleDnsRequest = useCallback(
    async (event: DnsRequestEvent) => {
      console.log('[VpnMonitor] 📥 DNS event received:', event.domain);
      const id = `dns_${++eventIdCounter.current}_${Date.now()}`;

      // Check if domain is a known threat
      const threatInfo = await checkDomainThreat(event.domain);
      console.log('[VpnMonitor] Threat check result:', event.domain, threatInfo ? '🚨 THREAT' : '✅ Safe');
      const isThreat = threatInfo !== null;

      const dnsEvent: DnsEvent = {
        ...event,
        id,
        isThreat,
        threatInfo: threatInfo || undefined,
      };

      setState((prev) => {
        const newDnsEvents = [dnsEvent, ...prev.recentDnsEvents].slice(0, MAX_EVENTS);
        const newThreats = isThreat
          ? [dnsEvent, ...prev.threats].slice(0, MAX_THREATS)
          : prev.threats;

        return {
          ...prev,
          recentDnsEvents: newDnsEvents,
          threats: newThreats,
          stats: {
            ...prev.stats,
            dnsQueriesTotal: prev.stats.dnsQueriesTotal + 1,
            threatsDetected: isThreat
              ? prev.stats.threatsDetected + 1
              : prev.stats.threatsDetected,
            suspiciousConnections: isThreat
              ? prev.stats.suspiciousConnections + 1
              : prev.stats.suspiciousConnections,
          },
          dnsQueriesIntercepted: prev.dnsQueriesIntercepted + 1,
        };
      });

      if (isThreat) {
        console.log(
          `[VpnMonitor] THREAT DETECTED: ${event.domain}`,
          threatInfo
        );
      }
    },
    [checkDomainThreat]
  );

  /**
   * Handle VPN state change event
   */
  const handleStateChange = useCallback((event: VpnStateChangeEvent) => {
    console.log('[VpnMonitor] State change:', event.state);

    setState((prev) => ({
      ...prev,
      isConnected: event.state === 'connected',
      isConnecting: event.state === 'connecting',
      error: event.state === 'error' ? 'VPN connection error' : null,
      startTime: event.state === 'connected' ? event.timestamp : prev.startTime,
    }));
  }, []);

  /**
   * Handle connection event
   */
  const handleConnectionEvent = useCallback((event: ConnectionEvent) => {
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalConnections: prev.stats.totalConnections + 1,
        bytesIn: prev.stats.bytesIn + (event.bytesIn || 0),
        bytesOut: prev.stats.bytesOut + (event.bytesOut || 0),
      },
      packetsProcessed: prev.packetsProcessed + 1,
    }));
  }, []);

  /**
   * Start VPN monitoring
   */
  const startVpn = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      // Check permission first
      const permResult = await VpnService.checkPermission();
      if (!permResult.granted) {
        const reqResult = await VpnService.requestPermission();
        if (!reqResult.granted) {
          setState((prev) => ({
            ...prev,
            isConnecting: false,
            error: 'VPN permission denied',
          }));
          return false;
        }
      }

      // Start VPN
      const result = await VpnService.startVpn();

      if (result.success) {
        // Set up event listeners
        const dnsListener = await VpnService.addListener(
          'dnsRequest',
          handleDnsRequest
        );
        const stateListener = await VpnService.addListener(
          'vpnStateChange',
          handleStateChange
        );
        const connListener = await VpnService.addListener(
          'connectionEvent',
          handleConnectionEvent
        );

        listenersRef.current = [dnsListener, stateListener, connListener];

        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          startTime: new Date().toISOString(),
        }));

        console.log('[VpnMonitor] VPN started and listeners attached');
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: 'Failed to start VPN',
        }));
        return false;
      }
    } catch (error) {
      console.error('[VpnMonitor] Error starting VPN:', error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: `VPN error: ${error}`,
      }));
      return false;
    }
  }, [handleDnsRequest, handleStateChange, handleConnectionEvent]);

  /**
   * Stop VPN monitoring
   */
  const stopVpn = useCallback(async (): Promise<boolean> => {
    try {
      // Remove listeners
      for (const listener of listenersRef.current) {
        await listener.remove();
      }
      listenersRef.current = [];

      // Stop VPN
      const result = await VpnService.stopVpn();

      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));

      console.log('[VpnMonitor] VPN stopped');
      return result.success;
    } catch (error) {
      console.error('[VpnMonitor] Error stopping VPN:', error);
      return false;
    }
  }, []);

  /**
   * Refresh VPN status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const status = await VpnService.getVpnStatus();
      setState((prev) => ({
        ...prev,
        isConnected: status.connected,
        startTime: status.startTime,
        packetsProcessed: status.packetsProcessed,
        dnsQueriesIntercepted: status.dnsQueriesIntercepted,
      }));
    } catch (error) {
      console.error('[VpnMonitor] Error refreshing status:', error);
    }
  }, []);

  /**
   * Clear all events and stats
   */
  const clearData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      recentDnsEvents: [],
      threats: [],
      stats: {
        totalConnections: 0,
        suspiciousConnections: 0,
        dnsQueriesTotal: 0,
        threatsDetected: 0,
        bytesIn: 0,
        bytesOut: 0,
      },
    }));
  }, []);

  /**
   * Toggle VPN on/off
   */
  const toggleVpn = useCallback(async (): Promise<boolean> => {
    if (state.isConnected) {
      return await stopVpn();
    } else {
      return await startVpn();
    }
  }, [state.isConnected, startVpn, stopVpn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove listeners on cleanup
      listenersRef.current.forEach((listener) => {
        listener.remove().catch(console.error);
      });
    };
  }, []);

  // Initial status check
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    // State
    ...state,

    // Actions
    startVpn,
    stopVpn,
    toggleVpn,
    refreshStatus,
    clearData,

    // Computed
    isUsingNative: VpnService.isUsingNative(),
  };
}

// ==================== Context (Optional) ====================

import { createContext, useContext, type ReactNode } from 'react';

const VpnMonitorContext = createContext<ReturnType<typeof useVpnMonitor> | null>(
  null
);

export function VpnMonitorProvider({ children }: { children: ReactNode }) {
  const vpnMonitor = useVpnMonitor();
  return (
    <VpnMonitorContext.Provider value={vpnMonitor}>
      {children}
    </VpnMonitorContext.Provider>
  );
}

export function useVpnMonitorContext() {
  const context = useContext(VpnMonitorContext);
  if (!context) {
    throw new Error(
      'useVpnMonitorContext must be used within VpnMonitorProvider'
    );
  }
  return context;
}
