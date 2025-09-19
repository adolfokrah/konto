import 'package:Hoga/core/services/sms_otp_service.dart';
import 'package:Hoga/features/verification/data/api_providers/sms_api_provider.dart';

/// Repository for handling verification-related operations
class VerificationRepository {
  final SmsOtpService _smsOtpService;
  final SmsApiProvider _smsApiProvider;

  VerificationRepository({
    required SmsOtpService smsOtpService,
    required SmsApiProvider smsApiProvider,
  }) : _smsOtpService = smsOtpService,
       _smsApiProvider = smsApiProvider;

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
  Future<Map<String, dynamic>> requestPhoneVerification({
    required String phoneNumber,
  }) async {
    try {
      // Generate OTP using service
      final otp = _smsOtpService.generateOTP();

      // Generate message using service
      final message = _smsOtpService.generateOtpMessage(otp);

      // Send SMS using API provider
      final apiResponse = await _smsApiProvider.sendSms(
        phoneNumber: phoneNumber,
        message: message,
      );

      await _smsApiProvider.sendWhatsAppOtp(
        phoneNumber: phoneNumber,
        otpCode: otp,
      );

      if (apiResponse['success'] == true) {
        // Check Mnotify specific response
        final mnotifyData = apiResponse['data'];
        final isSuccess =
            mnotifyData['status'] == 'success' || mnotifyData['code'] == '2000';

        if (isSuccess) {
          print('✅ SMS sent successfully to $phoneNumber');
          return {
            'success': true,
            'otp': otp, // In production, this should not be returned
            'phoneNumber': phoneNumber,
            'message': 'OTP sent successfully',
          };
        } else {
          print(
            '❌ Mnotify error: ${mnotifyData['message'] ?? 'Unknown error'}',
          );
          return {
            'success': false,
            'message':
                'Failed to send OTP: ${mnotifyData['message'] ?? 'Unknown error'}',
          };
        }
      } else {
        print('❌ API error: ${apiResponse['error']}');
        return {
          'success': false,
          'message': 'Failed to send OTP: ${apiResponse['error']}',
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
}
