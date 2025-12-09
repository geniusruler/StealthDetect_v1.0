import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { ArrowLeft, Settings, Shield, Bell, Lock, Database, Smartphone } from "lucide-react";
import { SOSSettingsCard } from "./sos";

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  return (
    <div className="w-full max-w-[800px] mx-auto min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("home")}
          className="text-foreground hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-medium text-foreground">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">PIN Protection</p>
                <p className="text-sm text-muted-foreground">Require PIN on app launch</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Biometric Auth</p>
                <p className="text-sm text-muted-foreground">Use fingerprint or Face ID</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Lock</p>
                <p className="text-sm text-muted-foreground">Lock after 5 minutes</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Emergency SOS Settings */}
        <SOSSettingsCard />

        {/* Scanning Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="w-5 h-5 text-primary" />
              Scanning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Scan</p>
                <p className="text-sm text-muted-foreground">Daily automatic scans</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Deep Scan Mode</p>
                <p className="text-sm text-muted-foreground">More thorough but slower</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Network Monitoring</p>
                <p className="text-sm text-muted-foreground">Real-time traffic analysis</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Threat Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when threats detected</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Scan Complete</p>
                <p className="text-sm text-muted-foreground">Notify when scans finish</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Silent Mode</p>
                <p className="text-sm text-muted-foreground">Only show critical alerts</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-5 h-5 text-primary" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Local Processing</p>
                <p className="text-sm text-muted-foreground">All data stays on device</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">Anonymous usage statistics</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-primary" />
              Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Clear Scan History
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Export Data
            </Button>
            <Button variant="destructive" className="w-full justify-start">
              Reset All Settings
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>System Utility v2.1.0</p>
          <p>Device optimization & maintenance</p>
        </div>
      </div>
    </div>
  );
}
