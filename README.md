   ![stealthdetectlogo](https://github.com/user-attachments/assets/cddd9c3c-e0d2-4ce0-8536-dcf0c4b94602)
# StealthDetect

StealthDetect is a stalkerware detection app for mobile devices that uses network traffic to detect indicators of compromises. StealthDetect uses a VPN configuration profile to collect network traffic being transmitted from the device and makes it super easy for anyone to setup and scan their device for stalkerware or spyware.

This is a code bundle for StealthDetect. The original project is available at: https://www.figma.com/design/yqrvXYv113geR5SfRexgl5/StealthDetect

**You are never alone in this fight. You can always get help.**

National Domestic Violence Hotline: 1-800-799-SAFE (7233)
## Prerequisites

- Node.js (recent LTS, e.g. 20.x) with npm
- Java JDK and Android Studio (for running the Android app)

## Running the web app (Vite + React)

From the `StealthDetect/StealthDetect` folder (the one containing `package.json`):

1. Install dependencies:

   ```cmd
   npm install
   ```

2. Start the development server:

   ```cmd
   npm run dev
   ```

3. Open the URL shown in the terminal (typically `http://localhost:5173`) in your browser.

## Building the web app

From the same folder:

```cmd
npm run build
```

This produces a production build in the `build` directory. These files are what the Android (Capacitor) app loads.

## Running the Android app (Capacitor wrapper)

The Android app in the `android` folder is a Capacitor wrapper around the built web app.

1. Build the web assets (if you haven't already or after making changes):

   ```cmd
   cd C:\Users\AK\Documents\Code\IdeaProjects\StealthDetect\StealthDetect
   npm install
   npm run build
   ```

2. Sync the web build to the Android project:

   ```cmd
   npx cap sync android
   ```

3. Open the Android project in Android Studio:

    - In Android Studio, choose **Open** and select the `C:\Users\AK\Documents\Code\IdeaProjects\StealthDetect\StealthDetect\android` directory.
    - Let Gradle sync finish.

4. Run on a device or emulator:

    - Start an Android emulator or connect a device with USB debugging enabled.
    - Click the **Run** (▶) button in Android Studio and choose your target device.

## Notes

- This project is a Vite + React web app wrapped by a Capacitor Android project; it is **not** an Expo / React Native app.
- For native capabilities (e.g., SQLite, sensors), use Capacitor plugins rather than Expo packages.
