import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield, Play, RefreshCw, FileText, Pause, Globe, Map, Clock, Zap, Activity, ArrowLeft, ChevronRight, Settings, MoreHorizontal, Wifi, WifiOff } from "lucide-react";
import { useVpnMonitor } from "../hooks/useVpnMonitor";

export interface ScanConfig {
  networkMonitoringDuration: number;
  skipNetworkMonitoring: boolean;
}

interface MainDashboardProps {
  onNavigate: (screen: "scan-progress" | "scan-report" | "network-map" | "home" | "settings") => void;
  onStartScan?: (config: ScanConfig) => void;
}

export function MainDashboard({ onNavigate, onStartScan }: MainDashboardProps) {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showScanConfig, setShowScanConfig] = useState(false);
  const [scanDuration, setScanDuration] = useState(10000); // Default 10 seconds

  // Use VPN monitor hook for real-time data
  const {
    isConnected,
    isConnecting,
    stats,
    recentDnsEvents,
    threats,
    startVpn,
    stopVpn,
    toggleVpn,
    isUsingNative,
  } = useVpnMonitor();

  const handleStartScan = () => {
    setShowScanConfig(true);
  };

  const handleConfirmScan = () => {
    setShowScanConfig(false);
    setIsScanning(true);
    const config: ScanConfig = {
      networkMonitoringDuration: scanDuration,
      skipNetworkMonitoring: false,
    };
    onStartScan?.(config);
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
                <Shield className={`w-4 h-4 md:w-5 md:h-5 ${stats.threatsDetected > 0 ? 'text-destructive' : 'text-green-500'}`} />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Threats Detected</p>
                  <p className="text-sm md:text-lg font-medium">{stats.threatsDetected} today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                {isConnected ? (
                  <Wifi className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Network Monitor</p>
                  <p className="text-sm md:text-lg font-medium">{isConnected ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">DNS Queries</p>
                  <p className="text-sm md:text-lg font-medium">{stats.dnsQueriesTotal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow duration-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Globe className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Connections</p>
                  <p className="text-sm md:text-lg font-medium">{stats.totalConnections}</p>
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
                <Shield className={`w-4 h-4 md:w-5 md:h-5 ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
                Network Monitor
                <Badge
                  variant="secondary"
                  className={`ml-auto ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  {isConnecting ? 'Starting...' : isConnected ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">DNS Interception</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{isConnected ? 'Running' : 'Stopped'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">Threat Detection</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{isConnected ? 'Active' : 'Stopped'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Mode: {isUsingNative ? 'Native VPN' : 'Web Simulation'}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{isUsingNative ? 'Android' : 'Browser'}</Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <Button
                  onClick={toggleVpn}
                  disabled={isConnecting}
                  variant={isConnected ? "outline" : "default"}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>Starting...</>
                  ) : isConnected ? (
                    <><Pause className="w-4 h-4 mr-2" />Stop Monitoring</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" />Start Monitoring</>
                  )}
                </Button>
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
              Recent DNS Activity
              <Badge variant="outline" className={`text-xs ${isConnected ? 'animate-pulse' : ''}`}>
                {isConnected ? 'Live' : 'Paused'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentDnsEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No DNS activity yet</p>
                  <p className="text-xs">{isConnected ? 'Waiting for network traffic...' : 'Start monitoring to see activity'}</p>
                </div>
              ) : (
                recentDnsEvents.slice(0, 10).map((event, index) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between py-2 px-2 -mx-2 rounded transition-colors duration-200 ${
                      event.isThreat ? 'bg-red-50 dark:bg-red-950/30' : 'hover:bg-accent/30'
                    } ${index < recentDnsEvents.length - 1 ? 'border-b border-border/50' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        event.isThreat ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-sm truncate block ${event.isThreat ? 'text-red-600 font-medium' : ''}`}>
                          {event.domain}
                        </span>
                        {event.isThreat && event.threatInfo && (
                          <span className="text-xs text-red-500">
                            {event.threatInfo.category} - {event.threatInfo.severity}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{event.queryType}</Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {threats.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 font-medium">
                    {threats.length} threat(s) detected
                  </span>
                  <Button variant="link" size="sm" className="text-red-600 h-auto p-0">
                    View Details
                  </Button>
                </div>
              </div>
            )}
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

      {/* Scan Configuration Dialog */}
      <Dialog open={showScanConfig} onOpenChange={setShowScanConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Scan Configuration
            </DialogTitle>
            <DialogDescription>
              Select how long to monitor network traffic during the scan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label>Network Monitoring Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={scanDuration === 3000 ? "default" : "outline"}
                  onClick={() => setScanDuration(3000)}
                  className="flex flex-col h-auto py-3"
                >
                  <Zap className="w-4 h-4 mb-1" />
                  <span className="text-sm font-medium">Quick</span>
                  <span className="text-xs opacity-70">3 sec</span>
                </Button>
                <Button
                  variant={scanDuration === 10000 ? "default" : "outline"}
                  onClick={() => setScanDuration(10000)}
                  className="flex flex-col h-auto py-3"
                >
                  <Shield className="w-4 h-4 mb-1" />
                  <span className="text-sm font-medium">Standard</span>
                  <span className="text-xs opacity-70">10 sec</span>
                </Button>
                <Button
                  variant={scanDuration === 30000 ? "default" : "outline"}
                  onClick={() => setScanDuration(30000)}
                  className="flex flex-col h-auto py-3"
                >
                  <Activity className="w-4 h-4 mb-1" />
                  <span className="text-sm font-medium">Thorough</span>
                  <span className="text-xs opacity-70">30 sec</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Longer monitoring captures more network activity for better threat detection.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScanConfig(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmScan}>
              <Play className="w-4 h-4 mr-2" />
              Start Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}