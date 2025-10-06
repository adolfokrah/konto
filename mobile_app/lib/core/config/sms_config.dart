import 'package:Hoga/core/config/app_config.dart';
import 'package:Hoga/core/services/service_registry.dart';

// SMS Configuration - Deywuro API credentials
class SmsConfig {
  // Deywuro API credentials
  static String get username {
    return AppConfig.smsUsername;
  }

  static String get password {
    return AppConfig.smsPassword;
  }

  // Deywuro API endpoint
  static String get apiBaseUrl {
    return AppConfig.smsApiBaseUrl;
  }

  // Source/Sender ID
  static String get source {
    return AppConfig.smsSource;
  }

  // Legacy Mnotify support (deprecated)
  static String get mnotifyApiKey {
    return AppConfig.mnotifyApiKey;
  }

  static String get senderId {
    return AppConfig.mnotifySenderId;
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
