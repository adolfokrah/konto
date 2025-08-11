// Simple SMS OTP Service - Much cleaner than Firebase!
import 'dart:math';
import 'package:konto/core/config/sms_config.dart';

class SmsOtpService {
  // Generate random 6-digit OTP
  String generateOTP() {
    Random random = Random();
    return (100000 + random.nextInt(900000)).toString();
  }
  
  // Verify OTP (simple comparison)
  bool verifyOTP(String enteredOtp, String sentOtp) {
    return enteredOtp.trim() == sentOtp.trim();
  }
  
  // Format phone number
  String formatPhoneNumber(String phoneNumber, String countryCode) {
    String cleanNumber = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
    
    if (!cleanNumber.startsWith(countryCode.replaceAll('+', ''))) {
      cleanNumber = '${countryCode.replaceAll('+', '')}$cleanNumber';
    }
    
    return '+$cleanNumber';
  }
  
  // Generate OTP message
  String generateOtpMessage(String otp) {
    return SmsConfig.getOtpMessage(otp);
  }
}
