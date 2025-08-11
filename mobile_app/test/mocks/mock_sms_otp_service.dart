import 'package:konto/core/services/sms_otp_service.dart';
import '../config/test_config.dart';

/// Mock SMS OTP service for testing
/// Always returns the test OTP in test mode
class MockSmsOtpService extends SmsOtpService {
  @override
  String generateOTP() {
    if (TestConfig.isTestMode) {
      return TestConfig.testOtp;
    }
    // Use parent class implementation for non-test mode
    return super.generateOTP();
  }

  @override
  bool verifyOTP(String enteredOtp, String sentOtp) {
    if (TestConfig.isTestMode) {
      // In test mode, always accept the test OTP
      return enteredOtp.trim() == TestConfig.testOtp;
    }
    return super.verifyOTP(enteredOtp, sentOtp);
  }

  @override
  String generateOtpMessage(String otp) {
    return 'Your Konto verification code is: $otp. Do not share this code with anyone.';
  }

  @override
  String formatPhoneNumber(String phoneNumber, String countryCode) {
    // Remove any existing country code from phone number
    String cleanNumber = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
    
    // Remove country code if it's already at the beginning
    String countryDigits = countryCode.replaceAll('+', '');
    if (cleanNumber.startsWith(countryDigits)) {
      cleanNumber = cleanNumber.substring(countryDigits.length);
    }
    
    // Return formatted international number
    return '$countryCode$cleanNumber';
  }
}
