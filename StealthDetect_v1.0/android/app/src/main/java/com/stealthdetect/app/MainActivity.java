package com.stealthdetect.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.stealthdetect.vpnservice.VpnServicePlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before calling super.onCreate()
        registerPlugin(VpnServicePlugin.class);

        super.onCreate(savedInstanceState);
    }
}
