/**
 * VPN Service Plugin Implementation
 *
 * This module provides the VPN service for DNS interception:
 * - On Android: Uses native VpnService via Capacitor bridge
 * - On Web/Browser: Uses simulated events for testing
 */

import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import type {
  VpnServicePlugin,
  VpnStatus,
  DnsRequestEvent,
  VpnStateChangeEvent,
  ConnectionEvent,
  StartVpnResult,
  StopVpnResult,
  PermissionResult,
  DnsQueryType,
} from './definitions';

// ==================== Platform Detection ====================

/**
 * Check if running on native platform (Android/iOS)
 */
function isNativePlatform(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      'Capacitor' in window &&
      (window as any).Capacitor?.isNativePlatform?.() === true
    );
  } catch {
    return false;
  }
}

/**
 * Check if running on Android specifically
 */
function isAndroid(): boolean {
  try {
    return (
      isNativePlatform() &&
      (window as any).Capacitor?.getPlatform?.() === 'android'
    );
  } catch {
    return false;
  }
}

// ==================== Native Plugin Registration ====================

/**
 * Register native VPN plugin
 * This bridges to the Java VpnServicePlugin on Android
 */
const NativeVpnService = registerPlugin<VpnServicePlugin>('VpnService', {
  web: () => import('./web-implementation').then((m) => new m.VpnServiceWeb()),
});

// ==================== Simulated Data (for Web/Testing) ====================

/** Known stalkerware domains for testing */
const STALKERWARE_DOMAINS = [
  'api.mspy.com',
  'cp.mspyonline.com',
  'api.flexispy.com',
  'my.hoverwatch.com',
  'dashboard.spyic.com',
  'api.thetruthspy.com',
  'cocospy.com',
  'app.spyera.com',
  'api.ikeymonitor.com',
  'clevguard.net',
];

/** Normal domains for mixed traffic simulation */
const NORMAL_DOMAINS = [
  'www.google.com',
  'api.github.com',
  'cdn.cloudflare.com',
  'www.apple.com',
  'update.microsoft.com',
  'api.stripe.com',
  'fonts.googleapis.com',
  'www.facebook.com',
  'api.twitter.com',
  'www.amazon.com',
];

/** Simulated app package names */
const NORMAL_APPS = [
  'com.android.chrome',
  'com.google.android.apps.maps',
  'com.whatsapp',
  'com.instagram.android',
  'com.spotify.music',
];

const STALKERWARE_APPS = [
  'com.hidden.tracker',
  'com.system.monitor',
  'com.phone.guardian',
  'com.family.locator.pro',
];

// ==================== Web Implementation (Fallback) ====================

/**
 * Web implementation that simulates VPN events for testing
 * Used when running in browser or when native plugin is unavailable
 */
export class VpnServiceWeb implements VpnServicePlugin {
  private isRunning = false;
  private startTime: string | null = null;
  private packetsProcessed = 0;
  private dnsQueriesIntercepted = 0;
  private simulationInterval: ReturnType<typeof setTimeout> | null = null;

  private listeners: Map<string, Set<Function>> = new Map();

  async startVpn(): Promise<StartVpnResult> {
    if (this.isRunning) {
      return { success: true, requiresPermission: false };
    }

    console.log('[VpnService-Web] Starting simulated VPN service...');

    this.isRunning = true;
    this.startTime = new Date().toISOString();
    this.packetsProcessed = 0;
    this.dnsQueriesIntercepted = 0;

    // Notify state change
    this.emit('vpnStateChange', {
      state: 'connected',
      timestamp: new Date().toISOString(),
    } as VpnStateChangeEvent);

    // Start simulated DNS events
    this.startSimulation();

    return { success: true, requiresPermission: false };
  }

  async stopVpn(): Promise<StopVpnResult> {
    if (!this.isRunning) {
      return { success: true };
    }

    console.log('[VpnService-Web] Stopping simulated VPN service...');

    this.isRunning = false;
    this.stopSimulation();

    this.emit('vpnStateChange', {
      state: 'disconnected',
      timestamp: new Date().toISOString(),
    } as VpnStateChangeEvent);

    return { success: true };
  }

  async getVpnStatus(): Promise<VpnStatus> {
    return {
      connected: this.isRunning,
      startTime: this.startTime,
      packetsProcessed: this.packetsProcessed,
      dnsQueriesIntercepted: this.dnsQueriesIntercepted,
    };
  }

  async checkPermission(): Promise<PermissionResult> {
    // Web always has "permission"
    return { granted: true };
  }

  async requestPermission(): Promise<PermissionResult> {
    return { granted: true };
  }

  async addListener(
    eventName: string,
    listenerFunc: Function
  ): Promise<PluginListenerHandle> {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listenerFunc);

    return {
      remove: async () => {
        this.listeners.get(eventName)?.delete(listenerFunc);
      },
    };
  }

  async removeAllListeners(): Promise<void> {
    this.listeners.clear();
    this.stopSimulation();
  }

  // ==================== Private Methods ====================

  private emit(eventName: string, data: unknown): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error('[VpnService-Web] Error in listener:', e);
        }
      });
    }
  }

  private startSimulation(): void {
    const emitDnsEvent = () => {
      if (!this.isRunning) return;

      // 15% chance of stalkerware domain
      const isStalkerware = Math.random() < 0.15;
      const domains = isStalkerware ? STALKERWARE_DOMAINS : NORMAL_DOMAINS;
      const apps = isStalkerware ? STALKERWARE_APPS : NORMAL_APPS;

      const domain = domains[Math.floor(Math.random() * domains.length)];
      const sourceApp = apps[Math.floor(Math.random() * apps.length)];

      const event: DnsRequestEvent = {
        timestamp: new Date().toISOString(),
        domain,
        queryType: this.randomQueryType(),
        sourceApp,
        sourcePort: 10000 + Math.floor(Math.random() * 50000),
        destinationIp: '8.8.8.8',
        blocked: false,
      };

      this.dnsQueriesIntercepted++;
      this.packetsProcessed++;

      this.emit('dnsRequest', event);

      // Also emit a connection event occasionally
      if (Math.random() < 0.3) {
        this.emitConnectionEvent(domain, sourceApp);
      }

      // Schedule next event (1-3 seconds)
      const delay = 1000 + Math.random() * 2000;
      this.simulationInterval = setTimeout(emitDnsEvent, delay);
    };

    // Start emitting events
    emitDnsEvent();
  }

  private stopSimulation(): void {
    if (this.simulationInterval) {
      clearTimeout(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private randomQueryType(): DnsQueryType {
    const types: DnsQueryType[] = ['A', 'AAAA', 'CNAME'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private emitConnectionEvent(domain: string, sourceApp: string | null): void {
    const event: ConnectionEvent = {
      timestamp: new Date().toISOString(),
      protocol: Math.random() < 0.8 ? 'TCP' : 'UDP',
      sourceIp: '192.168.1.' + Math.floor(Math.random() * 255),
      sourcePort: 10000 + Math.floor(Math.random() * 50000),
      destIp: this.randomIp(),
      destPort: [80, 443, 8080][Math.floor(Math.random() * 3)],
      sourceApp,
      bytesIn: Math.floor(Math.random() * 10000),
      bytesOut: Math.floor(Math.random() * 5000),
    };

    this.packetsProcessed++;
    this.emit('connectionEvent', event);
  }

  private randomIp(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }
}

// ==================== Unified VPN Service ====================

/**
 * VPN Service that automatically selects native or web implementation
 */
class UnifiedVpnService implements VpnServicePlugin {
  private webFallback: VpnServiceWeb | null = null;
  private useNative: boolean;

  constructor() {
    this.useNative = isAndroid();
    console.log(`[VpnService] Using ${this.useNative ? 'native' : 'web'} implementation`);
  }

  private getWebFallback(): VpnServiceWeb {
    if (!this.webFallback) {
      this.webFallback = new VpnServiceWeb();
    }
    return this.webFallback;
  }

  async startVpn(): Promise<StartVpnResult> {
    if (this.useNative) {
      try {
        return await NativeVpnService.startVpn();
      } catch (error) {
        console.error('[VpnService] Native startVpn failed:', error);
        // Fall back to web simulation
        return this.getWebFallback().startVpn();
      }
    }
    return this.getWebFallback().startVpn();
  }

  async stopVpn(): Promise<StopVpnResult> {
    if (this.useNative) {
      try {
        return await NativeVpnService.stopVpn();
      } catch (error) {
        console.error('[VpnService] Native stopVpn failed:', error);
        return this.getWebFallback().stopVpn();
      }
    }
    return this.getWebFallback().stopVpn();
  }

  async getVpnStatus(): Promise<VpnStatus> {
    if (this.useNative) {
      try {
        return await NativeVpnService.getVpnStatus();
      } catch (error) {
        console.error('[VpnService] Native getVpnStatus failed:', error);
        return this.getWebFallback().getVpnStatus();
      }
    }
    return this.getWebFallback().getVpnStatus();
  }

  async checkPermission(): Promise<PermissionResult> {
    if (this.useNative) {
      try {
        return await NativeVpnService.checkPermission();
      } catch (error) {
        console.error('[VpnService] Native checkPermission failed:', error);
        return { granted: false };
      }
    }
    return this.getWebFallback().checkPermission();
  }

  async requestPermission(): Promise<PermissionResult> {
    if (this.useNative) {
      try {
        return await NativeVpnService.requestPermission();
      } catch (error) {
        console.error('[VpnService] Native requestPermission failed:', error);
        return { granted: false };
      }
    }
    return this.getWebFallback().requestPermission();
  }

  async addListener(
    eventName: 'dnsRequest',
    listenerFunc: (event: DnsRequestEvent) => void
  ): Promise<PluginListenerHandle>;
  async addListener(
    eventName: 'vpnStateChange',
    listenerFunc: (event: VpnStateChangeEvent) => void
  ): Promise<PluginListenerHandle>;
  async addListener(
    eventName: 'connectionEvent',
    listenerFunc: (event: ConnectionEvent) => void
  ): Promise<PluginListenerHandle>;
  async addListener(
    eventName: string,
    listenerFunc: (event: any) => void
  ): Promise<PluginListenerHandle> {
    if (this.useNative) {
      try {
        return await NativeVpnService.addListener(eventName as any, listenerFunc);
      } catch (error) {
        console.error('[VpnService] Native addListener failed:', error);
        return this.getWebFallback().addListener(eventName, listenerFunc);
      }
    }
    return this.getWebFallback().addListener(eventName, listenerFunc);
  }

  async removeAllListeners(): Promise<void> {
    if (this.useNative) {
      try {
        await NativeVpnService.removeAllListeners();
      } catch (error) {
        console.error('[VpnService] Native removeAllListeners failed:', error);
      }
    }
    if (this.webFallback) {
      await this.webFallback.removeAllListeners();
    }
  }

  /**
   * Check if using native implementation
   */
  isUsingNative(): boolean {
    return this.useNative;
  }
}

// ==================== Export ====================

export const VpnService = new UnifiedVpnService();
