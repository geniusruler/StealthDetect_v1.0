import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Shield, ChevronRight } from "lucide-react";

interface SetupPinsScreenProps {
  mainPin: string;
  confirmMainPin: string;
  duressPin: string;
  confirmDuressPin: string;
  onMainPinChange: (value: string) => void;
  onConfirmMainPinChange: (value: string) => void;
  onDuressPinChange: (value: string) => void;
  onConfirmDuressPinChange: (value: string) => void;
  onBack: () => void;
  onComplete: () => void;
  validatePin: (pin: string) => boolean;
}

export function SetupPinsScreen({
  mainPin,
  confirmMainPin,
  duressPin,
  confirmDuressPin,
  onMainPinChange,
  onConfirmMainPinChange,
  onDuressPinChange,
  onConfirmDuressPinChange,
  onBack,
  onComplete,
  validatePin,
}: SetupPinsScreenProps) {
  const canProceedSetup = validatePin(mainPin) && mainPin === confirmMainPin && 
                         (duressPin === "" || (validatePin(duressPin) && duressPin === confirmDuressPin && duressPin !== mainPin));

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
        <h1 className="font-medium text-foreground">Setup PINs</h1>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-8 flex flex-col">
        <div className="flex-1 space-y-6">
          <div className="text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-foreground mb-2">
              Secure Your App
            </h2>
            <p className="text-muted-foreground">
              Set up your main PIN and optional duress PIN
            </p>
          </div>

          {/* Main PIN Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Main PIN</label>
              <Input
                type="password"
                value={mainPin}
                onChange={(e) => onMainPinChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Enter 4-8 digits"
                className="h-12 text-center text-lg tracking-wider"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Main PIN</label>
              <Input
                type="password"
                value={confirmMainPin}
                onChange={(e) => onConfirmMainPinChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Confirm main PIN"
                className="h-12 text-center text-lg tracking-wider"
              />
            </div>
          </div>

          {/* Duress PIN Section */}
          <div className="space-y-4 border-t border-border pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Duress PIN (Optional)</label>
              <Input
                type="password"
                value={duressPin}
                onChange={(e) => onDuressPinChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Enter 4-8 digits (optional)"
                className="h-12 text-center text-lg tracking-wider"
              />
            </div>

            {duressPin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Duress PIN</label>
                <Input
                  type="password"
                  value={confirmDuressPin}
                  onChange={(e) => onConfirmDuressPinChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Confirm duress PIN"
                  className="h-12 text-center text-lg tracking-wider"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Duress PIN shows a fake dashboard for emergency situations
            </p>
          </div>
        </div>

        <Button
          onClick={onComplete}
          disabled={!canProceedSetup}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
        >
          Complete Setup
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}