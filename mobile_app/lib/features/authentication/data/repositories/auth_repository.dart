import 'package:konto/core/services/sms_otp_service.dart';
import 'package:konto/features/authentication/data/api_providers/auth_api_provider.dart';

/// Repository for authentication operations
/// Orchestrates business logic between UI and API calls
class AuthRepository {
  final SmsOtpService _smsOtpService;
  final AuthApiProvider _authApiProvider;

  AuthRepository({
    required SmsOtpService smsOtpService,
    required AuthApiProvider authApiProvider,
  })  : _smsOtpService = smsOtpService,
        _authApiProvider = authApiProvider;

  /// Start phone number verification process
  Future<Map<String, dynamic>> verifyPhoneNumber({
    required String phoneNumber,
    required String countryCode,
  }) async {
    try {
      // Generate OTP
      String otp = _smsOtpService.generateOTP();
      
      // Use the already formatted phone number (formatted in bloc)
      // No need to format again as it's already done in the bloc
      String formattedNumber = phoneNumber;
      
      // Generate message
      String message = _smsOtpService.generateOtpMessage(otp);
      
      // Send SMS via API provider
      print('🚀 Starting phone verification for: $formattedNumber');
      final apiResponse = await _authApiProvider.sendAuthOtp(
        phoneNumber: formattedNumber,
        message: message,
      );
      
      print('📡 API Response received: $apiResponse');
      
      if (apiResponse['success'] == true) {
        // Check Mnotify specific response
        final mnotifyData = apiResponse['data'];
        print('📋 Mnotify Data: $mnotifyData');
        
        final isSuccess = mnotifyData['status'] == 'success' || 
                         mnotifyData['code'] == '2000';
        
        if (isSuccess) {
          print('✅ SMS sent successfully to $formattedNumber');
          return {
            'success': true,
            'message': 'OTP sent successfully',
            'otp': otp,
            'phoneNumber': formattedNumber,
          };
        } else {
          print('❌ SMS sending failed: ${mnotifyData['message'] ?? 'Unknown error'}');
          return {
            'success': false,
            'message': 'Failed to send OTP: ${mnotifyData['message'] ?? 'Unknown error'}',
          };
        }
      } else {
        print('💥 API Error: ${apiResponse['message']}');
        return {
          'success': false,
          'message': 'Network error: ${apiResponse['error']}',
          'errorType': apiResponse['dioErrorType'] ?? 'unknown',
        };
      }
    } catch (e) {
      print('💥 Repository Exception: $e');
      return {
        'success': false,
        'message': 'Error: ${e.toString()}'
      };
    }
  }

  /// Verify OTP
  Future<Map<String, dynamic>> verifyOTP({
    required String enteredOtp,
    required String sentOtp,
    required String phoneNumber,
  }) async {
    try {
      if (enteredOtp == sentOtp) {
        print('✅ OTP verification successful for: $phoneNumber');
        return {
          'success': true,
          'message': 'Phone number verified successfully',
          'phoneNumber': phoneNumber,
        };
      } else {
        print('❌ OTP verification failed - codes do not match');
        return {
          'success': false,
          'message': 'Invalid OTP code. Please check and try again.',
        };
      }
    } catch (e) {
      print('💥 OTP Verification Exception: $e');
      return {
        'success': false,
        'message': 'Error verifying OTP: ${e.toString()}'
      };
    }
  }

  /// Format phone number with country code
  String formatPhoneNumber(String phoneNumber, String countryCode) {
    return _smsOtpService.formatPhoneNumber(phoneNumber, countryCode);
  }

  /// Sign out user
  Future<void> signOut() async {
    // Simple sign out - just clear any cached data
    // In a real app, this might clear stored tokens, etc.
    print('🚪 User signed out');
  }
}
