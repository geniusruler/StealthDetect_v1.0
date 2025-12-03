package com.stealthdetect.appscanner;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

/**
 * Native Android App Scanner Plugin
 * Lists installed applications and their permissions for stalkerware detection
 */
@CapacitorPlugin(name = "AppScanner")
public class AppScannerPlugin extends Plugin {

    private static final String TAG = "AppScannerPlugin";

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        Log.d(TAG, "getInstalledApps called");

        try {
            PackageManager pm = getContext().getPackageManager();
            List<PackageInfo> packages = pm.getInstalledPackages(PackageManager.GET_PERMISSIONS);

            JSArray appsArray = new JSArray();
            int systemApps = 0;
            int userApps = 0;

            for (PackageInfo packageInfo : packages) {
                JSObject appObj = new JSObject();

                ApplicationInfo appInfo = packageInfo.applicationInfo;
                boolean isSystemApp = (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;

                appObj.put("packageName", packageInfo.packageName);
                appObj.put("appName", pm.getApplicationLabel(appInfo).toString());
                appObj.put("version", packageInfo.versionName != null ? packageInfo.versionName : "unknown");
                appObj.put("isSystemApp", isSystemApp);

                // Get permissions
                JSArray permissionsArray = new JSArray();
                if (packageInfo.requestedPermissions != null) {
                    for (String perm : packageInfo.requestedPermissions) {
                        // Simplify permission names
                        String simplePerm = perm.replace("android.permission.", "");
                        permissionsArray.put(simplePerm);
                    }
                }
                appObj.put("permissions", permissionsArray);

                // Get install time
                appObj.put("installDate", new java.util.Date(packageInfo.firstInstallTime).toString());

                appsArray.put(appObj);

                if (isSystemApp) {
                    systemApps++;
                } else {
                    userApps++;
                }
            }

            JSObject result = new JSObject();
            result.put("apps", appsArray);
            result.put("totalCount", packages.size());
            result.put("systemApps", systemApps);
            result.put("userApps", userApps);

            Log.i(TAG, "Found " + packages.size() + " installed apps (" + userApps + " user apps)");
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Error getting installed apps", e);
            call.reject("Failed to get installed apps: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkAppsInstalled(PluginCall call) {
        Log.d(TAG, "checkAppsInstalled called");

        JSArray packageNames = call.getArray("packageNames");
        if (packageNames == null) {
            call.reject("Missing packageNames parameter");
            return;
        }

        try {
            PackageManager pm = getContext().getPackageManager();
            JSArray installedArray = new JSArray();

            for (int i = 0; i < packageNames.length(); i++) {
                String packageName = packageNames.getString(i);
                try {
                    pm.getPackageInfo(packageName, 0);
                    installedArray.put(packageName);
                    Log.w(TAG, "STALKERWARE DETECTED: " + packageName);
                } catch (PackageManager.NameNotFoundException e) {
                    // Package not installed - this is expected for most stalkerware checks
                }
            }

            JSObject result = new JSObject();
            result.put("installed", installedArray);

            Log.i(TAG, "Checked " + packageNames.length() + " packages, found " + installedArray.length() + " installed");
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Error checking apps", e);
            call.reject("Failed to check apps: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            call.reject("Missing packageName parameter");
            return;
        }

        try {
            PackageManager pm = getContext().getPackageManager();
            PackageInfo packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);
            ApplicationInfo appInfo = packageInfo.applicationInfo;

            JSObject result = new JSObject();
            result.put("packageName", packageInfo.packageName);
            result.put("appName", pm.getApplicationLabel(appInfo).toString());
            result.put("version", packageInfo.versionName != null ? packageInfo.versionName : "unknown");
            result.put("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);

            // Get permissions
            JSArray permissionsArray = new JSArray();
            if (packageInfo.requestedPermissions != null) {
                for (String perm : packageInfo.requestedPermissions) {
                    permissionsArray.put(perm.replace("android.permission.", ""));
                }
            }
            result.put("permissions", permissionsArray);
            result.put("installDate", new java.util.Date(packageInfo.firstInstallTime).toString());

            call.resolve(result);

        } catch (PackageManager.NameNotFoundException e) {
            call.reject("App not found: " + packageName);
        } catch (Exception e) {
            Log.e(TAG, "Error getting app info", e);
            call.reject("Failed to get app info: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getAppPermissions(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            call.reject("Missing packageName parameter");
            return;
        }

        try {
            PackageManager pm = getContext().getPackageManager();
            PackageInfo packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);

            JSArray permissionsArray = new JSArray();
            if (packageInfo.requestedPermissions != null) {
                for (String perm : packageInfo.requestedPermissions) {
                    permissionsArray.put(perm.replace("android.permission.", ""));
                }
            }

            JSObject result = new JSObject();
            result.put("permissions", permissionsArray);
            call.resolve(result);

        } catch (PackageManager.NameNotFoundException e) {
            call.reject("App not found: " + packageName);
        } catch (Exception e) {
            Log.e(TAG, "Error getting permissions", e);
            call.reject("Failed to get permissions: " + e.getMessage());
        }
    }

    @PluginMethod
    public void analyzePermissions(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            call.reject("Missing packageName parameter");
            return;
        }

        try {
            PackageManager pm = getContext().getPackageManager();
            PackageInfo packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);

            JSArray suspiciousPatterns = new JSArray();
            int riskScore = 0;

            if (packageInfo.requestedPermissions != null) {
                for (String perm : packageInfo.requestedPermissions) {
                    String simplePerm = perm.toLowerCase();

                    // Check for stalkerware-like permissions
                    if (simplePerm.contains("read_sms") || simplePerm.contains("receive_sms")) {
                        suspiciousPatterns.put("SMS access");
                        riskScore += 2;
                    }
                    if (simplePerm.contains("read_call_log") || simplePerm.contains("process_outgoing_calls")) {
                        suspiciousPatterns.put("Call log access");
                        riskScore += 2;
                    }
                    if (simplePerm.contains("record_audio")) {
                        suspiciousPatterns.put("Microphone recording");
                        riskScore += 2;
                    }
                    if (simplePerm.contains("camera")) {
                        suspiciousPatterns.put("Camera access");
                        riskScore += 1;
                    }
                    if (simplePerm.contains("access_fine_location") || simplePerm.contains("access_background_location")) {
                        suspiciousPatterns.put("Location tracking");
                        riskScore += 1;
                    }
                    if (simplePerm.contains("read_contacts")) {
                        suspiciousPatterns.put("Contact access");
                        riskScore += 1;
                    }
                    if (simplePerm.contains("bind_accessibility")) {
                        suspiciousPatterns.put("Accessibility service");
                        riskScore += 3;
                    }
                    if (simplePerm.contains("bind_device_admin")) {
                        suspiciousPatterns.put("Device admin");
                        riskScore += 3;
                    }
                }
            }

            String riskLevel;
            if (riskScore >= 6) {
                riskLevel = "critical";
            } else if (riskScore >= 4) {
                riskLevel = "high";
            } else if (riskScore >= 2) {
                riskLevel = "medium";
            } else {
                riskLevel = "low";
            }

            JSObject result = new JSObject();
            result.put("packageName", packageName);
            result.put("suspiciousPatterns", suspiciousPatterns);
            result.put("riskLevel", riskLevel);
            result.put("riskScore", riskScore);

            call.resolve(result);

        } catch (PackageManager.NameNotFoundException e) {
            call.reject("App not found: " + packageName);
        } catch (Exception e) {
            Log.e(TAG, "Error analyzing permissions", e);
            call.reject("Failed to analyze permissions: " + e.getMessage());
        }
    }
}
