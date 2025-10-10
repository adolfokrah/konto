import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/services/navigation_service.dart';
import 'package:flutter/scheduler.dart';
import 'package:Hoga/main.dart' show navigatorKey;
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';

/// Simple Firebase Cloud Messaging service
class FCMService {
  /// Request notification permissions from the user
  static Future<void> requestPermission() async {
    // Skip Firebase operations during tests
    try {
      FirebaseMessaging messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);
    } catch (e) {
      print('FCM permission error (likely in test environment): $e');
    }
  }

  /// Get the FCM device token
  static Future<String?> getToken() async {
    try {
      String? token = await FirebaseMessaging.instance.getToken();
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
        // if notification is type contribution, please reload the current jar
        _handlePush(message);
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
        _handleNotificationTap(initialMessage);
      }
    } catch (e) {
      print("❌ Error checking initial message: $e");
    }
  }

  /// Handle notification tap with step-by-step flow
  static void _handleNotificationTap(RemoteMessage message) {
    try {
      // Step 1: User tapped notification (already happened)
      // Step 2: Check type
      final messageData = message.data;
      final type = messageData['type'];

      if (type == 'contribution') {
        // Extract jarId and contributionId from message data
        final jarId = messageData['jarId'];
        final contributionId = messageData['contributionId'];
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
        } else {
          print("❌ No navigation context available for jarInvite tap");
        }
      } else if (type == 'kyc') {
        final data = messageData['status'] ?? 'unknown';
        final BuildContext? context = navigatorKey.currentContext;
        if (context != null) {
          NavigationService.navigateToNotifications(context);
          SchedulerBinding.instance.addPostFrameCallback((_) {
            final postNavContext = navigatorKey.currentContext;
            if (postNavContext != null) {
              try {
                postNavContext.read<NotificationsBloc>().add(
                  FetchNotifications(limit: 20, page: 1),
                );

                if (data == 'approved' || data == 'pending') {
                  // Trigger auto login to refresh user data after KYC approval
                  _triggerAutoLogin(postNavContext);
                }
              } catch (e) {
                print(
                  '⚠️ Could not dispatch FetchNotifications after kycFailed navigation: $e',
                );
              }
            }
          });
        } else {
          print("❌ No navigation context available for kycFailed tap");
        }
      } else {
        print("ℹ️ Notification type '$type' not handled by contribution flow");
      }
    } catch (e) {
      print("❌ Error handling notification tap: $e");
    }
  }

  /// Handle push notification received while app is in foreground
  static void _handlePush(RemoteMessage message) {
    final messageData = message.data;

    if (messageData['type'] == 'contribution') {
      final jarId = messageData['jarId'];
      final BuildContext? context = navigatorKey.currentContext;
      if (jarId != null && context != null) {
        // Reload current jar summary to reflect new contribution
        NavigationService.reloadCurrentJar(context, jarId);
      }
    } else if (messageData['type'] == 'jarInvite' ||
        messageData['type'] == 'kyc') {
      final data = messageData['status'] ?? 'unknown';
      final BuildContext? context = navigatorKey.currentContext;
      if (context != null) {
        try {
          // Dispatch fetch notifications to update list
          context.read<NotificationsBloc>().add(
            FetchNotifications(limit: 20, page: 1),
          );
          // Trigger auto login to refresh user data after KYC status change
          _triggerAutoLogin(context);
          if (data == 'approved' || data == 'pending') {
            context.read<NotificationsBloc>().add(
              FetchNotifications(limit: 20, page: 1),
            );
            // Trigger auto login to refresh user data after KYC status change
            _triggerAutoLogin(context);
          }
        } catch (e) {
          print('⚠️ Could not dispatch FetchNotifications on push: $e');
        }
      }
    } else {
      print("ℹ️ Push notification type '${messageData['type']}' not handled");
    }
  }

  /// Trigger auto login to refresh user authentication state
  static void _triggerAutoLogin(BuildContext context) {
    try {
      context.read<AuthBloc>().add(AutoLoginRequested());
    } catch (e) {
      print('⚠️ Could not trigger auto login: $e');
    }
  }

  /// Public method to trigger auto login from anywhere in the app
  static void triggerAutoLogin() {
    final BuildContext? context = navigatorKey.currentContext;
    if (context != null) {
      _triggerAutoLogin(context);
    } else {
      print('❌ No context available to trigger auto login');
    }
  }
}
