import 'package:Hoga/core/config/app_config.dart';
import 'package:Hoga/core/services/service_registry.dart';

// SMS Configuration - Store your Mnotify credentials here
class SmsConfig {
  // Mnotify API key
  static String get mnotifyApiKey {
    return AppConfig.mnotifyApiKey;
  }

  // Sender ID from Mnotify
  static String get senderId {
    return AppConfig.mnotifySenderId;
  }

  // Mnotify API endpoints
  static String get apiBaseUrl {
    return AppConfig.mnotifyApiBaseUrl;
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
