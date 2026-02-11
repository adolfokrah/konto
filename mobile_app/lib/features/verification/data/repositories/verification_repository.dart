import 'package:Hoga/features/verification/data/api_providers/verification_provider.dart';

/// Repository for handling verification-related operations
class VerificationRepository {
  final VerificationProvider _verificationProvider;

  VerificationRepository({
    required VerificationProvider verificationProvider,
  }) : _verificationProvider = verificationProvider;

  /// Verify OTP code via backend
  Future<Map<String, dynamic>> verifyOtp({
    required String phoneNumber,
    required String countryCode,
    required String code,
  }) async {
    try {
      final result = await _verificationProvider.verifyOTP(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        code: code,
      );
      return {
        'success': result['verified'] == true,
        'message': result['message'] ?? 'OTP verification failed',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to verify OTP: ${e.toString()}',
      };
    }
  }

  /// Request phone number verification by sending OTP
  Future<Map<String, dynamic>> requestPhoneVerification({
    required String phoneNumber,
    required String email,
    required String countryCode,
  }) async {
    try {
      final apiResponse = await _verificationProvider.sendOTP(
        phoneNumber: phoneNumber,
        email: email,
        countryCode: countryCode,
      );

      if (apiResponse['success'] == true) {
        return {
          'success': true,
          'phoneNumber': phoneNumber,
          'message': 'OTP sent successfully',
        };
      } else {
        final errorMessage = apiResponse['error'] ?? 'Unknown error';
        print('❌ OTP API error: $errorMessage');
        return {
          'success': false,
          'message': 'Failed to send OTP: $errorMessage',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to request phone verification: ${e.toString()}',
      };
    }
  }

  /// Request KYC verification session
  Future<Map<String, dynamic>> requestKycVerification() async {
    try {
      final result = await _verificationProvider.requestKyc();
      return result;
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to request KYC verification: ${e.toString()}',
      };
    }
  }

  /// Update KYC status
  Future<Map<String, dynamic>> updateKycStatus({
    required String status,
    String? sessionId,
  }) async {
    try {
      final result = await _verificationProvider.updateKycStatus(
        status: status,
        sessionId: sessionId,
      );
      return result;
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to update KYC status: ${e.toString()}',
      };
    }
  }
}
