package com.hoshiyaarlearning.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.microsoft.clarity.Clarity;
import com.microsoft.clarity.ClarityConfig;
import com.microsoft.clarity.models.LogLevel;
import com.facebook.FacebookSdk;
import com.facebook.appevents.AppEventsLogger;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Handle the splash screen transition.
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);

        FacebookSdk.sdkInitialize(getApplicationContext());
        AppEventsLogger.activateApp(this.getApplication());

        // Javascript bridge for Facebook App Events
        this.getBridge().getWebView().addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void logSignup() {
                AppEventsLogger logger = AppEventsLogger.newLogger(MainActivity.this);
                logger.logEvent("fb_mobile_complete_registration");
            }
        }, "NativeFB");

        try {
            ClarityConfig config = new ClarityConfig("x5x3lf09kv");
            config.setLogLevel(LogLevel.None);
            Clarity.initialize(getApplicationContext(), config);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
