import 'dart:io';
import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class FeedbackService {
  // JotForm URL for Konto MVP Feedback
  static const String _jotFormUrl = 'https://form.jotform.com/252572204807051';

  /// Opens JotForm with device information pre-filled
  ///
  /// To set up pre-filled parameters in JotForm:
  /// 1. Create your JotForm with read-only fields
  /// 2. Set field names: deviceName, appVersion, osVersion, platform
  /// 3. Make these fields "Read Only" in field properties
  /// 4. Replace the form URL above with your actual JotForm URL
  /// 5. JotForm uses field names directly as URL parameters
  static Future<void> openFeedbackForm() async {
    try {
      final deviceInfo = await _getDeviceInfo();
      final appInfo = await _getAppInfo();

      // Create URL with pre-filled parameters for JotForm
      final uri = Uri.parse(_jotFormUrl).replace(
        queryParameters: {
          // JotForm uses field names directly as URL parameters
          'deviceName': deviceInfo['deviceName'] ?? 'Unknown',
          'appVersion': appInfo['version'] ?? 'Unknown',
          'osVersion': deviceInfo['osVersion'] ?? 'Unknown',
          'platform': deviceInfo['platform'] ?? 'Unknown',
        },
      );

      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Could not launch feedback form');
      }
    } catch (e) {
      // Fallback: open form without pre-filled data
      final fallbackUri = Uri.parse(_jotFormUrl);
      if (await canLaunchUrl(fallbackUri)) {
        await launchUrl(fallbackUri, mode: LaunchMode.externalApplication);
      } else {
        rethrow;
      }
    }
  }

  /// Gets device information based on platform
  static Future<Map<String, String>> _getDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();

    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return {
        'deviceName': '${androidInfo.brand} ${androidInfo.model}',
        'osVersion':
            'Android ${androidInfo.version.release} (API ${androidInfo.version.sdkInt})',
        'platform': 'Android',
        'manufacturer': androidInfo.manufacturer,
        'model': androidInfo.model,
      };
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return {
        'deviceName': '${iosInfo.name} (${iosInfo.model})',
        'osVersion': '${iosInfo.systemName} ${iosInfo.systemVersion}',
        'platform': 'iOS',
        'manufacturer': 'Apple',
        'model': iosInfo.model,
      };
    } else {
      return {
        'deviceName': 'Unknown Device',
        'osVersion': 'Unknown OS',
        'platform': Platform.operatingSystem,
        'manufacturer': 'Unknown',
        'model': 'Unknown',
      };
    }
  }

  /// Gets app information
  static Future<Map<String, String>> _getAppInfo() async {
    final packageInfo = await PackageInfo.fromPlatform();

    return {
      'version': '${packageInfo.version} (${packageInfo.buildNumber})',
      'appName': packageInfo.appName,
      'packageName': packageInfo.packageName,
      'buildNumber': packageInfo.buildNumber,
      'versionName': packageInfo.version,
    };
  }

  /// Gets formatted device and app info as a string for debugging
  static Future<String> getDeviceInfoString() async {
    final deviceInfo = await _getDeviceInfo();
    final appInfo = await _getAppInfo();

    return '''
Device: ${deviceInfo['deviceName']}
OS: ${deviceInfo['osVersion']}
Platform: ${deviceInfo['platform']}
App Version: ${appInfo['version']}
Package: ${appInfo['packageName']}
    '''.trim();
  }

  /// Shows device info in a debug dialog (for testing purposes)
  /// Remove this in production
  static Future<void> showDeviceInfoDebug(BuildContext context) async {
    final info = await getDeviceInfoString();
    if (context.mounted) {
      showDialog(
        context: context,
        builder:
            (context) => AlertDialog(
              title: const Text('Device Info'),
              content: Text(info),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Close'),
                ),
              ],
            ),
      );
    }
  }
}
