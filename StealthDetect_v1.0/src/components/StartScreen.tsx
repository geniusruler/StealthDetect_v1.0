import { Button } from "./ui/button";
import { Shield, ChevronRight } from "lucide-react";

interface StartScreenProps {
  isReturningUser: boolean;
  hasPermissions: boolean;
  isFirstRun: boolean;
  onToggleFirstRun: () => void;
  onNavigate: (step: string, cameFromWelcome?: boolean) => void;
}

export function StartScreen({
  isReturningUser,
  hasPermissions,
  isFirstRun,
  onToggleFirstRun,
  onNavigate,
}: StartScreenProps) {
  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 h-14">
        <h1 className="font-medium text-foreground">StealthDetect</h1>
        <span className="text-sm text-muted-foreground">v0.1</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-8 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <Shield className="w-20 h-20 text-primary" />

          <div className="space-y-2 max-w-sm">
            <h2 className="text-2xl font-medium text-foreground">
              {isReturningUser ? "Welcome Back" : "Welcome to StealthDetect"}
            </h2>
            <p className="text-muted-foreground">
              {isReturningUser 
                ? hasPermissions 
                  ? "Enter your PIN to continue securely"
                  : "Permissions required to continue securely"
                : "Privacy-first stalkerware detection for your device"
              }
            </p>
          </div>

          {/* First Run Toggle for testing */}
          <div className="w-full max-w-sm p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">First Run?</span>
              <button
                onClick={onToggleFirstRun}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isFirstRun ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isFirstRun ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Toggle to simulate first time vs returning user
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isReturningUser ? (
            hasPermissions ? (
              <Button
                onClick={() => onNavigate("enter-pin")}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl"
              >
                Enter PIN
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => onNavigate("permissions")}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl"
              >
                Grant Permissions
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )
          ) : isFirstRun ? (
            <>
              <Button
                onClick={() => onNavigate("welcome", true)}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl"
              >
                Start Setup
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => onNavigate("permissions", false)}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                Quick Setup (Skip Intro)
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onNavigate("permissions", false)}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl"
            >
              Grant Permissions
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          No cloud sync. No trackers.
        </p>
      </div>
    </div>
  );
}