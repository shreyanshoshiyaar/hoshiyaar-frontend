package com.hoshiyaarlearning.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.microsoft.clarity.Clarity;
import com.microsoft.clarity.ClarityConfig;
import com.microsoft.clarity.models.LogLevel;
import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import android.util.Log;
import com.google.firebase.messaging.FirebaseMessaging;
import com.facebook.FacebookSdk;
import com.facebook.appevents.AppEventsConstants;
import com.facebook.appevents.AppEventsLogger;
import java.math.BigDecimal;
import java.util.Currency;

public class MainActivity extends BridgeActivity {
    private InstallReferrerClient referrerClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Handle the splash screen transition.
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);

        try { this.getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false); } catch (Exception e) {}

        // Initialize Install Referrer
        initInstallReferrer();

        // Facebook SDK (Meta App Events): app installs and opens are logged automatically
        try {
            FacebookSdk.sdkInitialize(getApplicationContext());
            AppEventsLogger.activateApp(this.getApplication());
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Javascript bridge for Meta App Events (index.html hyTrack, payments): sign-up, trial start, purchase
        this.getBridge().getWebView().addJavascriptInterface(new Object() {
            private AppEventsLogger logger() { return AppEventsLogger.newLogger(MainActivity.this); }

            @android.webkit.JavascriptInterface
            public void logSignup() {
                try {
                    Bundle p = new Bundle();
                    p.putString(AppEventsConstants.EVENT_PARAM_REGISTRATION_METHOD, "phone");
                    logger().logEvent(AppEventsConstants.EVENT_NAME_COMPLETED_REGISTRATION, p);
                } catch (Exception e) { e.printStackTrace(); }
            }

            @android.webkit.JavascriptInterface
            public void logStartTrial(double value, String currency) {
                try {
                    Bundle p = new Bundle();
                    p.putString(AppEventsConstants.EVENT_PARAM_CURRENCY, currency == null || currency.isEmpty() ? "INR" : currency);
                    logger().logEvent(AppEventsConstants.EVENT_NAME_START_TRIAL, value, p);
                } catch (Exception e) { e.printStackTrace(); }
            }

            @android.webkit.JavascriptInterface
            public void logPurchase(double value, String currency, String contentId) {
                try {
                    Bundle p = new Bundle();
                    if (contentId != null && !contentId.isEmpty()) p.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, contentId);
                    logger().logPurchase(BigDecimal.valueOf(value), Currency.getInstance(currency == null || currency.isEmpty() ? "INR" : currency), p);
                } catch (Exception e) { e.printStackTrace(); }
            }

            @android.webkit.JavascriptInterface
            public void logSubscribe(double value, String currency, String orderId) {
                try {
                    Bundle p = new Bundle();
                    p.putString(AppEventsConstants.EVENT_PARAM_CURRENCY, currency == null || currency.isEmpty() ? "INR" : currency);
                    if (orderId != null && !orderId.isEmpty()) p.putString(AppEventsConstants.EVENT_PARAM_ORDER_ID, orderId);
                    logger().logEvent(AppEventsConstants.EVENT_NAME_SUBSCRIBE, value, p);
                } catch (Exception e) { e.printStackTrace(); }
            }
        }, "NativeFB");

        // Javascript bridge to open this app's page in phone Settings (to allow the microphone
        // after Android has stopped showing the permission pop-up)
        this.getBridge().getWebView().addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void openAppSettings() {
                try {
                    android.content.Intent intent = new android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(android.net.Uri.fromParts("package", getPackageName(), null));
                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }, "NativeSettings");

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

        // Javascript bridge for Clarity funnel events and user tags (src/utils/clarity.js).
        // Only the app's internal user id is ever sent: no phone, name or email (kids' accounts).
        this.getBridge().getWebView().addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void event(String name) {
                if (name == null || name.isEmpty()) return;
                MainActivity.this.runOnUiThread(() -> {
                    try { Clarity.sendCustomEvent(name); } catch (Exception e) { e.printStackTrace(); }
                });
            }

            @android.webkit.JavascriptInterface
            public void tag(String key, String value) {
                if (key == null || key.isEmpty() || value == null) return;
                MainActivity.this.runOnUiThread(() -> {
                    try { Clarity.setCustomTag(key, value); } catch (Exception e) { e.printStackTrace(); }
                });
            }

            @android.webkit.JavascriptInterface
            public void userId(String id) {
                if (id == null || id.isEmpty()) return;
                MainActivity.this.runOnUiThread(() -> {
                    try { Clarity.setCustomUserId(id); } catch (Exception e) { e.printStackTrace(); }
                });
            }
        }, "HoshiClarity");
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
