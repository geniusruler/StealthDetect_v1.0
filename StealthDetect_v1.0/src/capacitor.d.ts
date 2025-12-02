// Type declarations for Capacitor (used before packages are installed)
// This prevents TypeScript errors in development

declare module '@capacitor/cli' {
  export interface CapacitorConfig {
    appId: string;
    appName: string;
    webDir: string;
    server?: {
      androidScheme?: string;
    };
    ios?: {
      contentInset?: string;
      allowsLinkPreview?: boolean;
      scrollEnabled?: boolean;
    };
    plugins?: {
      [key: string]: any;
    };
  }
}

declare module '@capacitor/core' {
  export class Capacitor {
    static isNativePlatform(): boolean;
    static getPlatform(): 'ios' | 'android' | 'web';
  }
}

declare module '@capacitor/preferences' {
  export class Preferences {
    static set(options: { key: string; value: string }): Promise<void>;
    static get(options: { key: string }): Promise<{ value: string | null }>;
    static remove(options: { key: string }): Promise<void>;
    static clear(): Promise<void>;
  }
}

declare module '@capacitor/app' {
  export class App {
    static addListener(event: string, callback: any): Promise<any>;
    static removeAllListeners(): Promise<void>;
  }
}

declare module '@capacitor/splash-screen' {
  export class SplashScreen {
    static hide(): Promise<void>;
    static show(): Promise<void>;
  }
}

declare module '@capacitor/status-bar' {
  export enum Style {
    Light = 'LIGHT',
    Dark = 'DARK',
  }
  export class StatusBar {
    static setStyle(options: { style: Style }): Promise<void>;
    static hide(): Promise<void>;
    static show(): Promise<void>;
  }
}

declare module '@capacitor/haptics' {
  export enum ImpactStyle {
    Light = 'LIGHT',
    Medium = 'MEDIUM',
    Heavy = 'HEAVY',
  }
  export enum NotificationType {
    Success = 'SUCCESS',
    Warning = 'WARNING',
    Error = 'ERROR',
  }
  export class Haptics {
    static impact(options: { style: ImpactStyle }): Promise<void>;
    static notification(options: { type: NotificationType }): Promise<void>;
  }
}

declare module '@capacitor/share' {
  export class Share {
    static share(options: {
      title?: string;
      text?: string;
      url?: string;
      dialogTitle?: string;
    }): Promise<void>;
  }
}

declare module '@capacitor/keyboard' {
  // Keyboard types would go here if needed
}

// Biometric authentication removed - using PIN-only authentication
