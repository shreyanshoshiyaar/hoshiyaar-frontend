# Capacitor ProGuard Rules
-keep public class com.getcapacitor.** { *; }
-keep class **.R$* {
    <fields>;
}
-keepnames class com.getcapacitor.Bridge { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.annotation.Permission class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }

# Javascript Interfaces
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Microsoft Clarity
-keep class com.microsoft.clarity.** { *; }
-dontwarn com.microsoft.clarity.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Facebook SDK
-keep class com.facebook.** { *; }
-dontwarn com.facebook.**
-keepattributes Signature

# App's own classes (Keep them from being obfuscated/stripped if they are entry points)
-keep class com.hoshiyaarlearning.app.** { *; }

# Prevent shrinking of the BridgeActivity
# Already covered above but kept for clarity if moved
-keep class * extends com.getcapacitor.BridgeActivity { *; }

# Optimization settings (Balanced)
# Removed -repackageclasses as it often breaks Capacitor/SDKs
# Removed -allowaccessmodification for stability
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*
