import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:Hoga/core/services/navigation_service.dart';
import 'package:Hoga/router.dart' show rootNavigatorKey;
import 'package:go_router/go_router.dart';

class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  static const _channel = AndroidNotificationChannel(
    'fcm_foreground',
    'Foreground Notifications',
    description: 'Notifications received while the app is open',
    importance: Importance.high,
  );

  /// Initialize the plugin and create the Android notification channel
  static Future<void> initialize() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create Android notification channel
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);
  }

  /// Show a local notification with data payload
  static Future<void> show({
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    try {
      await _plugin.show(
        DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title,
        body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: data != null ? jsonEncode(data) : null,
      );
    } catch (e) {
      debugPrint('Error showing local notification: $e');
    }
  }

  /// Handle tap on local notification
  static void _onNotificationTap(NotificationResponse response) {
    if (response.payload == null) return;

    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      final type = data['type'] as String?;
      final path = data['path'] as String?;

      final context = rootNavigatorKey.currentContext;
      if (context == null) return;

      if (type == 'contribution') {
        final jarId = data['jarId'] as String?;
        final contributionId = data['contributionId'] as String?;
        if (jarId != null && contributionId != null) {
          NavigationService.navigateToContribution(
            context: context,
            jarId: jarId,
            contributionId: contributionId,
          );
        }
      } else if (path != null) {
        GoRouter.of(context).push(path);
      }
    } catch (e) {
      debugPrint('Error handling local notification tap: $e');
    }
  }
}
