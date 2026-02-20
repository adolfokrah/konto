import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/services/navigation_service.dart';
import 'package:flutter/scheduler.dart';
import 'package:Hoga/router.dart' show rootNavigatorKey;
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/core/services/local_notification_service.dart';
import 'package:go_router/go_router.dart';

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
      // Disable Firebase's own foreground notification display on iOS
      // so flutter_local_notifications handles it instead
      FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
        alert: false,
        badge: false,
        sound: false,
      );

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
      final messageData = message.data;
      final type = messageData['type'];
      final path = messageData['path'];

      if (type == 'contribution') {
        // Special handling: multi-step jar loading + contribution bottom sheet
        final jarId = messageData['jarId'];
        final contributionId = messageData['contributionId'];
        if (jarId != null && contributionId != null) {
          final BuildContext? context = rootNavigatorKey.currentContext;
          if (context != null) {
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
      } else if (path != null) {
        // Generic path-based navigation for all other types
        final BuildContext? context = rootNavigatorKey.currentContext;
        if (context != null) {
          GoRouter.of(context).push(path);

          // Type-specific side effects after navigation
          if (type == 'kyc') {
            SchedulerBinding.instance.addPostFrameCallback((_) {
              final postNavContext = rootNavigatorKey.currentContext;
              if (postNavContext != null) {
                try {
                  postNavContext.read<NotificationsBloc>().add(
                    FetchNotifications(limit: 20, page: 1),
                  );
                  _triggerAutoLogin(postNavContext);
                } catch (e) {
                  print('⚠️ Could not dispatch side effects after $type navigation: $e');
                }
              }
            });
          }
        } else {
          print("❌ No navigation context available for '$type' tap");
        }
      } else {
        print("ℹ️ No path in notification data for type '$type'");
      }
    } catch (e) {
      print("❌ Error handling notification tap: $e");
    }
  }

  /// Handle push notification received while app is in foreground
  static void _handlePush(RemoteMessage message) {
    final messageData = message.data;
    final BuildContext? context = rootNavigatorKey.currentContext;

    // Refresh the current jar if the notification is related to it
    final jarId = messageData['jarId'];
    if (jarId != null && context != null) {
      NavigationService.reloadCurrentJar(context, jarId);
    }

    // Refresh notifications list for relevant types
    if (messageData['type'] == 'jarInvite' || messageData['type'] == 'kyc') {
      if (context != null) {
        try {
          context.read<NotificationsBloc>().add(
            FetchNotifications(limit: 20, page: 1),
          );
        } catch (e) {
          print('⚠️ Could not dispatch FetchNotifications on push: $e');
        }
      }
    }

    // Refresh user auth state when KYC status changes
    if (messageData['type'] == 'kyc' && context != null) {
      _triggerAutoLogin(context);
    }

    // Show in-app notification banner
    _showInAppNotification(message);
  }

  /// Show a local notification for foreground push notifications.
  /// Skips if the notification is a contribution for the currently selected jar.
  static void _showInAppNotification(RemoteMessage message) {
    final messageData = message.data;
    final type = messageData['type'];
    final BuildContext? context = rootNavigatorKey.currentContext;

    // Skip notification for contribution on the currently selected jar
    if (type == 'contribution' && context != null) {
      final jarId = messageData['jarId'];
      try {
        final state = context.read<JarSummaryBloc>().state;
        if (state is JarSummaryLoaded && state.jarData.id == jarId) {
          return;
        }
      } catch (_) {}
    }

    final title = message.notification?.title ?? '';
    final body = message.notification?.body ?? '';
    if (title.isEmpty && body.isEmpty) return;

    LocalNotificationService.show(
      title: title,
      body: body,
      data: messageData,
    );
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
    final BuildContext? context = rootNavigatorKey.currentContext;
    if (context != null) {
      _triggerAutoLogin(context);
    } else {
      print('❌ No context available to trigger auto login');
    }
  }
}
