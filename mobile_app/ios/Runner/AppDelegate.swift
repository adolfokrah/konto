import Flutter
import UIKit
import Firebase

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()

    // Ensure flutter_local_notifications can present foreground notifications
    // by reclaiming the UNUserNotificationCenter delegate after Firebase.
    // Must be set before didFinishLaunching returns (UIScene lifecycle).
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self as UNUserNotificationCenterDelegate
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // UIScene lifecycle: the engine is created with the scene, so plugins are
  // registered here instead of in didFinishLaunching.
  // https://docs.flutter.dev/to/uiscene-migration
  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}
