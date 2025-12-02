import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Lock, ChevronRight } from "lucide-react";

interface EnterPinScreenProps {
  currentPin: string;
  onPinChange: (value: string) => void;
  onUnlock: () => void;
  onBack: () => void;
  onReset: () => void;
}

export function EnterPinScreen({
  currentPin,
  onPinChange,
  onUnlock,
  onBack,
  onReset,
}: EnterPinScreenProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentPin.length >= 4) {
      onUnlock();
    }
  };

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 h-14">
        <button 
          onClick={onBack}
          className="text-muted-foreground"
        >
          ← Back
        </button>
        <h1 className="font-medium text-foreground">Enter PIN</h1>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-8 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <Lock className="w-16 h-16 text-primary" />

          <div className="space-y-2 max-w-sm">
            <h2 className="text-2xl font-medium text-foreground">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Enter your PIN
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                value={currentPin}
                onChange={(e) => onPinChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Enter your PIN"
                className="h-12 text-center text-lg tracking-wider"
                onKeyPress={handleKeyPress}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
               Enter your PIN 
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onUnlock}
            disabled={currentPin.length < 4}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
          >
            Unlock
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            onClick={onReset}
            variant="outline"
            className="w-full h-12 rounded-xl"
          >
            Reset App
          </Button>
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