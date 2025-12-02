# Quick Reference Guide

## 🚀 Common Commands

### Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

### iOS Build
```bash
npm run cap:build    # Build web + sync to iOS
npm run cap:ios      # Open in Xcode
npx cap sync ios     # Sync changes to iOS
```

### Code Quality
```bash
npm run lint         # Lint code
npm run format       # Format code
npm run type-check   # TypeScript check
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/App.tsx` | Main app component |
| `/components/MainDashboard.tsx` | Security dashboard |
| `/utils/scanner.ts` | Threat scanning engine |
| `/utils/crypto.ts` | PIN hashing/verification |
| `/utils/database.ts` | Local KV database |
| `/supabase/functions/server/index.tsx` | Backend API |
| `/capacitor-plugins/app-scanner/` | iOS native plugin |

## 🔐 Security Features

- **PIN Storage**: SHA-256 hashed in Capacitor Preferences (iOS) or localStorage (web)
- **Duress PIN**: Shows decoy dashboard
- **Local Processing**: All data stays on device
- **IoC Detection**: 27+ stalkerware, 15+ C2 domains

## 🛠️ Key Functions

### Crypto (`/utils/crypto.ts`)
```typescript
await hashPIN(pin)           // Hash PIN with SHA-256
await verifyPIN(pin, hash)   // Verify PIN against hash
```

### Database (`/utils/database.ts`)
```typescript
await db.setPINHash(type, hash)   // Store PIN hash
await db.getPINHash(type)         // Get PIN hash
await db.saveScanResult(data)     // Save scan results
```

### Scanner (`/utils/scanner.ts`)
```typescript
await performFullScan()           // Run full security scan
await scanInstalledApps()         // Scan for stalkerware
await scanNetworkConnections()    // Check network traffic
```

### IoC Engine (`/utils/ioc-engine.ts`)
```typescript
await detectStalkerware(apps)     // Detect stalkerware
await detectMaliciousNetwork(conns) // Detect C2 servers
await detectMaliciousFiles(hashes)  // Detect malware hashes
```

## 📡 API Endpoints

Base URL: `https://{projectId}.supabase.co/functions/v1/make-server-91fc533e`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/ioc/stalkerware` | GET | Get stalkerware signatures |
| `/ioc/network` | GET | Get network indicators |
| `/ioc/files` | GET | Get file hashes |
| `/admin/populate` | POST | Populate IoC database |

## 🎨 UI Components (shadcn/ui)

Located in `/components/ui/`:
- `button`, `card`, `badge` - Basic components
- `dialog`, `alert-dialog` - Modals
- `input`, `switch`, `checkbox` - Form elements
- `accordion` - Collapsible sections
- `tabs`, `table` - Layout components

## 🔄 Navigation Flow

```
StartScreen
  ↓
WelcomeSlideshow (first run)
  ↓
SetupPinsScreen (new user)
  ↓
PermissionsScreen
  ↓
EnterPinScreen (returning user)
  ↓
HomeScreen (main PIN) or DecoyDashboard (duress PIN)
  ↓
MainDashboard → ScanInProgress → ScanReport
```

## 📱 Capacitor Plugins

```typescript
// Secure Storage
import { Preferences } from '@capacitor/preferences';
await Preferences.set({ key: 'myKey', value: 'myValue' });
const { value } = await Preferences.get({ key: 'myKey' });

// Splash Screen
import { SplashScreen } from '@capacitor/splash-screen';
await SplashScreen.hide();

// Status Bar
import { StatusBar } from '@capacitor/status-bar';
await StatusBar.setStyle({ style: 'dark' });
```

## 🐛 Debugging

### Web (Browser)
- Open DevTools (F12)
- Check Console for logs
- Use React DevTools extension

### iOS
1. Open in Xcode: `npx cap open ios`
2. Run on device/simulator
3. Safari → Develop → [Device] → [App]
4. Use Safari Web Inspector

### Common Issues

**Scan not working**: Check IoC data populated in Supabase
**PIN not saving**: Verify Capacitor Preferences permissions
**Network monitoring fails**: Check VPN permissions (iOS)
**Build errors**: Run `npx cap sync ios` and clean build

## 📊 State Management

- **Screen State**: useState in App.tsx
- **PIN State**: useState + Capacitor Preferences
- **Scan Data**: useState (ephemeral)
- **IoC Data**: Supabase KV store (persistent)

## 🔗 Useful Links

- [Capacitor Docs](https://capacitorjs.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)

## ⚡ Performance Tips

- Use React.memo for expensive components
- Lazy load screens with React.lazy
- Optimize images (use WebP format)
- Minimize re-renders with proper state management
- Use virtual scrolling for long lists

## 🔒 Security Checklist

- [x] PIN hashes never sent to cloud
- [x] Local-only data processing
- [x] No analytics or tracking
- [x] Encrypted local storage
- [x] HTTPS for API calls
- [x] Input validation
- [x] XSS protection (React escaping)
- [x] CSRF protection (Supabase tokens)

---

**Need more help?** Check the full docs in `/docs` or open a GitHub Issue.
