import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';

class SmsUtils {
  static const MethodChannel _channel = MethodChannel('com.konto.sms');

  /// Opens SMS app with invitation message for specified phone numbers and jar details
  static Future<void> openSmsAppForInvitation(
    BuildContext context,
    String jarId,
    String jarName,
    List<String> phoneNumbers, {
    bool showErrorMessages = true,
  }) async {
    try {
      // Generate jar link
      final jarLink = '${BackendConfig.appBaseUrl}/jars/$jarId';

      // Get the same message that would be sent via SMS
      final translationService = ServiceRegistry().translationService;
      final message = translationService.getSmsInvitationMessage(
        jarName,
        jarLink,
      );

      // Format phone numbers by removing leading zeros
      final formattedPhoneNumbers =
          phoneNumbers
              .map(
                (phone) =>
                    phone.trim().startsWith('0') && phone.length > 1
                        ? phone.substring(1)
                        : phone.trim(),
              )
              .toList();

      print('SMS Debug: Formatted phone numbers: $formattedPhoneNumbers');
      print('SMS Debug: Message: $message');

      // Use platform channel to open native SMS composer
      final result = await _channel.invokeMethod('openSmsComposer', {
        'message': message,
        'recipients': formattedPhoneNumbers,
      });

      print('SMS Debug: Platform channel result: $result');

      // Handle the result if needed
      if (result != null && result['success'] == false) {
        throw Exception(result['error'] ?? 'Unknown error');
      }
    } catch (e) {
      print('SMS Error: $e');

      if (showErrorMessages && context.mounted) {
        // Check if it's an emulator-related issue
        final errorMessage = e.toString().toLowerCase();
        String displayMessage;

        if (errorMessage.contains('emulator') ||
            errorMessage.contains('no sms') ||
            errorMessage.contains('no messaging')) {
          displayMessage =
              'SMS functionality is not available on this device/emulator. Please test on a physical device with SMS capability.';
        } else {
          displayMessage = 'Failed to open SMS app. Please try again.';
        }

        AppSnackBar.showError(context, message: displayMessage);
      } else {
        // Silently handle errors for automatic SMS - user will still get automatic SMS
        print('Could not open SMS app: $e');
      }
    }
  }
}
