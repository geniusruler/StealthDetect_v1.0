import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, Globe, Wifi, Shield, AlertTriangle, CheckCircle2, Router } from "lucide-react";

interface NetworkMapScreenProps {
  onNavigate: (screen: string) => void;
}

export function NetworkMapScreen({ onNavigate }: NetworkMapScreenProps) {
  return (
    <div className="w-full max-w-[1000px] mx-auto min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("dashboard")}
          className="text-foreground hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-medium text-foreground">Network Map</h1>
        </div>
        <Badge variant="secondary" className="ml-auto">Live</Badge>
      </div>

      <div className="p-4 space-y-6">
        {/* Network Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connections</p>
                  <p className="text-2xl font-medium">24</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Suspicious</p>
                  <p className="text-2xl font-medium">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Wifi className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Usage</p>
                  <p className="text-2xl font-medium">142 MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Visualization Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Router className="w-5 h-5" />
              Network Topology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-8 flex items-center justify-center min-h-[300px] border-2 border-dashed border-border">
              <div className="text-center space-y-3">
                <Globe className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">Network visualization coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Interactive network topology map will display here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Connection 1 */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">api.example.com</p>
                    <p className="text-sm text-muted-foreground">HTTPS • 443</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Secure
                </Badge>
              </div>

              {/* Connection 2 */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">cdn.cloudflare.com</p>
                    <p className="text-sm text-muted-foreground">HTTPS • 443</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Secure
                </Badge>
              </div>

              {/* Connection 3 */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded">
                    <Wifi className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">8.8.8.8</p>
                    <p className="text-sm text-muted-foreground">DNS • 53</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Google DNS
                </Badge>
              </div>

              {/* Connection 4 */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">www.google.com</p>
                    <p className="text-sm text-muted-foreground">HTTPS • 443</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Secure
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocked Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Blocked Connections (Last 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No suspicious connections blocked</p>
              <p className="text-sm mt-1">Your network traffic looks clean</p>
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <div className="flex gap-3">
            <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">About Network Monitoring</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Network monitoring uses VPN-based traffic analysis to detect connections to 
                known malicious servers. All processing is done locally on your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
