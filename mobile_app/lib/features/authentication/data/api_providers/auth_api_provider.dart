import 'package:konto/features/verification/data/api_providers/sms_api_provider.dart';

/// API Provider for authentication-related operations
/// Reuses the SMS API provider for sending OTP messages
class AuthApiProvider {
  final SmsApiProvider _smsApiProvider;
  
  AuthApiProvider({
    required SmsApiProvider smsApiProvider,
  }) : _smsApiProvider = smsApiProvider;
  
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
