![stealthdetectlogo](https://github.com/user-attachments/assets/cddd9c3c-e0d2-4ce0-8536-dcf0c4b94602)

# StealthDetect

StealthDetect is a stalkerware detection app for mobile devices that uses network traffic analysis to detect indicators of compromise (IOCs). The app creates a local VPN to intercept DNS queries, comparing them against a bundled threat intelligence database to identify stalkerware, spyware, and other surveillance tools.

## Features

- **VPN Based DNS Monitoring** - Creates a local VPN service to intercept and analyze DNS queries without sending data externally
- **Offline Threat Detection** - Bundled IOC database with known stalkerware signatures works without internet
- **Real Time Alerts** - Instant notifications when suspicious network activity is detected
- **Duress PIN Protection** - Secondary PIN shows a decoy dashboard to protect users in an attacker you know situations
- **Comprehensive Scanning** - Detects malicious packages, C2 domains, and file hashes
- **Privacy First Design** - All analysis happens on-device. No data leaves your phone

## Architecture

```
StealthDetect/
├── src/                    # React + TypeScript frontend
│   ├── components/         # UI screens and components
│   ├── hooks/              # React hooks (useVpnMonitor)
│   └── utils/              # Core utilities
│       ├── database.ts     # SQLite database wrapper
│       ├── ioc-auto-loader.ts    # Threat data loader
│       ├── ioc-ingest.ts         # IOC ingestion service
│       └── initialize-app.ts     # App initialization
├── android/                # Capacitor Android project
│   └── app/src/main/java/
│       └── io/ionic/starter/
│           ├── StealthDetectVpnService.java  # VPN service
│           ├── DnsPacketParser.java          # DNS packet parser
│           └── VpnServicePlugin.java         # Capacitor bridge
└── public/
    └── All_IOCs.json       # Bundled threat intelligence
```

## Prerequisites

- Node.js 20.x LTS or newer
- npm 9.x or newer
- Android Studio (Arctic Fox or newer)
- Java JDK 17+
- Android SDK with API level 24+ (Android 7.0)

## Quick Start

### Web Development

```bash
cd StealthDetect_v1.0
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Android Build

```bash
# Install dependencies and build
npm install
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Connect a device or start an emulator
3. Click **Run** (▶)

## How It Works

1. **App Initialization** - On first launch, the app loads the bundled IOC database into SQLite
2. **VPN Activation** - User enables the local VPN service (requires Android permission)
3. **DNS Interception** - The VPN intercepts all DNS queries from the device
4. **Threat Matching** - Each query is compared against known malicious domains
5. **Alert Generation** - Matches trigger real-time alerts and are logged for review

## Threat Intelligence

The app includes a bundled `All_IOCs.json` file containing:
- Package signatures for known stalkerware apps
- C2 (Command & Control) domain indicators
- File hashes for malicious binaries
- Network indicators from security research

## Security Features

| Feature | Description |
|---------|-------------|
| PIN Protection | 4-8 digit PIN required to access the app |
| Duress Mode | Secondary PIN shows fake "clean" dashboard |
| Local VPN | DNS analysis stays on-device |
| Encrypted Storage | PINs stored using secure hashing |
| No Telemetry | Zero data collection or external reporting |

## Project Links

- **Design**: [Figma Prototype](https://www.figma.com/design/yqrvXYv113geR5SfRexgl5/StealthDetect)
- **Backend Specs**: See `/docs` folder for API documentation

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build**: Vite 5.x
- **Mobile**: Capacitor 6.x
- **Database**: SQLite (via @capacitor-community/sqlite)
- **Native**: Android VpnService API

## License

The IOCs are distributed under the Creative Common BY-NC-SA licence. This imply a non commercial use of them. Please respect this licence and ask ECHAP for any question related to that.

---

*StealthDetect helps protect those at risk from digital surveillance. If you or someone you know is experiencing domestic violence or stalking, please reach out for help.* 

**You are never alone in this fight. You can always get help.**

National Domestic Violence Hotline: 1-800-799-SAFE (7233)
