import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Settings, ChevronRight } from "lucide-react";

interface PermissionsScreenProps {
  permissions: {
    systemUsage: boolean;
    notifications: boolean;
  };
  onPermissionChange: (permissions: { systemUsage: boolean; notifications: boolean }) => void;
  onBack: () => void;
  onContinue: () => void;
  canProceed: boolean;
}

export function PermissionsScreen({
  permissions,
  onPermissionChange,
  onBack,
  onContinue,
  canProceed,
}: PermissionsScreenProps) {
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
        <h1 className="font-medium text-foreground">Setup</h1>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-8 flex flex-col">
        <div className="flex-1 flex flex-col items-center text-center space-y-8">
          <Settings className="w-16 h-16 text-primary" />

          <div className="space-y-2 max-w-sm">
            <h2 className="text-2xl font-medium text-foreground">
              Permissions Required
            </h2>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Checkbox
                checked={permissions.systemUsage}
                onCheckedChange={(checked) =>
                  onPermissionChange({
                    ...permissions,
                    systemUsage: !!checked,
                  })
                }
                className="mt-0.5"
              />
              <div className="flex-1 text-left">
                <p className="text-sm">
                  VPN Configuration Profile
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Checkbox
                checked={permissions.notifications}
                onCheckedChange={(checked) =>
                  onPermissionChange({
                    ...permissions,
                    notifications: !!checked,
                  })
                }
                className="mt-0.5"
              />
              <div className="flex-1 text-left">
                <p className="text-sm">
                  Notifications (optional)
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={onContinue}
          disabled={!canProceed}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
        >
          Grant & Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}