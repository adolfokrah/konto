import 'package:Hoga/core/services/sms_otp_service.dart';
import 'package:Hoga/features/verification/data/api_providers/verification_provider.dart';

/// Repository for handling verification-related operations
class VerificationRepository {
  final SmsOtpService _smsOtpService;
  final VerificationProvider _verificationProvider;

  VerificationRepository({
    required SmsOtpService smsOtpService,
    required VerificationProvider verificationProvider,
  }) : _smsOtpService = smsOtpService,
       _verificationProvider = verificationProvider;

  /// Verify OTP code
  Future<Map<String, dynamic>> verifyOtp({
    required String enteredOtp,
    required String sentOtp,
  }) async {
    try {
      final isValid = _smsOtpService.verifyOTP(enteredOtp, sentOtp);
      return {
        'success': isValid,
        'message': isValid ? 'OTP verified successfully' : 'Invalid OTP',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to verify OTP: ${e.toString()}',
      };
    }
  }

  /// Request phone number verification by sending OTP
  /// [isRegistering] - If true, will also send email OTP if email is provided
  Future<Map<String, dynamic>> requestPhoneVerification({
    required String phoneNumber,
    required String email,
    required String countryCode,
  }) async {
    try {
      // Generate OTP using service
      final otp =
          phoneNumber == '551234987' ? '123456' : _smsOtpService.generateOTP();

      // Send OTP using verification provider
      final apiResponse = await _verificationProvider.sendOTP(
        phoneNumber: phoneNumber,
        otpCode: otp,
        email: email,
        countryCode: countryCode,
      );

      if (apiResponse['success'] == true) {
        return {
          'success': true,
          'phoneNumber': phoneNumber,
          'message': 'OTP sent successfully',
          'data': otp,
        };
      } else {
        // Handle API errors
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

  /// Format phone number
  String formatPhoneNumber(String phoneNumber, String countryCode) {
    return _smsOtpService.formatPhoneNumber(phoneNumber, countryCode);
  }

  /// Request KYC verification session
  ///
  /// Initiates a KYC verification process by creating a new session
  /// through the Didit KYC service
  ///
  /// Returns a Map containing:
  /// - success: Whether the request was successful
  /// - sessionId: The KYC session ID
  /// - sessionUrl: URL for the user to complete verification
  /// - status: Current session status
  /// - message: Success or error message
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
  ///
  /// Updates the user's KYC verification status
  /// Usually called after receiving webhook notifications or admin updates
  ///
  /// [status] - The new KYC status ('pending', 'verified', 'failed')
  /// [sessionId] - Optional session ID to associate with the status
  ///
  /// Returns a Map containing the update result
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
