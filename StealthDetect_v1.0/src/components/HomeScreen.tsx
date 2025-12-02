import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Radar,
  Play,
  Clock,
  AlertCircle,
  MapPin,
  Monitor,
  ChevronRight,
  Wifi,
  Shield,
  Settings,
} from "lucide-react";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [deviceStatus] = useState("Protected");
  const [lastScanTime] = useState("Never");
  const [activeThreats] = useState(0);

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 sm:px-5 py-4 h-14 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-medium text-foreground">StealthDetect</h1>
            <p className="text-xs text-muted-foreground">v0.1 Beta</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-2" onClick={() => onNavigate("settings")}>
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Status Banner */}
      <div className="px-4 sm:px-5 py-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Device Status</p>
              <p className="text-sm text-green-600">{deviceStatus}</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Secure
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-5 py-2 space-y-6 overflow-y-auto">
        {/* Primary System Scan Card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Radar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium text-card-foreground mb-1">Quick Scan</h2>
              <p className="text-sm text-muted-foreground">
                Analyze your device for stalkerware and security threats
              </p>
            </div>
          </div>
          <Button
            onClick={() => onNavigate("main-dashboard")}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all duration-200"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Security Scan
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Last Scan */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-card-foreground">Last Scan</h3>
                <p className="text-sm text-muted-foreground">{lastScanTime}</p>
              </div>
            </div>
          </div>

          {/* Active Threats */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-card-foreground">Threats</h3>
                <p className="text-sm text-muted-foreground">{activeThreats} active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground px-1">Features</h3>
          <div className="grid grid-cols-1 gap-3">
            {/* Network Monitoring */}
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all duration-200 active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Wifi className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-card-foreground">Network Monitoring</h3>
                  <p className="text-xs text-muted-foreground">Real-time traffic analysis</p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Active
                </Badge>
              </div>
            </div>

            {/* Privacy Mode */}
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all duration-200 active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MapPin className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-card-foreground">Privacy Mode</h3>
                  <p className="text-xs text-muted-foreground">Local-only processing</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Enabled
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 sm:px-5 py-4 space-y-3 border-t border-border/50">
        <Button
          onClick={() => onNavigate("dashboard-pin")}
          variant="outline"
          className="w-full h-12 rounded-xl border-2 hover:bg-accent active:scale-[0.98] transition-all duration-200"
        >
          <Monitor className="w-4 h-4 mr-2" />
          Full Dashboard
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onNavigate("faq")}
            variant="outline"
            className="h-10 rounded-xl text-sm hover:bg-accent active:scale-[0.98] transition-all duration-200"
          >
            FAQ
          </Button>
          <Button
            onClick={() => onNavigate("decoy")}
            variant="outline"
            className="h-10 rounded-xl text-sm hover:bg-accent active:scale-[0.98] transition-all duration-200"
          >
            Test Decoy
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-5 py-3 text-center border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Identify • Report • Secure
        </p>
      </div>
    </div>
  );
}