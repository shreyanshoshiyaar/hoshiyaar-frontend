# Capacitor ProGuard Rules
-keep public class com.getcapacitor.** { *; }
-keep class **.R$* {
    <fields>;
}
-keepnames class com.getcapacitor.Bridge { *; }

# Microsoft Clarity
-keep class com.microsoft.clarity.** { *; }
-dontwarn com.microsoft.clarity.**

# Firebase Analytics
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Prevent shrinking of the BridgeActivity
-keep class * extends com.getcapacitor.BridgeActivity { *; }
