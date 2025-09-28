import 'package:Hoga/core/config/app_config.dart';

/// Backend configuration constants
class BackendConfig {
  // Base URL for the backend API
  static String get apiBaseUrl {
    return AppConfig.apiBaseUrl;
  }

  static String get imageBaseUrl {
    return AppConfig.imageBaseUrl;
  }

  static String get appBaseUrl {
    return AppConfig.imageBaseUrl; // Using imageBaseUrl as app base URL
  }

  // API endpoints
  static const String usersEndpoint = '/users';
  static const String checkUserExistence = '/users/check-user-existence';
  static const String loginWithPhoneEndpoint = '/users/login-with-phone';
  static const String registerUserEndpoint = '/users/register-user';
  static const String sendWhatsAppOtpEndpoint = '/users/send-whatsapp-otp';

  // Jar endpoints
  static const String jarsEndpoint = '/jars';
  // Notifications endpoint
  static const String notificationsEndpoint = '/notifications';

  // Timeout configurations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);

  // Headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}
