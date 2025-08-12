import 'package:dio/dio.dart';
import 'package:konto/core/config/backend_config.dart';

/// API Provider for authentication-related operations
class AuthApiProvider {
  final Dio _dio;
  
  AuthApiProvider({
    required Dio dio,
  }) : _dio = dio;
  
  /// Check if phone number exists in the system
  Future<Map<String, dynamic>> checkPhoneNumberAvailability({
    required String phoneNumber,
    required String countryCode,
  }) async {
    try {
      print('🔍 Checking phone number availability: $phoneNumber with country code: $countryCode');
      
      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.checkPhoneExistenceEndpoint}',
        data: {
          'phoneNumber': phoneNumber,
          'countryCode': countryCode,
        },
        options: Options(
          headers: BackendConfig.defaultHeaders,
        ),
      );
      
      print('📱 Phone availability response: ${response.data}');
      return response.data;
    } catch (e) {
      print('💥 Phone availability check error: $e');
      if (e is DioException) {
        return {
          'success': false,
          'message': 'Network error: ${e.message}',
          'error': e.toString(),
          'dioErrorType': e.type.toString(),
        };
      }
      return {
        'success': false,
        'message': 'Error checking phone availability: ${e.toString()}',
        'error': e.toString(),
      };
    }
  }
  
  /// Login user with phone number (after OTP verification)
  Future<Map<String, dynamic>> loginWithPhoneNumber({
    required String phoneNumber,
    required String countryCode,
  }) async {
    try {
      print('🔐 Logging in user with phone: $phoneNumber and country code: $countryCode');
      
      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.loginWithPhoneEndpoint}',
        data: {
          'phoneNumber': phoneNumber,
          'countryCode': countryCode,
        },
        options: Options(
          headers: BackendConfig.defaultHeaders,
        ),
      );
      
      print('🎉 Login response: ${response.data}');
      return response.data;
    } catch (e) {
      print('💥 Login error: $e');
      if (e is DioException) {
        return {
          'success': false,
          'message': 'Network error: ${e.message}',
          'error': e.toString(),
          'dioErrorType': e.type.toString(),
        };
      }
      return {
        'success': false,
        'message': 'Error during login: ${e.toString()}',
        'error': e.toString(),
      };
    }
  }

  /// Register user (creates new user via Payload CMS)
  Future<Map<String, dynamic>> registerUser({
    required String phoneNumber,
    required String countryCode,
    required String country,
    required String fullName,
    required String email,
  }) async {
    try {
      print('📝 Registering user: $fullName with phone: $phoneNumber');
      
      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.registerUserEndpoint}',
        data: {
          'fullName': fullName,
          'email': email,
          'password': '123456', // Default password or user-provided
          'phoneNumber': phoneNumber,
          'countryCode': countryCode,
          'country': country,
          'isKYCVerified': false,
          'appSettings': {
            'language': 'en',
            'darkMode': false,
            'biometricAuthEnabled': false,
            'notificationsSettings': {
              'pushNotificationsEnabled': true,
              'emailNotificationsEnabled': true,
              'smsNotificationsEnabled': false,
            },
          },
        },
        options: Options(
          headers: BackendConfig.defaultHeaders,
        ),
      );
      
      print('🎉 Registration response: ${response.data}');
      return response.data;
    } catch (e) {
      print('💥 Registration error: $e');
      if (e is DioException) {
        return {
          'success': false,
          'message': 'Network error: ${e.message}',
          'error': e.toString(),
          'dioErrorType': e.type.toString(),
        };
      }
      return {
        'success': false,
        'message': 'Error during registration: ${e.toString()}',
        'error': e.toString(),
      };
    }
  }
}
