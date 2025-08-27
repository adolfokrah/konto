import 'package:flutter/material.dart';
import 'package:flutter_sms/flutter_sms.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/widgets/snacbar_message.dart';

class SmsUtils {
  /// Opens SMS app with invitation message for specified phone numbers and jar details
  static Future<void> openSmsAppForInvitation(
    BuildContext context,
    String jarId,
    String jarName,
    List<String> phoneNumbers, {
    bool showErrorMessages = true,
  }) async {
    try {
      // Get current user data

      // Generate jar link
      final jarLink = '${BackendConfig.appBaseUrl}/jars/$jarId';

      // Get the same message that would be sent via SMS
      final translationService = ServiceRegistry().translationService;
      final message = translationService.getSmsInvitationMessage(
        jarName,
        jarLink,
      );

      // Use flutter_sms to send SMS with multiple recipients
      await sendSMS(
        message: message,
        recipients: phoneNumbers,
        sendDirect: false, // Open SMS app instead of sending directly
      );
    } catch (e) {
      print('SMS Error: $e');

      if (showErrorMessages && context.mounted) {
        AppSnackBar.showError(
          context,
          message: 'Failed to open SMS app. Please try again.',
        );
      } else {
        // Silently handle errors for automatic SMS - user will still get automatic SMS
        print('Could not open SMS app: $e');
      }
    }
  }
}
