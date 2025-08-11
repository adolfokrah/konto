import 'package:dio/dio.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/features/verification/data/api_providers/sms_api_provider.dart';

/// API Provider for authentication-related operations
/// Reuses the SMS API provider for sending OTP messages
class AuthApiProvider {
  final SmsApiProvider _smsApiProvider;
  final Dio _dio;
  
  AuthApiProvider({
    required SmsApiProvider smsApiProvider,
    required Dio dio,
  }) : _smsApiProvider = smsApiProvider,
       _dio = dio;
  
  /// Check if phone number exists in the system
  Future<Map<String, dynamic>> checkPhoneNumberAvailability({
    required String phoneNumber,
    required String countryCode,
  }) async {
    try {
      print('🔍 Checking phone number availability: $phoneNumber with country code: $countryCode');
      
      final response = await _dio.post(
        '${BackendConfig.baseUrl}${BackendConfig.checkPhoneExistenceEndpoint}',
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
  
  /// Send authentication OTP via SMS
  Future<Map<String, dynamic>> sendAuthOtp({
    required String phoneNumber,
    required String message,
  }) async {
    return await _smsApiProvider.sendSms(
      phoneNumber: phoneNumber,
      message: message,
    );
  }
  
  /// Verify user credentials (placeholder for future backend integration)
  Future<Map<String, dynamic>> verifyUserCredentials({
    required String phoneNumber,
    required String otp,
  }) async {
    // TODO: Implement backend API call for user verification
    // For now, return success if OTP verification passes locally
    return {
      'success': true,
      'user': {
        'phoneNumber': phoneNumber,
        'isVerified': true,
      },
      'message': 'User authenticated successfully',
    };
  }
  
  /// Register user (placeholder for future backend integration)
  Future<Map<String, dynamic>> registerUser({
    required String phoneNumber,
    String? email,
    String? name,
  }) async {
    // TODO: Implement backend API call for user registration
    return {
      'success': true,
      'user': {
        'phoneNumber': phoneNumber,
        'email': email,
        'name': name,
        'isRegistered': true,
      },
      'message': 'User registered successfully',
    };
  }
}
