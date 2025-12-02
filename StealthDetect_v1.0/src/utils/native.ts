/**
 * Native platform utilities for Capacitor
 * Handles iOS/Android native features with web fallbacks
 * 
 * IMPORTANT: This file is designed to work in BOTH environments:
 * - Figma Make Preview (browser) - all functionality is mocked
 * - iOS Native Build - real Capacitor features activate
 * 
 * The imports are constructed dynamically to prevent the browser bundler
 * from trying to resolve Capacitor packages that don't exist in preview.
 */

// Detect if we're in a browser environment (Figma Make preview)
const isBrowserEnvironment = typeof window !== 'undefined' && !('Capacitor' in window);

// Dynamic import helper that constructs package names at runtime
// This prevents the bundler from trying to resolve packages during build
const dynamicImport = async (pkgPath: string) => {
  if (isBrowserEnvironment) {
    throw new Error('Native features not available in preview');
  }
  // Construct the path at runtime to avoid static analysis
  const parts = pkgPath.split('/');
  const fullPath = parts.join('/');
  return await import(/* @vite-ignore */ /* webpackIgnore: true */ fullPath);
};

// Platform detection - no imports needed
export const isNative = () => {
  if (isBrowserEnvironment) return false;
  try {
    // @ts-ignore - Capacitor is injected by native build
    return window.Capacitor?.isNativePlatform() ?? false;
  } catch {
    return false;
  }
};

export const isIOS = () => {
  if (isBrowserEnvironment) return false;
  try {
    // @ts-ignore
    return window.Capacitor?.getPlatform() === 'ios';
  } catch {
    return false;
  }
};

export const isAndroid = () => {
  if (isBrowserEnvironment) return false;
  try {
    // @ts-ignore
    return window.Capacitor?.getPlatform() === 'android';
  } catch {
    return false;
  }
};

export const isWeb = () => {
  if (isBrowserEnvironment) return true;
  try {
    // @ts-ignore
    return window.Capacitor?.getPlatform() === 'web' ?? true;
  } catch {
    return true;
  }
};

// Secure Storage
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isBrowserEnvironment || !isNative()) {
      localStorage.setItem(key, value);
      return;
    }

    try {
      const pkg = '@capacitor' + '/' + 'preferences';
      const { Preferences } = await dynamicImport(pkg);
      await Preferences.set({ key, value });
    } catch {
      localStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (isBrowserEnvironment || !isNative()) {
      return localStorage.getItem(key);
    }

    try {
      const pkg = '@capacitor' + '/' + 'preferences';
      const { Preferences } = await dynamicImport(pkg);
      const { value } = await Preferences.get({ key });
      return value;
    } catch {
      return localStorage.getItem(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isBrowserEnvironment || !isNative()) {
      localStorage.removeItem(key);
      return;
    }

    try {
      const pkg = '@capacitor' + '/' + 'preferences';
      const { Preferences } = await dynamicImport(pkg);
      await Preferences.remove({ key });
    } catch {
      localStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    if (isBrowserEnvironment || !isNative()) {
      localStorage.clear();
      return;
    }

    try {
      const pkg = '@capacitor' + '/' + 'preferences';
      const { Preferences } = await dynamicImport(pkg);
      await Preferences.clear();
    } catch {
      localStorage.clear();
    }
  },
};

// Biometric authentication removed - using PIN-only authentication

// App State & Lifecycle
export const appState = {
  async addListener(callback: (state: 'active' | 'inactive' | 'background') => void): Promise<void> {
    if (isBrowserEnvironment || !isNative()) return;

    try {
      const pkg = '@capacitor' + '/' + 'app';
      const { App } = await dynamicImport(pkg);
      App.addListener('appStateChange', ({ isActive }) => {
        callback(isActive ? 'active' : 'background');
      });
    } catch {
      // Silently fail
    }
  },

  async removeAllListeners(): Promise<void> {
    if (isBrowserEnvironment || !isNative()) return;

    try {
      const pkg = '@capacitor' + '/' + 'app';
      const { App } = await dynamicImport(pkg);
      await App.removeAllListeners();
    } catch {
      // Silently fail
    }
  },
};

// Haptic Feedback
export const haptics = {
  async impact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    // Web vibration fallback
    if (isBrowserEnvironment || !isNative()) {
      if ('vibrate' in navigator) {
        const durations = { light: 10, medium: 20, heavy: 40 };
        navigator.vibrate(durations[style]);
      }
      return;
    }

    try {
      const pkg = '@capacitor' + '/' + 'haptics';
      const { Haptics, ImpactStyle } = await dynamicImport(pkg);
      const styles = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styles[style] });
    } catch {
      // Fallback to web vibration
      if ('vibrate' in navigator) {
        const durations = { light: 10, medium: 20, heavy: 40 };
        navigator.vibrate(durations[style]);
      }
    }
  },

  async notification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    // Web vibration fallback
    if (isBrowserEnvironment || !isNative()) {
      if ('vibrate' in navigator) {
        const patterns = {
          success: [50, 50, 50],
          warning: [100, 50, 100],
          error: [100, 50, 100, 50, 100],
        };
        navigator.vibrate(patterns[type]);
      }
      return;
    }

    try {
      const pkg = '@capacitor' + '/' + 'haptics';
      const { Haptics, NotificationType } = await dynamicImport(pkg);
      const types = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: types[type] });
    } catch {
      // Fallback to web vibration
      if ('vibrate' in navigator) {
        const patterns = {
          success: [50, 50, 50],
          warning: [100, 50, 100],
          error: [100, 50, 100, 50, 100],
        };
        navigator.vibrate(patterns[type]);
      }
    }
  },
};

// Status Bar
export const statusBar = {
  async setStyle(style: 'light' | 'dark'): Promise<void> {
    if (isBrowserEnvironment || !isNative()) return;

    try {
      const pkg = '@capacitor' + '/' + 'status-bar';
      const { StatusBar, Style } = await dynamicImport(pkg);
      await StatusBar.setStyle({ 
        style: style === 'light' ? Style.Light : Style.Dark 
      });
    } catch {
      // Silently fail
    }
  },

  async hide(): Promise<void> {
    if (isBrowserEnvironment || !isNative()) return;

    try {
      const pkg = '@capacitor' + '/' + 'status-bar';
      const { StatusBar } = await dynamicImport(pkg);
      await StatusBar.hide();
    } catch {
      // Silently fail
    }
  },

  async show(): Promise<void> {
    if (isBrowserEnvironment || !isNative()) return;

    try {
      const pkg = '@capacitor' + '/' + 'status-bar';
      const { StatusBar } = await dynamicImport(pkg);
      await StatusBar.show();
    } catch {
      // Silently fail
    }
  },
};

// Splash Screen
export const splashScreen = {
  async hide(): Promise<void> {
    if (isBrowserEnvironment || !isNative()) return;

    try {
      const pkg = '@capacitor' + '/' + 'splash-screen';
      const { SplashScreen } = await dynamicImport(pkg);
      await SplashScreen.hide();
    } catch {
      // Silently fail
    }
  },
};

// Share functionality
export const share = {
  async share(options: { title?: string; text?: string; url?: string; dialogTitle?: string }): Promise<boolean> {
    // Try Web Share API (works in browser and native)
    if (isBrowserEnvironment || !isNative()) {
      if (navigator.share) {
        try {
          await navigator.share(options);
          return true;
        } catch {
          return false;
        }
      }
      console.log('📤 [Preview] Native share sheet would appear in iOS build');
      return false;
    }

    try {
      const pkg = '@capacitor' + '/' + 'share';
      const { Share } = await dynamicImport(pkg);
      await Share.share(options);
      return true;
    } catch {
      // Try web share API as fallback
      if (navigator.share) {
        try {
          await navigator.share(options);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  },
};

export default {
  isNative,
  isIOS,
  isAndroid,
  isWeb,
  secureStorage,
  appState,
  haptics,
  statusBar,
  splashScreen,
  share,
};
