package com.pb.ludoking;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // custom plugin must be registered before super.onCreate
        registerPlugin(ApkUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
        // Always on display: screen never goes to sleep while the game is open
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
