import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Backend configuration constants
class BackendConfig {
  // Base URL for the backend API
  static String get apiBaseUrl {
    // Priority: .env file (local) > compile-time env var (CI/CD) > fallback
    return dotenv.env['API_BASE_URL'] ?? 
           const String.fromEnvironment('API_BASE_URL', 
             defaultValue: 'http://192.168.0.160:3000/api');
  }
  
  // API endpoints
  static const String usersEndpoint = '/users';
  static const String checkPhoneExistenceEndpoint = '/users/check-phone-number-existence';
  static const String loginWithPhoneEndpoint = '/users/login-with-phone';
  static const String registerUserEndpoint = '/users/register-user';
  
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
