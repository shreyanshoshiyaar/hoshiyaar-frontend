package com.hoshiyaarlearning.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.microsoft.clarity.Clarity;
import com.microsoft.clarity.ClarityConfig;
import com.microsoft.clarity.models.LogLevel;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        ClarityConfig config = new ClarityConfig("x5x3lf09kv");
        config.setLogLevel(LogLevel.None);
        Clarity.initialize(getApplicationContext(), config);
    }
}
