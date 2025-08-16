import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:konto/core/services/service_registry.dart';

// SMS Configuration - Store your Mnotify credentials here
class SmsConfig {
  // Mnotify API key
  static String get mnotifyApiKey {
    return dotenv.env['MNOTIFY_API_KEY'] ?? '';
  }

  // Sender ID from Mnotify
  static String get senderId {
    return dotenv.env['MNOTIFY_SENDER_ID'] ?? '';
  }

  // Mnotify API endpoints
  static String get apiBaseUrl {
    return dotenv.env['MNOTIFY_API_BASE_URL'] ?? '';
  }

  // OTP settings
  static const int otpLength = 6;
  static const int otpValidityMinutes = 5;

  // Message template
  static String getOtpMessage(String otp) {
    final translationService = ServiceRegistry().translationService;
    return translationService.getOtpSmsMessage(otp, otpValidityMinutes);
  }
}
