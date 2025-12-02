import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Play, RefreshCw, FileText, Pause, Globe, Map, Clock, Zap, Activity, ArrowLeft, ChevronRight, Settings, MoreHorizontal } from "lucide-react";

interface MainDashboardProps {
  onNavigate: (screen: "scan-progress" | "scan-report" | "network-map" | "home" | "settings") => void;
}

export function MainDashboard({ onNavigate }: MainDashboardProps) {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    // Simulate scan start delay
    setTimeout(() => {
      onNavigate("scan-progress");
    }, 500);
  };

  const handleViewReports = () => {
    onNavigate("scan-report");
  };

  const handleShowNetworkMap = () => {
    onNavigate("network-map");
  };

  const handleWhitelistDomain = () => {
    if (domain.trim()) {
      // Handle whitelisting logic here
      setDomain("");
    }
  };

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("home")}
          className="text-foreground hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-medium text-foreground">Dashboard</h1>
        <Button variant="ghost" size="sm" className="p-2" onClick={() => onNavigate("settings")}>
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header - Desktop Only */}
        <div className="mb-6 md:mb-8 hidden lg:block">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-medium text-foreground">System Guard</h1>
          </div>
          <p className="text-muted-foreground">Device is protected</p>
        </div>

        {/* Status Banner - Mobile */}
        <div className="lg:hidden mb-6">
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">System Status</p>
                  <p className="text-sm text-green-600">Protected & Monitoring</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Top Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Threats Detected</p>
                  <p className="text-sm md:text-lg font-medium">0 today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Network Status</p>
                  <p className="text-sm md:text-lg font-medium">Protected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Last Scan</p>
                  <p className="text-sm md:text-lg font-medium">10:04</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Auto-Defense</p>
                  <p className="text-sm md:text-lg font-medium">On</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary CTA Row */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
          <Button 
            id="startScanBtn"
            onClick={handleStartScan}
            disabled={isScanning}
            className={`flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl active:scale-[0.98] transition-all duration-200 ${isScanning ? 'opacity-75' : ''}`}
          >
            <Play className="w-4 h-4 mr-2" />
            {isScanning ? "Starting Scan..." : "Start Deep Scan"}
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
          
          <div className="flex gap-3 sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none h-12 rounded-xl hover:bg-accent active:scale-[0.98] transition-all duration-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Update Rules</span>
              <span className="sm:hidden">Update</span>
            </Button>
            <Button variant="outline" onClick={handleViewReports} className="flex-1 sm:flex-none h-12 rounded-xl hover:bg-accent active:scale-[0.98] transition-all duration-200">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">View Reports</span>
              <span className="sm:hidden">Reports</span>
            </Button>
          </div>
        </div>

        {/* Security Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Live Protection Card */}
          <Card className="lg:col-span-2 hover:shadow-sm transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                Live Protection
                <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                  Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Firewall protection</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Real-time DNS filter</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Background monitor</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Running</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center justify-between">
                Quick Actions
                <Button variant="ghost" size="sm" className="p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start hover:bg-accent active:scale-[0.98] transition-all duration-200">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Protection
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Pause Protection?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will temporarily disable real-time monitoring. Your device will be vulnerable until protection is resumed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Pause</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start hover:bg-accent active:scale-[0.98] transition-all duration-200">
                    <Globe className="w-4 h-4 mr-2" />
                    Whitelist Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Whitelist Domain</DialogTitle>
                    <DialogDescription>
                      Add a domain to the whitelist to bypass filtering.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="domain">Domain</Label>
                      <Input
                        id="domain"
                        placeholder="example.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDomain("")}>Cancel</Button>
                    <Button onClick={handleWhitelistDomain}>Add to Whitelist</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" className="w-full justify-start hover:bg-accent active:scale-[0.98] transition-all duration-200" onClick={handleShowNetworkMap}>
                <Map className="w-4 h-4 mr-2" />
                Network Map
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed Card */}
        <Card className="mb-6 md:mb-8 hover:shadow-sm transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center justify-between">
              Recent Activity
              <Badge variant="outline" className="text-xs">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/50 hover:bg-accent/30 rounded px-2 -mx-2 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Policy rules refreshed</span>
                </div>
                <span className="text-xs text-muted-foreground">2 min ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50 hover:bg-accent/30 rounded px-2 -mx-2 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Background monitor started</span>
                </div>
                <span className="text-xs text-muted-foreground">12 min ago</span>
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-accent/30 rounded px-2 -mx-2 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Baseline scan completed</span>
                </div>
                <span className="text-xs text-muted-foreground">Today, 10:04</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Mobile View Button - Desktop Only */}
        <div className="mb-6 md:mb-8 hidden lg:block">
          <Button variant="outline" onClick={() => onNavigate("home")} className="w-full sm:w-auto hover:bg-accent active:scale-[0.98] transition-all duration-200">
            ← Back to Home
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Status: <Badge variant="secondary" className="bg-green-100 text-green-800">Secure</Badge> • Next auto-scan: 14:00
          </p>
        </div>
      </div>
    </div>
  );
}