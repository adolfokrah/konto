import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/services/navigation_service.dart';
import 'package:flutter/scheduler.dart';
import 'package:Hoga/main.dart' show navigatorKey;
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';

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

      // Listen for messages when user taps notification (app in background)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleNotificationTap(message);
      });

      // Handle notification that launched the app from terminated state
      _handleAppLaunchedFromNotification();
    } catch (e) {
      print('FCM initialization error (likely in test environment): $e');
    }
  }

  /// Handle app launched from notification when app was terminated
  static Future<void> _handleAppLaunchedFromNotification() async {
    try {
      final RemoteMessage? initialMessage =
          await FirebaseMessaging.instance.getInitialMessage();

      if (initialMessage != null) {
        print("🚀 App launched from notification");
        _handleNotificationTap(initialMessage);
      }
    } catch (e) {
      print("❌ Error checking initial message: $e");
    }
  }

  /// Handle notification tap with step-by-step flow
  static void _handleNotificationTap(RemoteMessage message) {
    print("🔔 User tapped notification: ${message.data}");

    try {
      // Step 1: User tapped notification (already happened)
      // Step 2: Check type
      final messageData = message.data;
      final type = messageData['type'];

      print("📋 Notification type: $type");

      if (type == 'contribution') {
        // Extract jarId and contributionId from message data
        final jarId = messageData['jarId'];
        final contributionId = messageData['contributionId'];

        print("🏺 Jar ID: $jarId");
        print("🎯 Contribution ID: $contributionId");

        if (jarId != null && contributionId != null) {
          // Get current context from global navigator key
          final BuildContext? context = navigatorKey.currentContext;

          if (context != null) {
            // Steps 3 & 4: Set selected jar and open contribution view
            NavigationService.navigateToContribution(
              context: context,
              jarId: jarId,
              contributionId: contributionId,
            );
          } else {
            print("❌ No navigation context available");
          }
        } else {
          print("❌ Missing jarId or contributionId in notification data");
        }
      } else if (type == 'jarInvite') {
        final BuildContext? context = navigatorKey.currentContext;
        if (context != null) {
          // Navigate first so the NotificationsBloc in that route tree is mounted
          NavigationService.navigateToNotifications(context);

          // After the next frame (route pushed), try to fetch notifications
          SchedulerBinding.instance.addPostFrameCallback((_) {
            final postNavContext = navigatorKey.currentContext;
            if (postNavContext != null) {
              try {
                final bloc = postNavContext.read<NotificationsBloc>();
                bloc.add(FetchNotifications(limit: 20, page: 1));
              } catch (e) {
                print(
                  '⚠️ Could not dispatch FetchNotifications after navigation: $e',
                );
              }
            } else {
              print(
                '⚠️ No context after navigation to dispatch notifications fetch',
              );
            }
          });
        } else {
          print("❌ No navigation context available for jarInvite tap");
        }
      } else {
        print("ℹ️ Notification type '$type' not handled by contribution flow");
      }
    } catch (e) {
      print("❌ Error handling notification tap: $e");
    }
  }
}
