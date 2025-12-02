# Stealth Detect - Capacitor Plugins

This directory contains custom Capacitor plugins for native iOS functionality.

## Plugins

### 1. App Scanner (`/app-scanner`)

**Purpose:** Detect installed applications and analyze for stalkerware patterns.

**Capabilities:**
- ✅ URL scheme-based app detection (iOS App Store compliant)
- ✅ Permission analysis
- ⚠️ File hash generation (requires jailbreak for full functionality)
- ⚠️ Full app enumeration (requires private APIs - NOT App Store safe)

**Current Status:** Mock implementation for web development

**Production Deployment:**

To convert this to a real Capacitor plugin for iOS:

```bash
# 1. Initialize Capacitor plugin
npm init @capacitor/plugin

# Plugin name: @stealth-detect/app-scanner
# Plugin ID: app-scanner
# Class name: AppScanner

# 2. Copy definitions.ts and implementation.ts to plugin src/

# 3. Implement native iOS code (see implementation.ts for guide)

# 4. Build and publish
cd app-scanner
npm run build
npm publish

# 5. Install in main app
npm install @stealth-detect/app-scanner
npx cap sync
```

**iOS Implementation Requirements:**

1. **URL Scheme Detection (Recommended):**
   - Add schemes to Info.plist `LSApplicationQueriesSchemes`
   - Use `UIApplication.shared.canOpenURL()`
   - App Store compliant ✅

2. **Private API Approach (Advanced):**
   - Use `LSApplicationWorkspace` (requires jailbreak)
   - App Store will REJECT ❌
   - Only for enterprise/internal distribution

3. **File System Detection:**
   - Limited to shared containers
   - Partial detection only
   - App Store compliant ✅

**Recommended Strategy:**

Primary: URL scheme detection + Network monitoring (VPN)
Secondary: Behavioral analysis (battery, data usage)
Tertiary: Permission pattern analysis

---

### 2. VPN Monitor (`/vpn-monitor`) - Future

**Purpose:** Real-time network traffic monitoring via VPN.

**Capabilities:**
- Packet capture and inspection
- DNS query monitoring  
- Domain/IP blacklist checking
- Connection logging

**iOS Requirements:**
- Network Extension framework
- `NEPacketTunnelProvider`
- `NEDNSProxyProvider`
- Personal VPN entitlement

**Status:** Architecture defined in `/utils/network-monitor.ts`

---

## iOS Development Setup

### Prerequisites

1. **Apple Developer Account:** $99/year
2. **Xcode:** Latest version from Mac App Store
3. **Capacitor CLI:** `npm install -g @capacitor/cli`
4. **CocoaPods:** `sudo gem install cocoapods`

### Building for iOS

```bash
# 1. Add iOS platform
npx cap add ios

# 2. Sync web assets and plugins
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# 4. In Xcode:
#    - Select your development team
#    - Configure signing & capabilities
#    - Add required entitlements:
#      * Network Extensions (for VPN)
#      * Personal VPN
#      * App Groups (for data sharing)

# 5. Build and run on device/simulator
```

### Capabilities & Entitlements

Add these in Xcode → Signing & Capabilities:

1. **Network Extensions**
   - Required for VPN monitoring
   - Needs approval from Apple

2. **Personal VPN**
   - Required for packet tunnel
   - Needs approval from Apple

3. **App Groups**
   - For sharing data between app and extensions
   - Format: `group.com.yourcompany.stealthdetect`

4. **Background Modes**
   - Network authentication
   - Background fetch
   - Remote notifications

### App Store Submission Notes

**✅ Safe to submit:**
- URL scheme detection
- Network monitoring via VPN (with proper disclosure)
- File system detection (limited)
- Permission analysis

**❌ Will be rejected:**
- Private APIs (LSApplicationWorkspace)
- Unauthorized access to other apps' data
- Jailbreak detection bypass
- Undisclosed data collection

**Required disclosures:**
- Privacy policy explaining VPN usage
- Clear user consent for network monitoring
- Explanation of detected threats
- Data retention policy

---

## Testing

### Development (Web)

```typescript
import { AppScanner } from './capacitor-plugins/app-scanner';

// Uses mock implementation automatically
const result = await AppScanner.getInstalledApps();
console.log('Installed apps:', result);
```

### iOS Simulator

```bash
npx cap run ios
```

### Physical Device

1. Connect iPhone via USB
2. Trust computer on device
3. Select device in Xcode
4. Click Run (⌘+R)

---

## Troubleshooting

### "App Scanner plugin not available"
- Run `npx cap sync ios`
- Rebuild app in Xcode

### VPN not starting
- Check Network Extension entitlement
- Verify provisioning profile includes VPN capability
- Check device logs in Console.app

### URL scheme detection not working
- Ensure schemes are in Info.plist
- Check LSApplicationQueriesSchemes array
- Verify proper format: `schemename://`

---

## Security & Privacy

### Data Handling

- **All scanning happens locally on device**
- **No user data sent to cloud** (only threat intelligence sync)
- **PIN stored with SHA-256 encryption**
- **No keystroke logging**
- **No personal data collection**

### Compliance

- **GDPR:** User data stays on device
- **CCPA:** No data sale or sharing
- **Apple Privacy:** Full disclosure in Privacy Nutrition Label
- **COPPA:** No children's data collected

### Threat Intelligence Sync

- Only IoC data (hashes, domains, package names) syncs from Supabase
- No reverse sync of user scan results
- Optional - app works fully offline
- User can disable in settings

---

## Production Checklist

Before App Store submission:

- [ ] Implement URL scheme detection in Swift
- [ ] Add all known stalkerware schemes to Info.plist
- [ ] Implement VPN monitoring (optional but recommended)
- [ ] Write comprehensive privacy policy
- [ ] Create App Store privacy nutrition label
- [ ] Test on multiple iOS versions (15+)
- [ ] Test on multiple device types
- [ ] Implement proper error handling
- [ ] Add user consent flows
- [ ] Create help documentation
- [ ] Set up crash reporting (Sentry, Crashlytics)
- [ ] Configure analytics (privacy-friendly)
- [ ] Submit for App Review

---

## References

- [Capacitor Plugins Guide](https://capacitorjs.com/docs/plugins)
- [iOS Network Extension](https://developer.apple.com/documentation/networkextension)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [SpyGuard Project](https://github.com/Te-k/spyguard)
- [Coalition Against Stalkerware](https://stopstalkerware.org/)
