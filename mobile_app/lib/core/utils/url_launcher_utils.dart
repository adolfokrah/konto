import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Utility class for launching URLs with fallback strategies
class UrlLauncherUtils {
  /// Launch a URL with multiple fallback strategies for better reliability
  ///
  /// Tries the following approaches in order:
  /// 1. External application (most reliable on Android)
  /// 2. In-app browser view
  /// 3. Platform default
  ///
  /// [url] - The URL to launch
  /// [showTitle] - Whether to show title in in-app browser (default: true)
  static Future<bool> launch(String url, {bool showTitle = true}) async {
    try {
      final uri = Uri.parse(url);

      // Try external application first (most reliable on Android)
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return true;
      } catch (e) {
        debugPrint('External app launch failed: $e');
      }

      // Try in-app browser as fallback
      try {
        await launchUrl(
          uri,
          mode: LaunchMode.inAppBrowserView,
          browserConfiguration: BrowserConfiguration(showTitle: showTitle),
        );
        return true;
      } catch (e) {
        debugPrint('In-app browser launch failed: $e');
      }

      // Last resort: try platform default
      try {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
        return true;
      } catch (e) {
        debugPrint('Platform default launch failed: $e');
      }

      return false;
    } catch (e) {
      debugPrint('Failed to launch URL: $url, Error: $e');
      return false;
    }
  }

  /// Launch a phone number for calling
  ///
  /// [phoneNumber] - The phone number to call
  static Future<bool> launchPhoneCall(String phoneNumber) async {
    final url = 'tel:$phoneNumber';
    return await launch(url);
  }

  /// Launch an SMS to a phone number
  ///
  /// [phoneNumber] - The phone number to send SMS to
  /// [message] - Optional pre-filled message
  static Future<bool> launchSMS(String phoneNumber, {String? message}) async {
    String url = 'sms:$phoneNumber';
    if (message != null && message.isNotEmpty) {
      url += '?body=${Uri.encodeComponent(message)}';
    }
    return await launch(url);
  }

  /// Launch an email client
  ///
  /// [email] - The email address
  /// [subject] - Optional subject line
  /// [body] - Optional email body
  static Future<bool> launchEmail(
    String email, {
    String? subject,
    String? body,
  }) async {
    String url = 'mailto:$email';
    List<String> params = [];

    if (subject != null && subject.isNotEmpty) {
      params.add('subject=${Uri.encodeComponent(subject)}');
    }

    if (body != null && body.isNotEmpty) {
      params.add('body=${Uri.encodeComponent(body)}');
    }

    if (params.isNotEmpty) {
      url += '?${params.join('&')}';
    }

    return await launch(url);
  }

  /// Check if a URL can be launched
  ///
  /// [url] - The URL to check
  static Future<bool> canLaunch(String url) async {
    try {
      final uri = Uri.parse(url);
      return await canLaunchUrl(uri);
    } catch (e) {
      debugPrint('Failed to check if URL can be launched: $url, Error: $e');
      return false;
    }
  }
}
