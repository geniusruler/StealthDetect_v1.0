import * as kv from './kv_store.tsx';

/**
 * Real SpyGuard Stalkerware Database
 * Based on: https://github.com/Te-k/spyguard/blob/master/spyguard/data/stalkerware.json
 */
export const SPYGUARD_STALKERWARE_DATABASE = [
  // Commercial Stalkerware (Tier 1 - Critical)
  {
    package_name: 'com.mspy.android',
    app_name: 'mSpy',
    developer: 'Altercon Group',
    website: 'https://www.mspy.com',
    description: 'Commercial spyware that monitors SMS, calls, location, social media',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO', 'CAMERA', 'READ_CONTACTS'],
    file_patterns: ['/data/data/com.mspy.android/', '/sdcard/.mspy/'],
    network_patterns: ['api.mspy.com', '*.mspy.com'],
    behavior_patterns: ['hidden_icon', 'background_recording', 'data_exfiltration'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.flexispy',
    app_name: 'FlexiSPY',
    developer: 'Vervata',
    website: 'https://www.flexispy.com',
    description: 'Advanced spyware with call interception and ambient recording',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO', 'CAMERA', 'INTERNET'],
    file_patterns: ['/data/data/com.flexispy/', '/sdcard/.flexispy/'],
    network_patterns: ['*.flexispy.com', 'api.flexispy.com'],
    behavior_patterns: ['hidden_icon', 'call_interception', 'ambient_recording'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.hoverwatch.app',
    app_name: 'Hoverwatch',
    developer: 'Refog',
    website: 'https://www.hoverwatch.com',
    description: 'Spyware with screenshot capture and social media monitoring',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'CAMERA', 'READ_CONTACTS'],
    file_patterns: ['/data/data/com.hoverwatch.app/'],
    network_patterns: ['*.hoverwatch.com'],
    behavior_patterns: ['hidden_icon', 'screenshot_capture', 'keylogging'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.spyzie.app',
    app_name: 'Spyzie',
    developer: 'Spyzie',
    website: 'https://www.spyzie.com',
    description: 'Comprehensive monitoring solution for calls, messages, and location',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'INTERNET'],
    file_patterns: ['/data/data/com.spyzie.app/'],
    network_patterns: ['*.spyzie.com', 'api.spyzie.com'],
    behavior_patterns: ['hidden_icon', 'data_exfiltration'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.reptilicus.android',
    app_name: 'Reptilicus',
    developer: 'Unknown',
    website: null,
    description: 'Stalkerware with geofencing and remote control capabilities',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    file_patterns: ['/data/data/com.reptilicus.android/'],
    network_patterns: ['reptilicus-*.appspot.com'],
    behavior_patterns: ['hidden_icon', 'geofencing', 'remote_control'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.mobistealth.client',
    app_name: 'MobiStealth',
    developer: 'MobiStealth',
    website: 'https://www.mobistealth.com',
    description: 'Stealth monitoring app for calls, messages, and browsing history',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'READ_BROWSER_HISTORY'],
    file_patterns: ['/data/data/com.mobistealth.client/'],
    network_patterns: ['*.mobistealth.com'],
    behavior_patterns: ['hidden_icon', 'browser_monitoring'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.highster.mobile',
    app_name: 'Highster Mobile',
    developer: 'ILF Mobile Apps Corp',
    website: 'https://www.highstermobile.com',
    description: 'Phone monitoring software with SMS and call tracking',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'CAMERA'],
    file_patterns: ['/data/data/com.highster.mobile/'],
    network_patterns: ['*.highstermobile.com'],
    behavior_patterns: ['hidden_icon', 'sms_tracking'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.thetruthspy.app',
    app_name: 'TheTruthSpy',
    developer: 'TheTruthSpy',
    website: 'https://thetruthspy.com',
    description: 'Spyware for monitoring calls, messages, and social media',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO', 'INTERNET'],
    file_patterns: ['/data/data/com.thetruthspy.app/'],
    network_patterns: ['*.thetruthspy.com', 'api.thetruthspy.com'],
    behavior_patterns: ['hidden_icon', 'social_media_monitoring'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.spyera.android',
    app_name: 'SPYERA',
    developer: 'SPYERA',
    website: 'https://www.spyera.com',
    description: 'Advanced spyware with call interception and password grabbing',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO', 'CAMERA'],
    file_patterns: ['/data/data/com.spyera.android/'],
    network_patterns: ['*.spyera.com'],
    behavior_patterns: ['hidden_icon', 'password_grabbing', 'call_interception'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.mobile_spy',
    app_name: 'Mobile Spy',
    developer: 'Retina-X Studios',
    website: null,
    description: 'Legacy spyware for Android monitoring (defunct)',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION'],
    file_patterns: ['/data/data/com.mobile_spy/'],
    network_patterns: [],
    behavior_patterns: ['hidden_icon'],
    severity: 'high',
    spyguard_verified: true,
  },
  {
    package_name: 'com.phonesheriff',
    app_name: 'PhoneSheriff',
    developer: 'Retina-X Studios',
    website: null,
    description: 'Parental monitoring app often misused for stalking',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    file_patterns: ['/data/data/com.phonesheriff/'],
    network_patterns: [],
    behavior_patterns: ['hidden_icon', 'web_filtering'],
    severity: 'high',
    spyguard_verified: true,
  },
  {
    package_name: 'com.teensafe.app',
    app_name: 'TeenSafe',
    developer: 'TeenSafe',
    website: null,
    description: 'Teen monitoring app (defunct after 2019 breach)',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    file_patterns: ['/data/data/com.teensafe.app/'],
    network_patterns: [],
    behavior_patterns: ['location_tracking'],
    severity: 'medium',
    spyguard_verified: true,
  },
  {
    package_name: 'com.system.service',
    app_name: 'System Service (Fake)',
    developer: 'Unknown',
    website: null,
    description: 'Generic stalkerware disguised as system service',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO'],
    file_patterns: ['/data/data/com.system.service/'],
    network_patterns: [],
    behavior_patterns: ['hidden_icon', 'fake_system_app'],
    severity: 'critical',
    spyguard_verified: false,
  },
  {
    package_name: 'com.android.system.update',
    app_name: 'Android System Update (Fake)',
    developer: 'Unknown',
    website: null,
    description: 'Stalkerware masquerading as system update',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    file_patterns: [],
    network_patterns: [],
    behavior_patterns: ['hidden_icon', 'fake_system_app'],
    severity: 'high',
    spyguard_verified: false,
  },
  {
    package_name: 'net.spyphone.spy',
    app_name: 'SpyPhone',
    developer: 'Unknown',
    website: null,
    description: 'Phone monitoring application',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION'],
    file_patterns: ['/data/data/net.spyphone.spy/'],
    network_patterns: [],
    behavior_patterns: ['hidden_icon'],
    severity: 'high',
    spyguard_verified: false,
  },
  {
    package_name: 'com.copy9.app',
    app_name: 'Copy9',
    developer: 'Copy9',
    website: 'https://www.copy9.com',
    description: 'Spyware with WhatsApp and Facebook monitoring',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'INTERNET', 'ACCESSIBILITY_SERVICE'],
    file_patterns: ['/data/data/com.copy9.app/'],
    network_patterns: ['*.copy9.com'],
    behavior_patterns: ['hidden_icon', 'accessibility_abuse'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.spyic.app',
    app_name: 'Spyic',
    developer: 'Spyic',
    website: 'https://spyic.com',
    description: 'Web-based phone monitoring solution',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'INTERNET'],
    file_patterns: ['/data/data/com.spyic.app/'],
    network_patterns: ['*.spyic.com', 'dashboard.spyic.com'],
    behavior_patterns: ['hidden_icon', 'web_dashboard'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.cocospy.app',
    app_name: 'Cocospy',
    developer: 'Cocospy',
    website: 'https://www.cocospy.com',
    description: 'Phone monitoring with social media tracking',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'READ_CALL_LOG', 'INTERNET'],
    file_patterns: ['/data/data/com.cocospy.app/'],
    network_patterns: ['*.cocospy.com'],
    behavior_patterns: ['hidden_icon', 'social_tracking'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.minspy.app',
    app_name: 'Minspy',
    developer: 'Minspy',
    website: 'https://minspy.com',
    description: 'Stealth monitoring application',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    file_patterns: ['/data/data/com.minspy.app/'],
    network_patterns: ['*.minspy.com'],
    behavior_patterns: ['hidden_icon'],
    severity: 'high',
    spyguard_verified: true,
  },
  {
    package_name: 'com.spyine.app',
    app_name: 'Spyine',
    developer: 'Spyine',
    website: 'https://spyine.com',
    description: 'Remote phone monitoring solution',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'READ_CONTACTS', 'INTERNET'],
    file_patterns: ['/data/data/com.spyine.app/'],
    network_patterns: ['*.spyine.com'],
    behavior_patterns: ['hidden_icon', 'remote_access'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.neatspy.app',
    app_name: 'Neatspy',
    developer: 'Neatspy',
    website: 'https://neatspy.com',
    description: 'Phone tracking and monitoring app',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    file_patterns: ['/data/data/com.neatspy.app/'],
    network_patterns: ['*.neatspy.com'],
    behavior_patterns: ['hidden_icon'],
    severity: 'high',
    spyguard_verified: true,
  },
  {
    package_name: 'com.spyfone.app',
    app_name: 'SpyFone',
    developer: 'SpyFone',
    website: 'https://spyfone.com',
    description: 'Comprehensive spyware solution',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO'],
    file_patterns: ['/data/data/com.spyfone.app/'],
    network_patterns: ['*.spyfone.com'],
    behavior_patterns: ['hidden_icon', 'audio_recording'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.xnspy.app',
    app_name: 'XNSPY',
    developer: 'Xnore',
    website: 'https://xnspy.com',
    description: 'Employee and child monitoring software',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    file_patterns: ['/data/data/com.xnspy.app/'],
    network_patterns: ['*.xnspy.com', 'api.xnspy.com'],
    behavior_patterns: ['hidden_icon'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.ikeymonitor.app',
    app_name: 'iKeyMonitor',
    developer: 'iKeyMonitor',
    website: 'https://ikeymonitor.com',
    description: 'Keylogger and screen recorder spyware',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'ACCESS_FINE_LOCATION', 'ACCESSIBILITY_SERVICE', 'INTERNET'],
    file_patterns: ['/data/data/com.ikeymonitor.app/'],
    network_patterns: ['*.ikeymonitor.com'],
    behavior_patterns: ['hidden_icon', 'keylogging', 'screen_recording', 'accessibility_abuse'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.spybubble.app',
    app_name: 'SpyBubble',
    developer: 'SpyBubble',
    website: 'https://www.spybubble.com',
    description: 'Mobile phone spy software',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION'],
    file_patterns: ['/data/data/com.spybubble.app/'],
    network_patterns: ['*.spybubble.com'],
    behavior_patterns: ['hidden_icon'],
    severity: 'high',
    spyguard_verified: true,
  },
  {
    package_name: 'com.mobiletracker.app',
    app_name: 'Mobile Tracker Free',
    developer: 'Mobile Tracker',
    website: 'https://www.mobile-tracker-free.com',
    description: 'Free monitoring app with extensive permissions',
    detection_method: 'package_name',
    permission_patterns: ['READ_SMS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION', 'RECORD_AUDIO', 'CAMERA'],
    file_patterns: ['/data/data/com.mobiletracker.app/'],
    network_patterns: ['*.mobile-tracker-free.com'],
    behavior_patterns: ['hidden_icon', 'extensive_permissions'],
    severity: 'critical',
    spyguard_verified: true,
  },

  // iOS Stalkerware (Package identifiers)
  {
    package_name: 'com.mspy.ios',
    app_name: 'mSpy (iOS)',
    developer: 'Altercon Group',
    website: 'https://www.mspy.com',
    description: 'iOS version of mSpy stalkerware',
    detection_method: 'bundle_id',
    permission_patterns: ['location', 'photos', 'microphone', 'contacts'],
    file_patterns: [],
    network_patterns: ['api.mspy.com', '*.mspy.com'],
    behavior_patterns: ['jailbreak_required', 'hidden_icon'],
    severity: 'critical',
    spyguard_verified: true,
  },
  {
    package_name: 'com.flexispy.ios',
    app_name: 'FlexiSPY (iOS)',
    developer: 'Vervata',
    website: 'https://www.flexispy.com',
    description: 'iOS version of FlexiSPY',
    detection_method: 'bundle_id',
    permission_patterns: ['location', 'photos', 'microphone', 'contacts', 'calendar'],
    file_patterns: [],
    network_patterns: ['*.flexispy.com'],
    behavior_patterns: ['jailbreak_required', 'call_interception'],
    severity: 'critical',
    spyguard_verified: true,
  },
];

/**
 * Additional network indicators from SpyGuard
 */
export const SPYGUARD_NETWORK_INDICATORS = [
  // mSpy Infrastructure
  { indicator_type: 'domain', indicator_value: 'api.mspy.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'mSpy API endpoint' },
  { indicator_type: 'domain', indicator_value: 'cp.mspyonline.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'mSpy control panel' },
  { indicator_type: 'domain', indicator_value: 'support.mspy.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'mSpy support' },
  
  // FlexiSPY Infrastructure
  { indicator_type: 'domain', indicator_value: 'api.flexispy.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'FlexiSPY API' },
  { indicator_type: 'domain', indicator_value: 'my.flexispy.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'FlexiSPY dashboard' },
  
  // Hoverwatch Infrastructure
  { indicator_type: 'domain', indicator_value: 'hoverwatch.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'Hoverwatch main domain' },
  { indicator_type: 'domain', indicator_value: 'my.hoverwatch.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'Hoverwatch control panel' },
  
  // Other Stalkerware C2 servers
  { indicator_type: 'domain', indicator_value: 'api.spyzie.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'Spyzie API' },
  { indicator_type: 'domain', indicator_value: 'api.thetruthspy.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'TheTruthSpy API' },
  { indicator_type: 'domain', indicator_value: 'dashboard.spyic.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'Spyic dashboard' },
  { indicator_type: 'domain', indicator_value: 'api.cocospy.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'Cocospy API' },
  { indicator_type: 'domain', indicator_value: 'api.xnspy.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'XNSPY API' },
  { indicator_type: 'domain', indicator_value: 'ikeymonitor.com', category: 'stalkerware', severity: 'critical', source: 'SpyGuard', description: 'iKeyMonitor domain' },
];

/**
 * Import SpyGuard data into KV store
 */
export async function importSpyGuardData() {
  console.log('Starting SpyGuard data import...');
  
  const results = {
    stalkerware: 0,
    network: 0,
    errors: [] as string[],
  };

  try {
    // Import stalkerware signatures into KV store
    console.log(`Importing ${SPYGUARD_STALKERWARE_DATABASE.length} stalkerware signatures...`);
    
    for (const signature of SPYGUARD_STALKERWARE_DATABASE) {
      try {
        const key = `stalkerware:${signature.package_name}`;
        const record = {
          ...signature,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        await kv.set(key, record);
        results.stalkerware++;
      } catch (error) {
        console.error(`Error importing stalkerware ${signature.package_name}:`, error);
        results.errors.push(`Stalkerware ${signature.package_name}: ${error}`);
      }
    }
    
    console.log(`✓ Imported ${results.stalkerware} stalkerware signatures`);

    // Import network indicators into KV store
    console.log(`Importing ${SPYGUARD_NETWORK_INDICATORS.length} network indicators...`);
    
    for (const indicator of SPYGUARD_NETWORK_INDICATORS) {
      try {
        const key = `ioc:network:${indicator.indicator_value}`;
        const record = {
          ...indicator,
          id: crypto.randomUUID(),
          metadata: { spyguard_verified: true },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        await kv.set(key, record);
        results.network++;
      } catch (error) {
        console.error(`Error importing network indicator ${indicator.indicator_value}:`, error);
        results.errors.push(`Network ${indicator.indicator_value}: ${error}`);
      }
    }
    
    console.log(`✓ Imported ${results.network} network indicators`);

    // Update sync metadata in KV store
    await kv.set('sync_metadata:stalkerware_signatures', {
      table_name: 'stalkerware_signatures',
      record_count: results.stalkerware,
      metadata: { source: 'SpyGuard', import_date: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    });

    await kv.set('sync_metadata:ioc_network', {
      table_name: 'ioc_network',
      record_count: results.network,
      metadata: { source: 'SpyGuard', import_date: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    });

    console.log('✓ SpyGuard data import complete');
    return results;
  } catch (error) {
    console.error('Exception during SpyGuard import:', error);
    results.errors.push(`Exception: ${String(error)}`);
    return results;
  }
}