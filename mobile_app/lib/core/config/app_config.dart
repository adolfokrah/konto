import 'dart:io';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  // API Configuration
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? '';

  static String get imageBaseUrl =>
      dotenv.env['IMAGE_BASE_URL'] ?? 'http://localhost:3000';

  // External Services
  static String get mnotifyApiKey => dotenv.env['MNOTIFY_API_KEY'] ?? '';

  static String get mnotifyApiBaseUrl =>
      dotenv.env['MNOTIFY_API_BASE_URL'] ?? '';

  static String get mnotifySenderId => dotenv.env['MNOTIFY_SENDER_ID'] ?? '';

  // Environment Detection
  static String get flutterEnv => dotenv.env['FLUTTER_ENV'] ?? 'development';

  static String get sentryDsn => dotenv.env['SENTRY_DSN'] ?? '';

  static bool get isDevelopment => flutterEnv == 'development';
  static bool get isProduction => flutterEnv == 'production';

  /// Initialize the configuration by loading the .env file
  /// This should be called before using any configuration values
  static Future<void> initialize() async {
    try {
      await dotenv.load(fileName: '.env');
      print('✅ Successfully loaded .env file');
      print('🔗 API Base URL: $apiBaseUrl');
    } catch (e) {
      print('⚠️  Warning: Could not load .env file: $e');
      print('📝 Using default configuration values');
      print('🔗 API Base URL (default): $apiBaseUrl');
    }
  }
}
