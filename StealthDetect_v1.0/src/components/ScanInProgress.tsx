import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Radar, Pause, Square, Minimize2, CheckCircle, Circle, Clock, AlertTriangle, Wifi, Cloud } from "lucide-react";
import { systemScanner, type ScanProgress, type ScanOptions } from "../utils/scanner";
import type { ScanConfig } from "./MainDashboard";
import { db } from "../utils/database";

interface ScanInProgressProps {
  onNavigate: (screen: "main-dashboard" | "scan-report" | "home") => void;
  onScanComplete?: (scanId: string) => void;
  scanConfig?: ScanConfig;
}

export function ScanInProgress({ onNavigate, onScanComplete, scanConfig }: ScanInProgressProps) {
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    phase: 'initializing',
    progress: 0,
    currentTask: 'Initializing scan...',
    stats: {
      filesScanned: 0,
      networksChecked: 0,
      packagesScanned: 0,
      threatsFound: 0,
      networkThreats: 0,
      stalkerwareDetected: 0,
    },
    logEntries: [],
    networkMonitoring: false,
    cloudSyncEnabled: false,
  });

  const phases = [
    { key: 'initializing', label: 'Initializing', icon: '🔧' },
    { key: 'syncing_iocs', label: 'Syncing Threat Intel', icon: '☁️' },
    { key: 'scanning_files', label: 'Scanning Files', icon: '📁' },
    { key: 'monitoring_network', label: 'Network Monitoring', icon: '🌐' },
    { key: 'checking_network', label: 'Network Analysis', icon: '🔍' },
    { key: 'analyzing_packages', label: 'Detecting Stalkerware', icon: '🔎' },
    { key: 'matching_iocs', label: 'Matching IoCs', icon: '🔬' },
    { key: 'generating_report', label: 'Generating Report', icon: '📊' },
  ];

  useEffect(() => {
    // Start the scan
    let mounted = true;

    const runScan = async () => {
      try {
        // Convert ScanConfig to ScanOptions
        const scanOptions: ScanOptions = {
          networkMonitoringDuration: scanConfig?.networkMonitoringDuration ?? 10000,
          skipNetworkMonitoring: scanConfig?.skipNetworkMonitoring ?? false,
        };

        const result = await systemScanner.startScan((progress) => {
          if (mounted) {
            setScanProgress(progress);
          }
        }, scanOptions);

        // Scan completed
        if (mounted) {
          onScanComplete?.(result.id);
          
          // Navigate to report after a short delay
          setTimeout(() => {
            if (mounted) {
              onNavigate("scan-report");
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Scan failed:', error);
        alert('Scan failed. Please try again.');
        onNavigate("main-dashboard");
      }
    };

    runScan();

    return () => {
      mounted = false;
    };
  }, [onNavigate, onScanComplete, scanConfig]);

  const handleStopAndView = () => {
    systemScanner.stopScan();
    onNavigate("scan-report");
  };

  const handleMinimize = () => {
    onNavigate("main-dashboard");
  };

  const getPhaseIcon = (phaseKey: string) => {
    const currentPhaseIndex = phases.findIndex(p => p.key === scanProgress.phase);
    const thisPhaseIndex = phases.findIndex(p => p.key === phaseKey);

    if (thisPhaseIndex < currentPhaseIndex) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (thisPhaseIndex === currentPhaseIndex && scanProgress.progress < 100) {
      return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    } else {
      return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPhaseStatus = (phaseKey: string) => {
    const currentPhaseIndex = phases.findIndex(p => p.key === scanProgress.phase);
    const thisPhaseIndex = phases.findIndex(p => p.key === phaseKey);

    if (thisPhaseIndex < currentPhaseIndex) {
      return <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">Done</Badge>;
    } else if (thisPhaseIndex === currentPhaseIndex && scanProgress.progress < 100) {
      return <Badge variant="secondary" className="ml-auto">Running</Badge>;
    }
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Radar className="w-6 h-6 md:w-8 md:h-8 text-primary animate-spin" />
          <h1 className="text-2xl md:text-3xl font-medium text-foreground">
            {scanProgress.phase === 'completed' ? 'Scan Complete' : 'Scanning System...'}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {scanProgress.currentTask}
        </p>
      </div>

      {/* Progress Card */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center justify-between">
            <span>Scan Progress</span>
            <div className="flex gap-2">
              {scanProgress.cloudSyncEnabled && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Cloud className="w-3 h-3 mr-1" />
                  Cloud Sync
                </Badge>
              )}
              {scanProgress.networkMonitoring && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 animate-pulse">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live Monitoring
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={scanProgress.progress} className="h-2 md:h-3" />
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-center">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Files</p>
                <p className="text-lg md:text-xl font-medium">{scanProgress.stats.filesScanned}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Networks</p>
                <p className="text-lg md:text-xl font-medium">{scanProgress.stats.networksChecked}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Apps</p>
                <p className="text-lg md:text-xl font-medium">{scanProgress.stats.packagesScanned}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Net Threats</p>
                <p className={`text-lg md:text-xl font-medium ${
                  scanProgress.stats.networkThreats > 0 ? 'text-red-600' : ''
                }`}>
                  {scanProgress.stats.networkThreats}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Stalkerware</p>
                <p className={`text-lg md:text-xl font-medium ${
                  scanProgress.stats.stalkerwareDetected > 0 ? 'text-red-600' : ''
                }`}>
                  {scanProgress.stats.stalkerwareDetected}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                <p className={`text-lg md:text-xl font-medium ${
                  scanProgress.stats.threatsFound > 0 ? 'text-red-600' : ''
                }`}>
                  {scanProgress.stats.threatsFound}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {Math.round(scanProgress.progress)}% Complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Scan Phases Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Scan Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {phases.map((phase) => (
                <div key={phase.key} className="flex items-center gap-3">
                  {getPhaseIcon(phase.key)}
                  <span className={`text-sm ${
                    phase.key === scanProgress.phase ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {phase.icon} {phase.label}
                  </span>
                  {getPhaseStatus(phase.key)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detection Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Threat Detection Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Stalkerware Apps</span>
                <Badge variant={scanProgress.stats.stalkerwareDetected > 0 ? "destructive" : "secondary"}>
                  {scanProgress.stats.stalkerwareDetected}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Network Threats</span>
                <Badge variant={scanProgress.stats.networkThreats > 0 ? "destructive" : "secondary"}>
                  {scanProgress.stats.networkThreats}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">File-Based Threats</span>
                <Badge variant={scanProgress.stats.threatsFound > 0 ? "destructive" : "secondary"}>
                  {scanProgress.phase === 'matching_iocs' || scanProgress.phase === 'generating_report' || scanProgress.phase === 'completed'
                    ? Math.max(0, scanProgress.stats.threatsFound - scanProgress.stats.networkThreats - scanProgress.stats.stalkerwareDetected)
                    : '—'}
                </Badge>
              </div>
              <div className="p-3 bg-muted rounded-lg mt-2">
                <p className="text-xs text-muted-foreground text-center">
                  {scanProgress.stats.threatsFound > 0 
                    ? '⚠️ Threats detected! Review report carefully.'
                    : scanProgress.progress >= 100
                    ? '✅ No threats detected. System appears clean.'
                    : 'Scanning in progress...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Log Card */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Scan Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32 md:h-48 w-full">
            <div className="space-y-1 font-mono text-xs">
              {scanProgress.logEntries.length === 0 ? (
                <p className="text-muted-foreground">Initializing scanner...</p>
              ) : (
                scanProgress.logEntries.slice(-15).map((entry, index) => (
                  <div key={index} className={`${
                    entry.includes('🚨') ? 'text-red-600 font-medium' :
                    entry.includes('⚠️') || entry.includes('⚠') ? 'text-orange-600' : 
                    entry.includes('✓') ? 'text-green-600' : 
                    entry.includes('✅') ? 'text-green-700 font-medium' :
                    entry.includes('☁️') ? 'text-blue-600' :
                    entry.includes('🔍') || entry.includes('🌐') ? 'text-purple-600' :
                    'text-foreground'
                  }`}>
                    {entry}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
        <Button 
          onClick={handleStopAndView} 
          className="flex-1 bg-primary text-primary-foreground"
          disabled={scanProgress.progress < 10}
        >
          <Square className="w-4 h-4 mr-2" />
          {scanProgress.progress >= 100 ? 'View Report' : 'Stop & View Report'}
        </Button>
        <Button variant="outline" onClick={handleMinimize} className="flex-1 sm:flex-none">
          <Minimize2 className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Powered by SpyGuard Database • Real-time Network Monitoring • Cloud IoC Sync
        </p>
      </div>
    </div>
  );
}
