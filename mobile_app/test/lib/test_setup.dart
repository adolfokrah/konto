import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:Hoga/features/verification/data/api_providers/verification_provider.dart';
import 'api_mock_interceptor.dart';

class TestSetup {
  static late Dio dio;
  static bool _isInitialized = false;

  static Future<void> initialize() async {
    if (_isInitialized) {
      print('⚠️ TestSetup already initialized, skipping...');
      return;
    }

    // Mock SharedPreferences for testing
    SharedPreferences.setMockInitialValues({});

    // Enable test mode for Verification Provider
    VerificationProvider.isTestMode = true;

    // Load the actual .env file for testing
    try {
      await dotenv.load(fileName: ".env");
    } catch (e) {
      // Fallback to test environment variables
      dotenv.testLoad(mergeWith: {'API_BASE_URL': 'https://api.example.com'});
    }

    // Use the API_BASE_URL from .env or fallback
    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'https://api.example.com';
    dio = Dio(BaseOptions(baseUrl: baseUrl));
    dio.interceptors.add(MockInterceptor());

    // Initialize ServiceRegistry with our mocked Dio
    ServiceRegistry().initializeWithDio(dio);

    _isInitialized = true;
    print('✅ ServiceRegistry initialized with custom Dio for testing');
  }

  static void reset() {
    _isInitialized = false;
    MockInterceptor.clearOverrides();
    print('🔄 TestSetup reset');
  }
}
