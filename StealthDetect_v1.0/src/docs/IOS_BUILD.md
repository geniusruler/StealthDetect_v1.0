# iOS Build Guide

Complete guide for building and deploying StealthDetect on iOS.

## Prerequisites

- macOS with Xcode 14+
- Apple Developer Account
- Node.js 16+
- CocoaPods

## Setup Steps

### 1. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init
```

### 2. Build Web Assets

```bash
npm run build
```

### 3. Add iOS Platform

```bash
npx cap add ios
npx cap sync ios
```

### 4. Configure iOS Project

```bash
npx cap open ios
```

In Xcode:
1. Select the project in the navigator
2. Go to "Signing & Capabilities"
3. Select your Team
4. Configure Bundle Identifier (e.g., `com.yourname.stealthdetect`)
5. Enable required capabilities:
   - Background Modes (if needed)
   - Push Notifications (if needed)

### 5. Build & Run

1. Select target device/simulator
2. Click Run (⌘R)

## Deployment

### TestFlight

1. Archive the app (Product → Archive)
2. Upload to App Store Connect
3. Configure TestFlight testing
4. Invite testers

### App Store

1. Complete App Store Connect listing
2. Submit for review
3. Wait for approval
4. Release to App Store

## Troubleshooting

**Build fails**: Clean build folder (⇧⌘K) and rebuild
**Signing issues**: Verify team and provisioning profiles
**Plugin errors**: Run `npx cap sync ios` again

For more help, see [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios).
