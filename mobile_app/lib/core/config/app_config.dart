import 'dart:io';

class AppConfig {
  // API Configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );
  static const String imageBaseUrl = String.fromEnvironment(
    'IMAGE_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  // External Services
  static const String mnotifyApiKey = String.fromEnvironment(
    'MNOTIFY_API_KEY',
    defaultValue: '',
  );
  static const String mnotifyApiBaseUrl = String.fromEnvironment(
    'MNOTIFY_API_BASE_URL',
    defaultValue: '',
  );
  static const String mnotifySenderId = String.fromEnvironment(
    'MNOTIFY_SENDER_ID',
    defaultValue: '',
  );

  // Environment Detection
  static const String flutterEnv = String.fromEnvironment(
    'FLUTTER_ENV',
    defaultValue: 'development',
  );

  static const String sentryDsn = String.fromEnvironment(
    'SENTRY_DSN',
    defaultValue: '',
  );

  static bool get isDevelopment => flutterEnv == 'development';
  static bool get isProduction => flutterEnv == 'production';
}
