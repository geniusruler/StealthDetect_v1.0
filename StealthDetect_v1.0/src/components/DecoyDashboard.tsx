import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";
import {
  HardDrive,
  Battery,
  Wifi,
  Trash2,
  Lightbulb,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

interface DecoyDashboardProps {
  onNavigate?: (screen: string) => void;
}

export function DecoyDashboard({ onNavigate }: DecoyDashboardProps) {
  const showBatteryTips = () => {
    toast("💡 Battery Tips", {
      description: "• Enable battery optimization\n• Reduce screen brightness\n• Limit background app refresh",
      duration: 4000,
    });
  };

  const showCleanupComplete = () => {
    toast("✅ Cleanup completed", {
      description: "Temporary files removed successfully",
      duration: 3000,
    });
  };

  const showNetworkCheck = () => {
    toast("🌐 Network Check", {
      description: "All connections are stable",
      duration: 3000,
    });
  };

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 h-14">
        <button 
          onClick={() => onNavigate?.("home")}
          className="text-muted-foreground"
        >
          ← Exit
        </button>
        <h1 className="font-medium text-foreground">System Utility</h1>
        <span className="text-sm text-muted-foreground">v2.1</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Top Stat Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Storage Used</span>
            </div>
            <div className="text-xl font-medium text-card-foreground">37%</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Battery className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Battery Health</span>
            </div>
            <div className="text-xl font-medium text-card-foreground">Good</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Network Uptime</span>
            </div>
            <div className="text-xl font-medium text-card-foreground">Stable</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Temp Files</span>
            </div>
            <div className="text-xl font-medium text-card-foreground">132 MB</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={showCleanupComplete}
              variant="outline" 
              className="w-full h-11 justify-start rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Run Cleanup
            </Button>
            
            <Button 
              onClick={showBatteryTips}
              variant="outline" 
              className="w-full h-11 justify-start rounded-lg"
            >
              <Lightbulb className="w-4 h-4 mr-3" />
              Battery Tips
            </Button>
            
            <Button 
              onClick={showNetworkCheck}
              variant="outline" 
              className="w-full h-11 justify-start rounded-lg"
            >
              <Wifi className="w-4 h-4 mr-3" />
              Network Check
            </Button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Recent Activity</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm text-foreground">System optimization completed</p>
                <p className="text-xs text-muted-foreground">2 min ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Battery className="w-4 h-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Battery guidance refreshed</p>
                <p className="text-xs text-muted-foreground">12 min ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <HardDrive className="w-4 h-4 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Storage check finished</p>
                <p className="text-xs text-muted-foreground">Today, 10:04</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium text-card-foreground">Performance Overview</h3>
          </div>
          
          {/* Simple sparkline placeholder */}
          <div className="flex items-end gap-1 h-8 mb-2">
            {[3, 5, 2, 8, 6, 7, 4, 9, 5, 6, 8, 4].map((height, i) => (
              <div 
                key={i}
                className="bg-primary/30 rounded-sm flex-1" 
                style={{ height: `${height * 3}px` }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">System running optimally</p>
        </div>

        {/* Recommendations */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Lightbulb className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-medium text-card-foreground">Recommendations</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">Reduce background refresh</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">Lower screen brightness</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">Remove unused apps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Last check: 10:04 • Status: Normal
        </p>
      </div>
    </div>
  );
}