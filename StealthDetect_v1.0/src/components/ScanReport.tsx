import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { 
  FileDown, 
  ArrowLeft, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Home, 
  BarChart3, 
  Menu, 
  X,
  Bug,
  Wifi,
  Package,
  FileCheck,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { db, type ScanResult, type ThreatDetection } from "../utils/database";

interface ScanReportProps {
  onNavigate: (screen: "main-dashboard" | "home") => void;
}

export function ScanReport({ onNavigate }: ScanReportProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLatestScan = async () => {
      try {
        const latest = await db.getLatestScan();
        setScanResult(latest);
      } catch (error) {
        console.error('Error loading scan result:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLatestScan();
  }, []);

  const handleBackToDashboard = () => {
    onNavigate("main-dashboard");
  };

  const handleExport = () => {
    if (!scanResult) return;

    // Create exportable JSON
    const exportData = {
      scanId: scanResult.id,
      timestamp: scanResult.timestamp,
      duration: scanResult.duration,
      threats: scanResult.threats,
      stats: scanResult.stats,
    };

    // Create downloadable file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `stealthdetect-scan-${scanResult.id}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-red-600 text-white hover:bg-red-700">{severity}</Badge>;
      case 'high':
        return <Badge variant="destructive">{severity}</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{severity}</Badge>;
      case 'low':
        return <Badge variant="secondary">{severity}</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'file_hash':
        return <FileCheck className="w-4 h-4" />;
      case 'network':
        return <Wifi className="w-4 h-4" />;
      case 'package':
        return <Package className="w-4 h-4" />;
      default:
        return <Bug className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading scan report...</p>
        </div>
      </div>
    );
  }

  if (!scanResult) {
    return (
      <div className="w-full max-w-6xl mx-auto min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No scan results available</p>
          <Button onClick={handleBackToDashboard}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const criticalThreats = scanResult.threats.filter(t => t.severity === 'critical');
  const highThreats = scanResult.threats.filter(t => t.severity === 'high');
  const stalkerwareThreats = scanResult.threats.filter(t => t.category.includes('stalkerware'));
  const fileThreats = scanResult.threats.filter(t => t.type === 'file_hash');
  const networkThreats = scanResult.threats.filter(t => t.type === 'network');
  const packageThreats = scanResult.threats.filter(t => t.type === 'package');

  return (
    <div className="w-full max-w-6xl mx-auto min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield className={`w-6 h-6 md:w-8 md:h-8 ${
              scanResult.threats.length === 0 ? 'text-green-600' : 'text-orange-600'
            }`} />
            <div>
              <h1 className="text-2xl md:text-3xl font-medium text-foreground">
                Scan Report
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date(scanResult.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                <p className={`text-xl md:text-2xl font-medium ${
                  scanResult.threats.length > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {scanResult.threats.length}
                </p>
              </div>
              <AlertTriangle className={`w-6 h-6 md:w-8 md:h-8 ${
                scanResult.threats.length > 0 ? 'text-red-600' : 'text-muted-foreground'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Critical</p>
                <p className="text-xl md:text-2xl font-medium">
                  {criticalThreats.length + highThreats.length}
                </p>
              </div>
              <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-red-700">Stalkerware</p>
                <p className="text-xl md:text-2xl font-medium text-red-800">
                  {stalkerwareThreats.length}
                </p>
              </div>
              <Bug className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-purple-700">Network</p>
                <p className="text-xl md:text-2xl font-medium text-purple-800">
                  {networkThreats.length}
                </p>
              </div>
              <Wifi className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-orange-700">Files</p>
                <p className="text-xl md:text-2xl font-medium text-orange-800">
                  {fileThreats.length}
                </p>
              </div>
              <FileCheck className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Duration</p>
                <p className="text-xl md:text-2xl font-medium">
                  {formatDuration(scanResult.duration)}
                </p>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {scanResult.threats.length === 0 ? (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900 mb-1">
                  No Threats Detected
                </h3>
                <p className="text-sm text-green-800">
                  Your system appears clean. No indicators of compromise were found during the scan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900 mb-1">
                  {scanResult.threats.length} Threat{scanResult.threats.length > 1 ? 's' : ''} Detected
                </h3>
                <p className="text-sm text-red-800">
                  {stalkerwareThreats.length > 0 
                    ? `${stalkerwareThreats.length} stalkerware app(s) detected. Immediate action recommended.`
                    : 'Suspicious activity detected. Review the findings below and take appropriate action.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Threats Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Threat Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanResult.threats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
              <p>No threats detected</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({scanResult.threats.length})
                </TabsTrigger>
                <TabsTrigger value="files">
                  Files ({fileThreats.length})
                </TabsTrigger>
                <TabsTrigger value="network">
                  Network ({networkThreats.length})
                </TabsTrigger>
                <TabsTrigger value="packages">
                  Apps ({packageThreats.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Threat</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scanResult.threats.map((threat) => (
                        <TableRow key={threat.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getThreatIcon(threat.type)}
                              <span className="text-xs capitalize">
                                {threat.type.replace('_', ' ')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {threat.name}
                          </TableCell>
                          <TableCell>
                            {getSeverityBadge(threat.severity)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {threat.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {threat.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <ScrollArea className="h-[400px]">
                  {fileThreats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No malicious files detected
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fileThreats.map((threat) => (
                        <Card key={threat.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-red-600" />
                                <span className="font-medium">{threat.name}</span>
                              </div>
                              {getSeverityBadge(threat.severity)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {threat.description}
                            </p>
                            <div className="text-xs space-y-1">
                              <p><span className="font-medium">Hash:</span> {threat.evidence.fileHash}</p>
                              <p><span className="font-medium">Source:</span> {threat.evidence.source}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="network" className="mt-4">
                <ScrollArea className="h-[400px]">
                  {networkThreats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No suspicious network connections detected
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {networkThreats.map((threat) => (
                        <Card key={threat.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Wifi className="w-5 h-5 text-orange-600" />
                                <span className="font-medium">{threat.name}</span>
                              </div>
                              {getSeverityBadge(threat.severity)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {threat.description}
                            </p>
                            <div className="text-xs space-y-1">
                              <p><span className="font-medium">Domain:</span> {threat.evidence.domain}</p>
                              <p><span className="font-medium">URL:</span> {threat.evidence.url}</p>
                              <p><span className="font-medium">Source:</span> {threat.evidence.source}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="packages" className="mt-4">
                <ScrollArea className="h-[400px]">
                  {packageThreats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No stalkerware or spyware apps detected
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {packageThreats.map((threat) => (
                        <Card key={threat.id} className="border-red-200">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-red-600" />
                                <span className="font-medium">{threat.name}</span>
                              </div>
                              {getSeverityBadge(threat.severity)}
                            </div>
                            <p className="text-sm text-red-800 bg-red-50 p-2 rounded mb-2">
                              <strong>⚠️ {threat.category.toUpperCase()} DETECTED</strong>
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              {threat.description}
                            </p>
                            <div className="text-xs space-y-1">
                              <p><span className="font-medium">Package:</span> {threat.evidence.packageName}</p>
                              {threat.evidence.version && (
                                <p><span className="font-medium">Version:</span> {threat.evidence.version}</p>
                              )}
                              <p><span className="font-medium">Platform:</span> {threat.evidence.platform}</p>
                              <p><span className="font-medium">Source:</span> {threat.evidence.source}</p>
                              {threat.evidence.permissions && (
                                <p><span className="font-medium">Dangerous Permissions:</span> {threat.evidence.permissions.slice(0, 3).join(', ')}</p>
                              )}
                            </div>
                            <div className="mt-3 p-2 bg-orange-50 rounded">
                              <p className="text-xs text-orange-900 font-medium">
                                🔒 Recommended Action: Uninstall this application immediately
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Scan Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Scan Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Files Scanned</p>
              <p className="text-xl font-medium">{scanResult.stats.filesScanned}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Networks Checked</p>
              <p className="text-xl font-medium">{scanResult.stats.networksChecked}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Packages Analyzed</p>
              <p className="text-xl font-medium">{scanResult.stats.packagesScanned}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Threats Found</p>
              <p className={`text-xl font-medium ${
                scanResult.stats.threatsFound > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {scanResult.stats.threatsFound}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Button onClick={handleBackToDashboard} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={handleExport} className="flex-1">
          <FileDown className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Scan ID: {scanResult.id} • Powered by SpyGuard IoC Database
        </p>
      </div>
    </div>
  );
}
