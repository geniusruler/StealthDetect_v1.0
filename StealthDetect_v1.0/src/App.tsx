import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { WelcomeSlideshow } from './components/WelcomeSlideshow';
import { SetupPinsScreen } from './components/SetupPinsScreen';
import { EnterPinScreen } from './components/EnterPinScreen';
import { PermissionsScreen } from './components/PermissionsScreen';
import { HomeScreen } from './components/HomeScreen';
import { DecoyDashboard } from './components/DecoyDashboard';
import { MainDashboard, type ScanConfig } from './components/MainDashboard';
import { ScanInProgress } from './components/ScanInProgress';
import { ScanReport } from './components/ScanReport';
import { SettingsScreen } from './components/SettingsScreen';
import { FAQScreen } from './components/FAQScreen';
import { NetworkMapScreen } from './components/NetworkMapScreen';
import { secureStorage, splashScreen, statusBar, isNative } from './utils/native';
import { db } from './utils/database';
import { hashPIN, verifyPIN } from './utils/crypto';
import { initializeStealthDetect, displayInitBanner, type InitializationResult } from './utils/initialize-app';

type Screen = 
  | 'start'
  | 'welcome'
  | 'setup-pin'
  | 'enter-pin'
  | 'permissions'
  | 'home'
  | 'decoy'
  | 'dashboard'
  | 'scan-in-progress'
  | 'scan-report'
  | 'settings'
  | 'faq'
  | 'network-map';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('start');
  const [isLoading, setIsLoading] = useState(true);
  const [initProgress, setInitProgress] = useState<string>('Starting...');

  // User state
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  // App initialization state
  const [appInitialized, setAppInitialized] = useState<InitializationResult | null>(null);
  
  // PIN state
  const [mainPin, setMainPin] = useState('');
  const [confirmMainPin, setConfirmMainPin] = useState('');
  const [duressPin, setDuressPin] = useState('');
  const [confirmDuressPin, setConfirmDuressPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  
  // Stored PINs
  const [storedMainPin, setStoredMainPin] = useState('');
  const [storedDuressPin, setStoredDuressPin] = useState('');
  
  // Permissions state
  const [permissions, setPermissions] = useState({
    systemUsage: false,
    notifications: false,
  });
  
  // Scan data
  const [scanData, setScanData] = useState<any>(null);

  // Scan configuration
  const [scanConfig, setScanConfig] = useState<ScanConfig>({
    networkMonitoringDuration: 10000,
    skipNetworkMonitoring: false,
  });

  // Initialize app state from secure storage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Hide splash screen when app is ready
        await splashScreen.hide();

        // Set status bar style for iOS
        await statusBar.setStyle('dark');

        // Step 1: Initialize threat intelligence database (auto-loads IOCs)
        setInitProgress('Loading threat intelligence...');
        const initResult = await initializeStealthDetect();
        setAppInitialized(initResult);
        displayInitBanner(initResult);

        // Step 2: Load user state from secure storage
        setInitProgress('Loading user data...');
        const hasCompletedWelcome = await secureStorage.getItem('hasCompletedWelcome') === 'true';
        const hasSetupPins = await secureStorage.getItem('hasSetupPins') === 'true';
        const hasGrantedPermissions = await secureStorage.getItem('hasGrantedPermissions') === 'true';

        // Load hashed PINs from database
        const storedMain = await db.getPINHash('main') || '';
        const storedDuress = await db.getPINHash('duress') || '';

        setStoredMainPin(storedMain);
        setStoredDuressPin(storedDuress);
        setHasPermissions(hasGrantedPermissions);

        // Determine if returning user
        const returningUser = hasCompletedWelcome || hasSetupPins;
        setIsReturningUser(returningUser);

        // Determine initial screen
        if (!hasCompletedWelcome) {
          setCurrentScreen('start');
        } else if (!hasSetupPins) {
          setCurrentScreen('setup-pin');
        } else if (!hasGrantedPermissions) {
          setCurrentScreen('permissions');
        } else {
          setCurrentScreen('enter-pin');
        }
      } catch (error) {
        console.error('Error loading user state:', error);
        setCurrentScreen('start');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // StartScreen handlers
  const handleToggleFirstRun = () => {
    setIsFirstRun(!isFirstRun);
  };

  const handleNavigate = async (step: string, cameFromWelcome?: boolean) => {
    if (cameFromWelcome !== undefined) {
      await secureStorage.setItem('cameFromWelcome', String(cameFromWelcome));
    }
    setCurrentScreen(step as Screen);
  };

  // WelcomeSlideshow handlers
  const handleGetStarted = async () => {
    try {
      await secureStorage.setItem('hasCompletedWelcome', 'true');
      setCurrentScreen('setup-pin');
    } catch (error) {
      console.error('Error saving welcome state:', error);
    }
  };

  const handleShowExplainer = () => {
    // Could show additional explainer screen
    handleGetStarted();
  };

  const handleQuickSetup = async () => {
    try {
      await secureStorage.setItem('hasCompletedWelcome', 'true');
      setCurrentScreen('setup-pin');
    } catch (error) {
      console.error('Error saving welcome state:', error);
    }
  };

  // SetupPinsScreen handlers
  const handlePinSetupComplete = async () => {
    if (!validatePin(mainPin) || mainPin !== confirmMainPin) {
      return;
    }
    
    if (duressPin && (duressPin === mainPin || duressPin !== confirmDuressPin)) {
      return;
    }

    try {
      // Hash PINs before storing
      const mainPinHash = await hashPIN(mainPin);
      const duressPinHash = duressPin ? await hashPIN(duressPin) : '';
      
      // Store hashes in database (encrypted)
      await db.setPINHash('main', mainPinHash);
      if (duressPinHash) {
        await db.setPINHash('duress', duressPinHash);
      }
      
      await secureStorage.setItem('hasSetupPins', 'true');
      setStoredMainPin(mainPinHash);
      setStoredDuressPin(duressPinHash);
      
      // Clear setup fields
      setMainPin('');
      setConfirmMainPin('');
      setDuressPin('');
      setConfirmDuressPin('');
      
      setCurrentScreen('permissions');
    } catch (error) {
      console.error('Error saving PIN data:', error);
    }
  };

  const validatePin = (pin: string): boolean => {
    return pin.length >= 4 && pin.length <= 8 && /^\d+$/.test(pin);
  };

  const handleBackFromSetup = () => {
    setCurrentScreen('welcome');
  };

  // EnterPinScreen handlers
  const handleUnlock = async () => {
    try {
      // Verify against hashed PINs
      const isMainPinValid = await verifyPIN(currentPin, storedMainPin);
      const isDuressPinValid = storedDuressPin ? await verifyPIN(currentPin, storedDuressPin) : false;
      
      if (isMainPinValid) {
        setCurrentPin('');
        setCurrentScreen('home');
      } else if (isDuressPinValid) {
        setCurrentPin('');
        setCurrentScreen('decoy');
      } else {
        // Invalid PIN - could show error
        alert('Invalid PIN. Please try again.');
        setCurrentPin('');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      alert('Error verifying PIN. Please try again.');
      setCurrentPin('');
    }
  };

  const handleBackFromEnter = () => {
    setCurrentScreen('start');
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset the app? All data will be cleared.')) {
      try {
        await secureStorage.clear();
        window.location.reload();
      } catch (error) {
        console.error('Error resetting app:', error);
      }
    }
  };

  // PermissionsScreen handlers
  const handlePermissionChange = (newPermissions: { systemUsage: boolean; notifications: boolean }) => {
    setPermissions(newPermissions);
  };

  const handlePermissionsContinue = async () => {
    try {
      await secureStorage.setItem('hasGrantedPermissions', 'true');
      setHasPermissions(true);
      
      // Check if user has already set up PINs
      const hasSetupPins = await secureStorage.getItem('hasSetupPins') === 'true';
      
      if (hasSetupPins) {
        // Returning user who just granted permissions
        setCurrentScreen('enter-pin');
      } else {
        // Should not happen in normal flow
        setCurrentScreen('setup-pin');
      }
    } catch (error) {
      console.error('Error saving permissions state:', error);
    }
  };

  const handleBackFromPermissions = async () => {
    const hasSetupPins = await secureStorage.getItem('hasSetupPins') === 'true';
    if (hasSetupPins) {
      setCurrentScreen('start');
    } else {
      setCurrentScreen('setup-pin');
    }
  };

  // HomeScreen handlers
  const handleHomeNavigate = (screen: string) => {
    if (screen === 'dashboard' || screen === 'main-dashboard' || screen === 'dashboard-pin') {
      setCurrentScreen('dashboard');
    } else if (screen === 'scan') {
      setCurrentScreen('scan-in-progress');
    } else if (screen === 'decoy') {
      setCurrentScreen('decoy');
    } else if (screen === 'faq') {
      setCurrentScreen('faq');
    } else if (screen === 'settings') {
      setCurrentScreen('settings');
    } else {
      setCurrentScreen(screen as Screen);
    }
  };

  // Scan handlers
  const handleScanComplete = (data: any) => {
    setScanData(data);
    setCurrentScreen('scan-report');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium mb-2">Stealth Detect</p>
          <p className="text-sm text-gray-400">{initProgress}</p>
        </div>
      </div>
    );
  }

  // Render current screen
  return (
    <>
      {currentScreen === 'start' && (
        <StartScreen
          isReturningUser={isReturningUser}
          hasPermissions={hasPermissions}
          isFirstRun={isFirstRun}
          onToggleFirstRun={handleToggleFirstRun}
          onNavigate={handleNavigate}
        />
      )}
      {currentScreen === 'welcome' && (
        <WelcomeSlideshow
          onGetStarted={handleGetStarted}
          onShowExplainer={handleShowExplainer}
          onQuickSetup={handleQuickSetup}
        />
      )}
      {currentScreen === 'setup-pin' && (
        <SetupPinsScreen
          mainPin={mainPin}
          confirmMainPin={confirmMainPin}
          duressPin={duressPin}
          confirmDuressPin={confirmDuressPin}
          onMainPinChange={setMainPin}
          onConfirmMainPinChange={setConfirmMainPin}
          onDuressPinChange={setDuressPin}
          onConfirmDuressPinChange={setConfirmDuressPin}
          onBack={handleBackFromSetup}
          onComplete={handlePinSetupComplete}
          validatePin={validatePin}
        />
      )}
      {currentScreen === 'enter-pin' && (
        <EnterPinScreen
          currentPin={currentPin}
          onPinChange={setCurrentPin}
          onUnlock={handleUnlock}
          onBack={handleBackFromEnter}
          onReset={handleReset}
        />
      )}
      {currentScreen === 'permissions' && (
        <PermissionsScreen
          permissions={permissions}
          onPermissionChange={handlePermissionChange}
          onBack={handleBackFromPermissions}
          onContinue={handlePermissionsContinue}
          canProceed={permissions.systemUsage}
        />
      )}
      {currentScreen === 'home' && (
        <HomeScreen onNavigate={handleHomeNavigate} />
      )}
      {currentScreen === 'decoy' && (
        <DecoyDashboard onNavigate={handleHomeNavigate} />
      )}
      {currentScreen === 'dashboard' && (
        <MainDashboard
          onNavigate={(screen) => {
            if (screen === 'scan-progress') {
              setCurrentScreen('scan-in-progress');
            } else if (screen === 'scan-report') {
              setCurrentScreen('scan-report');
            } else if (screen === 'home') {
              setCurrentScreen('home');
            } else if (screen === 'network-map') {
              setCurrentScreen('network-map');
            } else if (screen === 'settings') {
              setCurrentScreen('settings');
            }
          }}
          onStartScan={(config) => {
            setScanConfig(config);
          }}
        />
      )}
      {currentScreen === 'scan-in-progress' && (
        <ScanInProgress
          onNavigate={(screen) => {
            if (screen === 'main-dashboard') {
              setCurrentScreen('dashboard');
            } else if (screen === 'scan-report') {
              setCurrentScreen('scan-report');
            } else if (screen === 'home') {
              setCurrentScreen('home');
            }
          }}
          onScanComplete={(scanId) => {
            console.log('Scan completed:', scanId);
          }}
          scanConfig={scanConfig}
        />
      )}
      {currentScreen === 'scan-report' && (
        <ScanReport 
          onNavigate={(screen) => {
            if (screen === 'main-dashboard') {
              setCurrentScreen('dashboard');
            } else if (screen === 'home') {
              setCurrentScreen('home');
            }
          }}
        />
      )}
      {currentScreen === 'settings' && (
        <SettingsScreen onNavigate={handleHomeNavigate} />
      )}
      {currentScreen === 'faq' && (
        <FAQScreen onNavigate={handleHomeNavigate} />
      )}
      {currentScreen === 'network-map' && (
        <NetworkMapScreen onNavigate={handleHomeNavigate} />
      )}
    </>
  );
}