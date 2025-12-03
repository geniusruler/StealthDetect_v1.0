package com.stealthdetect.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.stealthdetect.vpnservice.VpnServicePlugin;
import com.stealthdetect.appscanner.AppScannerPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before calling super.onCreate()
        registerPlugin(VpnServicePlugin.class);
        registerPlugin(AppScannerPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
