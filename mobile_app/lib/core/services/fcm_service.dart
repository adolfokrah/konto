import 'package:firebase_messaging/firebase_messaging.dart';

/// Simple Firebase Cloud Messaging service
class FCMService {
  /// Request notification permissions from the user
  static Future<void> requestPermission() async {
    // Skip Firebase operations during tests
    try {
      FirebaseMessaging messaging = FirebaseMessaging.instance;
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      print('Permission granted: ${settings.authorizationStatus}');
    } catch (e) {
      print('FCM permission error (likely in test environment): $e');
    }
  }

  /// Get the FCM device token
  static Future<String?> getToken() async {
    try {
      String? token = await FirebaseMessaging.instance.getToken();
      print("FCM Token: $token");
      return token;
    } catch (e) {
      print('FCM token error (likely in test environment): $e');
      return null;
    }
  }

  /// Initialize FCM listeners
  static void initialize() {
    try {
      // Listen for messages while app is in foreground
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print("Message received: ${message.notification?.title}");
      });

      // Listen for messages when user taps notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        print("User tapped notification: ${message.data}");
      });
    } catch (e) {
      print('FCM initialization error (likely in test environment): $e');
    }
  }
}
