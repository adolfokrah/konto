import 'package:flutter/material.dart';
import 'package:flutter_sms/flutter_sms.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';

class SmsUtils {
  /// Opens SMS app with invitation message for specified phone numbers and jar details
  static Future<void> openSmsAppForInvitation(
    BuildContext context,
    JarSummaryModel jarData,
    List<String> phoneNumbers, {
    bool showErrorMessages = true,
  }) async {
    try {
      // Get current user data
      final userStorageService = ServiceRegistry().userStorageService;
      final currentUser = await userStorageService.getUserData();
      final inviterName = currentUser?.fullName ?? 'Konto User';

      // Generate jar link
      final jarLink = '${BackendConfig.appBaseUrl}/jars/${jarData.id}';

      // Get the same message that would be sent via SMS
      final translationService = ServiceRegistry().translationService;
      final message = translationService.getSmsInvitationMessage(
        inviterName,
        jarData.name,
        jarLink,
      );

      print('SMS Recipients: $phoneNumbers');
      print('SMS Message: $message');

      // Use flutter_sms to send SMS with multiple recipients
      final result = await sendSMS(
        message: message,
        recipients: phoneNumbers,
        sendDirect: false, // Open SMS app instead of sending directly
      );

      print('SMS Result: $result');

      if (result == 'SMS Sent!' || result == 'SMS opened in default app') {
        // Success - SMS app opened successfully
        if (!showErrorMessages) {
          // For automatic invitations, show a subtle success message
          if (context.mounted) {
            AppSnackBar.showInfo(
              context,
              message: 'SMS app opened with invitation message',
            );
          }
        }
      } else if (showErrorMessages && context.mounted) {
        // Show error message for manual operations
        AppSnackBar.showError(
          context,
          message: 'Could not open SMS app. Please try manually.',
        );
      }
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

  /// Opens SMS app with a custom message for specified phone numbers
  static Future<void> openSmsAppWithCustomMessage(
    BuildContext context,
    List<String> phoneNumbers,
    String message, {
    bool showErrorMessages = true,
  }) async {
    try {
      print('SMS Recipients: $phoneNumbers');
      print('SMS Message: $message');

      // Use flutter_sms to send SMS with multiple recipients
      final result = await sendSMS(
        message: message,
        recipients: phoneNumbers,
        sendDirect: false, // Open SMS app instead of sending directly
      );

      print('SMS Result: $result');

      if (result == 'SMS Sent!' || result == 'SMS opened in default app') {
        // Success - SMS app opened successfully
        if (showErrorMessages && context.mounted) {
          AppSnackBar.showSuccess(
            context,
            message: 'SMS app opened successfully',
          );
        }
      } else if (showErrorMessages && context.mounted) {
        // Show error message
        AppSnackBar.showError(
          context,
          message: 'Could not open SMS app. Please try manually.',
        );
      }
    } catch (e) {
      print('SMS Error: $e');

      if (showErrorMessages && context.mounted) {
        AppSnackBar.showError(
          context,
          message: 'Failed to open SMS app. Please try again.',
        );
      }
    }
  }
}
