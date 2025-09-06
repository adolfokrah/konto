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
  static bool get isDevelopment => flutterEnv != 'production';
  static bool get isProduction => flutterEnv == 'production';

  // Debug helper
  static void printConfig() {
    print('🔧 App Configuration:');
    print('API Base URL: $apiBaseUrl');
    print('Image Base URL: $imageBaseUrl');
    print('Environment: ${isDevelopment ? "Development" : "Production"}');
    print(
      'MNotify API Key: ${mnotifyApiKey.isNotEmpty ? "✅ Set (${mnotifyApiKey.length} chars)" : "❌ Missing"}',
    );
    print(
      'MNotify API Base URL: ${mnotifyApiBaseUrl.isNotEmpty ? "✅ Set" : "❌ Missing"}',
    );
    print(
      'MNotify Sender ID: ${mnotifySenderId.isNotEmpty ? "✅ Set" : "❌ Missing"}',
    );

    // Also print raw Platform.environment for comparison
    print('🔍 Platform.environment check:');
    print('API_BASE_URL: ${Platform.environment['API_BASE_URL'] ?? 'NOT_SET'}');
    print(
      'IMAGE_BASE_URL: ${Platform.environment['IMAGE_BASE_URL'] ?? 'NOT_SET'}',
    );
    print(
      'MNOTIFY_API_KEY: ${Platform.environment['MNOTIFY_API_KEY']?.isNotEmpty == true ? "SET" : "NOT_SET"}',
    );
  }
}
