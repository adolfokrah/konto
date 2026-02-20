# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Suppress R8 warnings for classes not needed at runtime
-dontwarn javax.lang.model.**
-dontwarn autovalue.shaded.**
-dontwarn com.google.auto.value.**

# Play Core (deferred components / split install)
-dontwarn com.google.android.play.core.**
