package com.stealthdetect.vpnservice;

import android.content.Intent;
import android.net.VpnService;
import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * VPN Service Plugin for Capacitor
 * Bridges Android VpnService with JavaScript layer
 */
@CapacitorPlugin(name = "VpnService")
public class VpnServicePlugin extends Plugin {

    private static final String TAG = "VpnServicePlugin";
    private static final int VPN_REQUEST_CODE = 1;

    private boolean vpnStartPending = false;
    private PluginCall pendingCall;

    @PluginMethod
    public void startVpn(PluginCall call) {
        Log.d(TAG, "startVpn called");

        // Check if VPN permission is granted
        Intent intent = VpnService.prepare(getContext());

        if (intent != null) {
            // Need user permission - save call and start activity
            vpnStartPending = true;
            pendingCall = call;
            startActivityForResult(call, intent, VPN_REQUEST_CODE);
        } else {
            // Permission already granted, start VPN
            doStartVpn(call);
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode == VPN_REQUEST_CODE && vpnStartPending) {
            vpnStartPending = false;
            if (resultCode == Activity.RESULT_OK && pendingCall != null) {
                doStartVpn(pendingCall);
            } else if (pendingCall != null) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("requiresPermission", true);
                ret.put("errorMessage", "VPN permission denied by user");
                pendingCall.resolve(ret);
            }
            pendingCall = null;
        }
    }

    private void doStartVpn(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), StealthDetectVpnService.class);
            serviceIntent.setAction(StealthDetectVpnService.ACTION_START);
            getContext().startService(serviceIntent);

            // Register for DNS events from the VPN service
            StealthDetectVpnService.setDnsEventListener(this::onDnsEvent);
            StealthDetectVpnService.setStateChangeListener(this::onStateChange);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("requiresPermission", false);
            call.resolve(ret);

            // Notify JS of state change
            JSObject stateEvent = new JSObject();
            stateEvent.put("state", "connected");
            stateEvent.put("timestamp", System.currentTimeMillis());
            notifyListeners("vpnStateChange", stateEvent);

            Log.i(TAG, "VPN started successfully");

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
            vpnStartPending = false; // Not starting VPN, just requesting permission
            pendingCall = call;
            startActivityForResult(call, intent, VPN_REQUEST_CODE);
        }
    }

    /**
     * Called when a DNS event is detected by the VPN service
     */
    private void onDnsEvent(DnsQueryInfo query) {
        JSObject event = new JSObject();
        event.put("timestamp", query.timestamp);
        event.put("domain", query.domain);
        event.put("queryType", query.queryType);
        event.put("sourceApp", query.sourceApp);
        event.put("sourcePort", query.sourcePort);
        event.put("destinationIp", query.destinationIp);
        event.put("blocked", query.blocked);

        notifyListeners("dnsRequest", event);
    }

    /**
     * Called when VPN state changes
     */
    private void onStateChange(String state, String errorMessage) {
        JSObject event = new JSObject();
        event.put("state", state);
        event.put("timestamp", System.currentTimeMillis());
        if (errorMessage != null) {
            event.put("errorMessage", errorMessage);
        }

        notifyListeners("vpnStateChange", event);
    }
}
