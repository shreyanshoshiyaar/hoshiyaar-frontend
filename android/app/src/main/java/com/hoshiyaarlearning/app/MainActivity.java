package com.hoshiyaarlearning.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.microsoft.clarity.Clarity;
import com.microsoft.clarity.ClarityConfig;
import com.microsoft.clarity.models.LogLevel;
import com.facebook.FacebookSdk;
import com.facebook.appevents.AppEventsLogger;
import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import android.util.Log;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    private InstallReferrerClient referrerClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Handle the splash screen transition.
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);

        FacebookSdk.sdkInitialize(getApplicationContext());
        AppEventsLogger.activateApp(this.getApplication());

        // Initialize Install Referrer
        initInstallReferrer();

        // Javascript bridge for Facebook App Events
        this.getBridge().getWebView().addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void logSignup() {
                AppEventsLogger logger = AppEventsLogger.newLogger(MainActivity.this);
                logger.logEvent("fb_mobile_complete_registration");
            }
        }, "NativeFB");

        // Javascript bridge for FCM direct token fetch
        this.getBridge().getWebView().addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void fetchToken() {
                try {
                    FirebaseMessaging.getInstance().getToken()
                        .addOnCompleteListener(task -> {
                            if (!task.isSuccessful()) {
                                Log.w("NativeFCM", "Fetching FCM registration token failed", task.getException());
                                return;
                            }
                            String token = task.getResult();
                            MainActivity.this.runOnUiThread(() -> {
                                getBridge().getWebView().evaluateJavascript(
                                    "window.dispatchEvent(new CustomEvent('onNativeFCMToken', { detail: '" + token + "' }));",
                                    null
                                );
                            });
                        });
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }, "NativeFCM");

        try {
            ClarityConfig config = new ClarityConfig("x5x3lf09kv");
            config.setLogLevel(LogLevel.None);
            Clarity.initialize(getApplicationContext(), config);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void initInstallReferrer() {
        referrerClient = InstallReferrerClient.newBuilder(this).build();
        referrerClient.startConnection(new InstallReferrerStateListener() {
            @Override
            public void onInstallReferrerSetupFinished(int responseCode) {
                switch (responseCode) {
                    case InstallReferrerClient.InstallReferrerResponse.OK:
                        try {
                            ReferrerDetails response = referrerClient.getInstallReferrer();
                            String referrerUrl = response.getInstallReferrer();
                            Log.d("Referrer", "Referrer URL: " + referrerUrl);
                            
                            // Inject into WebView so frontend can access it
                            MainActivity.this.runOnUiThread(() -> {
                                getBridge().getWebView().evaluateJavascript(
                                    "window.androidInstallReferrer = '" + referrerUrl.replace("'", "\\'") + "';",
                                    null
                                );
                            });
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        break;
                    case InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED:
                        Log.w("Referrer", "InstallReferrer not supported");
                        break;
                    case InstallReferrerClient.InstallReferrerResponse.SERVICE_UNAVAILABLE:
                        Log.w("Referrer", "Unable to connect to the service");
                        break;
                }
            }

            @Override
            public void onInstallReferrerServiceDisconnected() {
                // Try to restart the connection on the next request
            }
        });
    }
}
