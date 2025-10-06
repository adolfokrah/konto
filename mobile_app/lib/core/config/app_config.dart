import 'dart:io';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  // API Configuration
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? '';

  static String get imageBaseUrl =>
      dotenv.env['IMAGE_BASE_URL'] ?? 'http://localhost:3000';

  // External Services - Deywuro SMS API
  static String get smsApiBaseUrl => dotenv.env['SMS_API_BASE_URL'] ?? '';

  static String get smsUsername => dotenv.env['SMS_USERNAME'] ?? '';

  static String get smsPassword => dotenv.env['SMS_PASS'] ?? '';

  static String get smsSource => dotenv.env['SMS_SOURCE'] ?? 'Hoga';

  // Legacy Mnotify (deprecated - kept for backward compatibility)
  static String get mnotifyApiKey => dotenv.env['MNOTIFY_API_KEY'] ?? '';

  static String get mnotifyApiBaseUrl =>
      dotenv.env['MNOTIFY_API_BASE_URL'] ?? '';

  static String get mnotifySenderId => dotenv.env['MNOTIFY_SENDER_ID'] ?? '';

  // Environment Detection
  static String get flutterEnv => dotenv.env['FLUTTER_ENV'] ?? 'development';

  static String get sentryDsn => dotenv.env['SENTRY_DSN'] ?? '';

  static String get nextProjectBaseUrl =>
      dotenv.env['NEXT_PROJECT_BASE_URL'] ?? '';

  static bool get isDevelopment => flutterEnv == 'development';
  static bool get isProduction => flutterEnv == 'production';

  /// Initialize the configuration by loading the .env file
  /// This should be called before using any configuration values
  static Future<void> initialize() async {
    try {
      await dotenv.load(fileName: '.env');
    } catch (e) {}
  }
}
