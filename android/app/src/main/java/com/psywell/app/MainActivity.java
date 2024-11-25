package com.psywell.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.psywell.app.SamsungHealthPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Registrar el plugin SamsungHealthPlugin
        registerPlugin(SamsungHealthPlugin.class);
    }
}
