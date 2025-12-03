/**
 * SpyGuard Integration
 * Based on https://github.com/SpyGuard/SpyGuard
 * Detects stalkerware, spyware, and monitoring apps
 */

import { db, type PackageIoC } from './database';
import { createStalkerwareSignature, type StalkerwareSignature } from './crypto';

// ==================== SpyGuard Stalkerware Database ====================

/**
 * Known stalkerware packages from SpyGuard project
 * Source: https://github.com/SpyGuard/SpyGuard/tree/main/stalkerware
 */
export const SPYGUARD_STALKERWARE_DB = {
  // Commercial Stalkerware
  commercial: [
    'com.mspy.android',
    'com.flexispy',
    'com.mobile_spy',
    'com.spybubble',
    'com.highster',
    'com.phonesheriff',
    'com.teensafe',
    'com.mobistealth',
    'com.spyera',
    'com.theconcernedparent',
    'com.ikeymonitor',
    'com.spyfone',
    'com.thetruthspy',
    'com.xnspy',
    'com.ddihf',
    'com.spy_phone_app',
    'com.copy9',
    'com.spyzie',
    'com.cocospy',
    'com.spyic',
    'com.hoverwatch',
    'com.spyine',
    'net.spytracker',
  ],

  // Parental Control (sometimes abused as stalkerware)
  parental: [
    'com.qustodio',
    'com.netsanity',
    'com.mmguardian',
    'com.famisafe',
    'com.bark',
    'com.ourpact',
    'com.mobicip',
    'net.kidsguard',
  ],

  // GPS Tracking Apps (can be stalkerware)
  tracking: [
    'com.life360',
    'com.familywhere',
    'com.gpstracker',
    'com.familylocator',
    'com.glympse',
    'com.findmyfriends',
  ],

  // Hidden/Disguised Apps (fake system apps used by stalkerware)
  // NOTE: Do NOT include real Android system packages here
  hidden: [
    'com.system.service.fake',      // Fake system service
    'com.android.update.malware',   // Fake update (not real android update)
    'com.google.service.spyware',   // Fake Google service
    'com.android.systemservice',    // Note: different from real systemui
  ],
};

/**
 * Suspicious permission combinations that indicate stalkerware
 */
export const STALKERWARE_PERMISSION_PATTERNS = [
  // Classic stalkerware pattern
  ['READ_SMS', 'RECEIVE_SMS', 'READ_CALL_LOG', 'RECORD_AUDIO'],
  
  // Location + messaging tracking
  ['ACCESS_FINE_LOCATION', 'READ_SMS', 'READ_CONTACTS'],
  
  // Full surveillance
  ['CAMERA', 'RECORD_AUDIO', 'READ_CALL_LOG', 'READ_SMS'],
  
  // Hidden running + data collection
  ['SYSTEM_ALERT_WINDOW', 'READ_CALL_LOG', 'READ_SMS', 'ACCESS_FINE_LOCATION'],
  
  // Remote control capabilities
  ['RECEIVE_BOOT_COMPLETED', 'INTERNET', 'READ_SMS', 'RECEIVE_SMS'],
];

/**
 * Suspicious app names (disguised stalkerware)
 */
export const SUSPICIOUS_APP_NAMES = [
  'System Service',
  'System Update',
  'Android Update',
  'Google Service',
  'Wi-Fi Service',
  'Device Manager',
  'Security Update',
  'System Manager',
  'Process Manager',
  'Task Manager',
];

/**
 * Legitimate Android system packages that should NEVER be flagged as stalkerware
 * Even if they have suspicious permissions, these are real system apps
 */
export const ANDROID_SYSTEM_PACKAGES = [
  'com.android.systemui',
  'com.android.settings',
  'com.android.phone',
  'com.android.contacts',
  'com.android.mms',
  'com.android.providers.contacts',
  'com.android.providers.telephony',
  'com.android.providers.media',
  'com.android.providers.downloads',
  'com.android.documentsui',
  'com.android.launcher',
  'com.android.launcher3',
  'com.android.inputmethod',
  'com.android.camera',
  'com.android.camera2',
  'com.android.gallery3d',
  'com.android.bluetooth',
  'com.android.nfc',
  'com.android.shell',
  'com.android.packageinstaller',
  'com.android.vending',           // Google Play Store
  'com.google.android.gms',        // Google Play Services
  'com.google.android.gsf',        // Google Services Framework
  'com.google.android.apps.maps',
  'com.google.android.apps.photos',
  'com.google.android.apps.messaging',
  'com.google.android.dialer',
  'com.google.android.contacts',
  'com.google.android.calendar',
  'com.google.android.deskclock',
  'com.google.android.googlequicksearchbox',
  'com.samsung.android',           // Samsung system apps prefix
  'com.sec.android',               // Samsung system apps prefix
  'com.huawei.android',            // Huawei system apps prefix
  'com.xiaomi.android',            // Xiaomi system apps prefix
  'com.oppo.android',              // Oppo system apps prefix
  'com.vivo.android',              // Vivo system apps prefix
  'com.oneplus.android',           // OnePlus system apps prefix
];

// ==================== Stalkerware Detection Engine ====================

export interface DetectedStalkerware {
  packageName: string;
  appName?: string;
  version?: string;
  detectionReasons: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  permissions: string[];
  signature: StalkerwareSignature | null;
  recommended Action: string;
}

export class SpyGuardDetector {
  /**
   * Scan installed packages for stalkerware
   */
  async scanInstalledApps(
    installedApps: Array<{
      packageName: string;
      appName?: string;
      version?: string;
      permissions?: string[];
    }>
  ): Promise<DetectedStalkerware[]> {
    const detected: DetectedStalkerware[] = [];

    for (const app of installedApps) {
      const result = await this.analyzeApp(app);
      if (result) {
        detected.push(result);
      }
    }

    return detected;
  }

  /**
   * Check if package is a legitimate Android system app
   */
  private isSystemPackage(packageName: string): boolean {
    // Check exact matches
    if (ANDROID_SYSTEM_PACKAGES.includes(packageName)) {
      return true;
    }

    // Check prefix matches for manufacturer system apps
    const systemPrefixes = [
      'com.android.',
      'com.google.android.',
      'com.samsung.',
      'com.sec.',
      'com.huawei.',
      'com.xiaomi.',
      'com.oppo.',
      'com.vivo.',
      'com.oneplus.',
      'android.',
    ];

    return systemPrefixes.some(prefix => packageName.startsWith(prefix));
  }

  /**
   * Analyze a single app for stalkerware indicators
   */
  private async analyzeApp(app: {
    packageName: string;
    appName?: string;
    version?: string;
    permissions?: string[];
  }): Promise<DetectedStalkerware | null> {
    // Skip legitimate Android system packages - they're not stalkerware!
    if (this.isSystemPackage(app.packageName)) {
      return null;
    }

    const detectionReasons: string[] = [];
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

    // Check 1: Known stalkerware package name
    const isKnownStalkerware = this.checkKnownPackage(app.packageName);
    if (isKnownStalkerware) {
      detectionReasons.push(`Known stalkerware: ${isKnownStalkerware}`);
      severity = 'critical';
    }

    // Check 2: Suspicious app name
    if (app.appName && this.checkSuspiciousName(app.appName)) {
      detectionReasons.push(`Suspicious app name: "${app.appName}"`);
      if (severity === 'low') severity = 'medium';
    }

    // Check 3: Dangerous permission combinations
    if (app.permissions && app.permissions.length > 0) {
      const dangerousPerms = this.checkDangerousPermissions(app.permissions);
      if (dangerousPerms.length > 0) {
        detectionReasons.push(...dangerousPerms);
        if (severity === 'low') severity = 'high';
      }
    }

    // If any detection reasons, it's suspicious
    if (detectionReasons.length === 0) {
      return null;
    }

    // Generate hash signature (without storing actual app file)
    const signature = await createStalkerwareSignature(
      app.packageName,
      null, // We don't have app binary data, just package info
      {
        permissions: app.permissions,
        version: app.version,
      }
    );

    // Store in IoC database
    await this.addToIoCDatabase(app.packageName, detectionReasons, severity);

    return {
      packageName: app.packageName,
      appName: app.appName,
      version: app.version,
      detectionReasons,
      severity,
      permissions: app.permissions || [],
      signature,
      recommendedAction: this.getRecommendedAction(severity),
    };
  }

  /**
   * Check if package is in SpyGuard database
   */
  private checkKnownPackage(packageName: string): string | null {
    // Check commercial stalkerware
    if (SPYGUARD_STALKERWARE_DB.commercial.includes(packageName)) {
      return 'Commercial Stalkerware';
    }

    // Check parental control (can be misused)
    if (SPYGUARD_STALKERWARE_DB.parental.includes(packageName)) {
      return 'Parental Control App (potential stalkerware)';
    }

    // Check tracking apps
    if (SPYGUARD_STALKERWARE_DB.tracking.includes(packageName)) {
      return 'GPS Tracking App';
    }

    // Check hidden/disguised apps
    if (SPYGUARD_STALKERWARE_DB.hidden.includes(packageName)) {
      return 'Hidden/Disguised System App';
    }

    return null;
  }

  /**
   * Check for suspicious app names
   */
  private checkSuspiciousName(appName: string): boolean {
    return SUSPICIOUS_APP_NAMES.some(suspicious =>
      appName.toLowerCase().includes(suspicious.toLowerCase())
    );
  }

  /**
   * Check for dangerous permission combinations
   */
  private checkDangerousPermissions(permissions: string[]): string[] {
    const reasons: string[] = [];

    for (const pattern of STALKERWARE_PERMISSION_PATTERNS) {
      const hasAllPermissions = pattern.every(perm =>
        permissions.some(p => p.includes(perm))
      );

      if (hasAllPermissions) {
        reasons.push(`Dangerous permissions: ${pattern.join(', ')}`);
      }
    }

    // Additional individual dangerous permissions
    const criticalPerms = ['RECORD_AUDIO', 'CAMERA', 'READ_CALL_LOG', 'READ_SMS'];
    const hasCritical = permissions.filter(p =>
      criticalPerms.some(crit => p.includes(crit))
    );

    if (hasCritical.length >= 2) {
      reasons.push(`Multiple surveillance permissions: ${hasCritical.join(', ')}`);
    }

    return reasons;
  }

  /**
   * Add detected stalkerware to IoC database
   */
  private async addToIoCDatabase(
    packageName: string,
    reasons: string[],
    severity: 'critical' | 'high' | 'medium' | 'low'
  ): Promise<void> {
    // Check if already in database
    const existing = await db.findPackageIoC(packageName);
    if (existing) return;

    // Add to database
    await db.addPackageIoC({
      packageName,
      platform: 'both', // Assume cross-platform unless proven otherwise
      category: 'stalkerware',
      severity,
      description: `Detected via SpyGuard: ${reasons.join('; ')}`,
      source: 'SpyGuard Detection Engine',
      signatures: reasons,
    });
  }

  /**
   * Get recommended action based on severity
   */
  private getRecommendedAction(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'URGENT: Uninstall immediately. This is confirmed stalkerware.';
      case 'high':
        return 'Recommended: Uninstall this app. Strong stalkerware indicators.';
      case 'medium':
        return 'Caution: Review this app. Suspicious behavior detected.';
      case 'low':
        return 'Monitor: This app has some suspicious characteristics.';
      default:
        return 'Review this app for suspicious behavior.';
    }
  }

  /**
   * Load SpyGuard database into local IoC database
   */
  async loadSpyGuardDatabase(): Promise<void> {
    console.log('📡 Loading SpyGuard stalkerware database...');

    // Load commercial stalkerware
    for (const pkg of SPYGUARD_STALKERWARE_DB.commercial) {
      const existing = await db.findPackageIoC(pkg);
      if (!existing) {
        await db.addPackageIoC({
          packageName: pkg,
          platform: 'both',
          category: 'stalkerware',
          severity: 'critical',
          description: 'Known commercial stalkerware from SpyGuard database',
          source: 'SpyGuard',
        });
      }
    }

    // Load parental control apps
    for (const pkg of SPYGUARD_STALKERWARE_DB.parental) {
      const existing = await db.findPackageIoC(pkg);
      if (!existing) {
        await db.addPackageIoC({
          packageName: pkg,
          platform: 'both',
          category: 'tracking',
          severity: 'high',
          description: 'Parental control app that can be misused as stalkerware',
          source: 'SpyGuard',
        });
      }
    }

    console.log('✅ SpyGuard database loaded successfully');
  }

  /**
   * Get SpyGuard statistics
   */
  getSpyGuardStats(): {
    totalKnownStalkerware: number;
    byCategory: Record<string, number>;
  } {
    return {
      totalKnownStalkerware: 
        SPYGUARD_STALKERWARE_DB.commercial.length +
        SPYGUARD_STALKERWARE_DB.parental.length +
        SPYGUARD_STALKERWARE_DB.tracking.length +
        SPYGUARD_STALKERWARE_DB.hidden.length,
      byCategory: {
        commercial: SPYGUARD_STALKERWARE_DB.commercial.length,
        parental: SPYGUARD_STALKERWARE_DB.parental.length,
        tracking: SPYGUARD_STALKERWARE_DB.tracking.length,
        hidden: SPYGUARD_STALKERWARE_DB.hidden.length,
      },
    };
  }
}

// Export singleton instance
export const spyGuardDetector = new SpyGuardDetector();

// Auto-load SpyGuard database on module import
spyGuardDetector.loadSpyGuardDatabase().catch(console.error);
