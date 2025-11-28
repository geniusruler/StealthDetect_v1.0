import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { WelcomeSlideshow } from './components/WelcomeSlideshow';
import { SetupPinsScreen } from './components/SetupPinsScreen';
import { EnterPinScreen } from './components/EnterPinScreen';
import { PermissionsScreen } from './components/PermissionsScreen';
import { HomeScreen } from './components/HomeScreen';
import { DecoyDashboard } from './components/DecoyDashboard';
import { MainDashboard } from './components/MainDashboard';
import { ScanInProgress } from './components/ScanInProgress';
import { ScanReport } from './components/ScanReport';

// Import: DB init function
import { initDB } from './db/db';

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
  | 'scan-report';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('start');
    const [isLoading, setIsLoading] = useState(true);

    // User state
    const [isFirstRun, setIsFirstRun] = useState(true);
    const [isReturningUser, setIsReturningUser] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);

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

    // Initialize app state from localStorage
    // TODO: REPLACE WITH SQLITE DATABASE FUNCTIONALITY
    useEffect(() => {
    try {
      const hasCompletedWelcome = localStorage.getItem('hasCompletedWelcome') === 'true';
      const hasSetupPins = localStorage.getItem('hasSetupPins') === 'true';
      const hasGrantedPermissions = localStorage.getItem('hasGrantedPermissions') === 'true';
      const storedMain = localStorage.getItem('mainPin') || '';
      const storedDuress = localStorage.getItem('duressPin') || '';

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
    }, []);

    // Init: Run DB init once on app startup
    useEffect(() => {
        const initDatabase = async () => {
            try {
                await initDB();
                console.log('SQLite DB initialized');
            } catch (e) {
                console.error('SQLite DB init failed', e);
            }
        };
        initDatabase().catch(e => console.error('SQLite DB init failed', e));
    }, []);

    // StartScreen handlers
    const handleToggleFirstRun = () => {
    setIsFirstRun(!isFirstRun);
    };

    const handleNavigate = (step: string, cameFromWelcome?: boolean) => {
    if (cameFromWelcome !== undefined) {
      localStorage.setItem('cameFromWelcome', String(cameFromWelcome));
    }
    setCurrentScreen(step as Screen);
    };

    // WelcomeSlideshow handlers
    const handleGetStarted = () => {
    try {
      localStorage.setItem('hasCompletedWelcome', 'true');
      setCurrentScreen('setup-pin');
    } catch (error) {
      console.error('Error saving welcome state:', error);
    }
    };

    const handleShowExplainer = () => {
    // Could show additional explainer screen
    handleGetStarted();
    };

    const handleQuickSetup = () => {
    try {
      localStorage.setItem('hasCompletedWelcome', 'true');
      setCurrentScreen('setup-pin');
    } catch (error) {
      console.error('Error saving welcome state:', error);
    }
    };

    // SetupPinsScreen handlers
    const handlePinSetupComplete = () => {
    if (!validatePin(mainPin) || mainPin !== confirmMainPin) {
      return;
    }

    if (duressPin && (duressPin === mainPin || duressPin !== confirmDuressPin)) {
      return;
    }

    try {
      localStorage.setItem('mainPin', mainPin);
      localStorage.setItem('duressPin', duressPin);
      localStorage.setItem('hasSetupPins', 'true');
      setStoredMainPin(mainPin);
      setStoredDuressPin(duressPin);

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
    const handleUnlock = () => {
    if (currentPin === storedMainPin) {
      setCurrentPin('');
      setCurrentScreen('home');
    } else if (currentPin === storedDuressPin && storedDuressPin !== '') {
      setCurrentPin('');
      setCurrentScreen('decoy');
    } else {
      // Invalid PIN - could show error
      alert('Invalid PIN. Please try again.');
      setCurrentPin('');
    }
    };

    const handleBackFromEnter = () => {
    setCurrentScreen('start');
    };

    const handleReset = () => {
    if (confirm('Are you sure you want to reset the app? All data will be cleared.')) {
      try {
        localStorage.clear();
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

    const handlePermissionsContinue = () => {
    try {
      localStorage.setItem('hasGrantedPermissions', 'true');
      setHasPermissions(true);

      // Check if user has already set up PINs
      const hasSetupPins = localStorage.getItem('hasSetupPins') === 'true';

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

    const handleBackFromPermissions = () => {
    const hasSetupPins = localStorage.getItem('hasSetupPins') === 'true';
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
      // FAQ screen doesn't exist yet, navigate to home for now
      console.log('FAQ screen not implemented yet');
      setCurrentScreen('home');
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
          <p>Loading Stealth Detect...</p>
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
        <DecoyDashboard />
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
              // Handle network map if needed
              setCurrentScreen('dashboard');
            }
          }}
        />
      )}
      {currentScreen === 'scan-in-progress' && (
        <ScanInProgress
          onScanComplete={handleScanComplete}
          onBackToDashboard={handleBackToDashboard}
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
    </>
    );
}
