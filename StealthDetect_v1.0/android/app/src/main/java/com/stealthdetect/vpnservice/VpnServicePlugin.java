package com.stealthdetect.vpnservice;

import android.content.Intent;
import android.net.VpnService;
import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import androidx.activity.result.ActivityResult;

/**
 * VPN Service Plugin for Capacitor
 * Bridges Android VpnService with JavaScript layer
 */
@CapacitorPlugin(name = "VpnService")
public class VpnServicePlugin extends Plugin {

    private static final String TAG = "VpnServicePlugin";

    @PluginMethod
    public void startVpn(PluginCall call) {
        Log.i(TAG, "=== startVpn() called ===");

        // Check if VPN permission is granted
        Intent intent = VpnService.prepare(getContext());
        Log.i(TAG, "VpnService.prepare() returned: " + (intent == null ? "null (permission granted)" : "Intent (permission needed)"));

        if (intent != null) {
            // Need user permission - launch activity for result
            Log.i(TAG, "VPN permission required, launching permission dialog");
            startActivityForResult(call, intent, "handleVpnPermissionResult");
        } else {
            // Permission already granted, start VPN
            Log.i(TAG, "VPN permission already granted, calling doStartVpn()");
            doStartVpn(call);
        }
    }

    @ActivityCallback
    private void handleVpnPermissionResult(PluginCall call, ActivityResult result) {
        Log.d(TAG, "handleVpnPermissionResult: resultCode=" + result.getResultCode());

        if (call == null) {
            Log.e(TAG, "PluginCall is null in handleVpnPermissionResult");
            return;
        }

        if (result.getResultCode() == Activity.RESULT_OK) {
            Log.d(TAG, "VPN permission granted by user");
            doStartVpn(call);
        } else {
            Log.w(TAG, "VPN permission denied by user");
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("requiresPermission", true);
            ret.put("errorMessage", "VPN permission denied by user");
            call.resolve(ret);
        }
    }

    private void doStartVpn(PluginCall call) {
        Log.i(TAG, "=== doStartVpn() called ===");
        try {
            // FIX: Register listeners BEFORE starting service to avoid race condition
            Log.i(TAG, "Registering DNS event listener...");
            StealthDetectVpnService.setDnsEventListener(this::onDnsEvent);
            Log.i(TAG, "Registering state change listener...");
            StealthDetectVpnService.setStateChangeListener(this::onStateChange);
            Log.i(TAG, "Listeners registered successfully");

            // Check if VPN is already running
            boolean alreadyRunning = StealthDetectVpnService.isRunning();
            Log.i(TAG, "VPN already running: " + alreadyRunning);

            if (!alreadyRunning) {
                Log.i(TAG, "Starting VPN service...");
                Intent serviceIntent = new Intent(getContext(), StealthDetectVpnService.class);
                serviceIntent.setAction(StealthDetectVpnService.ACTION_START);
                getContext().startService(serviceIntent);
                Log.i(TAG, "VPN service start intent sent");
            } else {
                Log.i(TAG, "VPN already running, just re-attached listeners");
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("requiresPermission", false);
            ret.put("alreadyRunning", alreadyRunning);
            call.resolve(ret);

            // Notify JS of state change
            JSObject stateEvent = new JSObject();
            stateEvent.put("state", "connected");
            stateEvent.put("timestamp", System.currentTimeMillis());
            notifyListeners("vpnStateChange", stateEvent);

            Log.i(TAG, "=== VPN started successfully ===");

        } catch (Exception e) {
            Log.e(TAG, "Failed to start VPN", e);
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("requiresPermission", false);
            ret.put("errorMessage", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void stopVpn(PluginCall call) {
        Log.d(TAG, "stopVpn called");

        try {
            Intent serviceIntent = new Intent(getContext(), StealthDetectVpnService.class);
            serviceIntent.setAction(StealthDetectVpnService.ACTION_STOP);
            getContext().startService(serviceIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

            // Notify JS of state change
            JSObject stateEvent = new JSObject();
            stateEvent.put("state", "disconnected");
            stateEvent.put("timestamp", System.currentTimeMillis());
            notifyListeners("vpnStateChange", stateEvent);

            Log.i(TAG, "VPN stopped");

        } catch (Exception e) {
            Log.e(TAG, "Failed to stop VPN", e);
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("errorMessage", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void getVpnStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("connected", StealthDetectVpnService.isRunning());
        ret.put("startTime", StealthDetectVpnService.getStartTime());
        ret.put("packetsProcessed", StealthDetectVpnService.getPacketsProcessed());
        ret.put("dnsQueriesIntercepted", StealthDetectVpnService.getDnsQueriesIntercepted());
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Intent intent = VpnService.prepare(getContext());
        JSObject ret = new JSObject();
        ret.put("granted", intent == null);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = VpnService.prepare(getContext());

        if (intent == null) {
            // Already granted
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            // Need to request permission
            startActivityForResult(call, intent, "handlePermissionRequestResult");
        }
    }

    @ActivityCallback
    private void handlePermissionRequestResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        JSObject ret = new JSObject();
        ret.put("granted", result.getResultCode() == Activity.RESULT_OK);
        call.resolve(ret);
    }

    /**
     * Called when a DNS event is detected by the VPN service
     * Note: This is called from a background thread, so we must post to main thread
     */
    private void onDnsEvent(DnsQueryInfo query) {
        Log.i(TAG, "*** onDnsEvent received: " + query.domain + " ***");
        // Must run on main thread for Capacitor event delivery
        getActivity().runOnUiThread(() -> {
            JSObject event = new JSObject();
            event.put("timestamp", query.timestamp);
            event.put("domain", query.domain);
            event.put("queryType", query.queryType);
            event.put("sourceApp", query.sourceApp);
            event.put("sourcePort", query.sourcePort);
            event.put("destinationIp", query.destinationIp);
            event.put("blocked", query.blocked);

            Log.i(TAG, ">>> Delivering DNS event to JS: " + query.domain);
            notifyListeners("dnsRequest", event);
            Log.i(TAG, "<<< DNS event delivered to JS for: " + query.domain);
        });
    }

    /**
     * Called when VPN state changes
     * Note: This may be called from a background thread
     */
    private void onStateChange(String state, String errorMessage) {
        // Must run on main thread for Capacitor event delivery
        getActivity().runOnUiThread(() -> {
            JSObject event = new JSObject();
            event.put("state", state);
            event.put("timestamp", System.currentTimeMillis());
            if (errorMessage != null) {
                event.put("errorMessage", errorMessage);
            }

            Log.d(TAG, "Delivering state change to JS: " + state);
            notifyListeners("vpnStateChange", event);
        });
    }
}
