import 'package:flutter_test/flutter_test.dart';
import 'package:konto/core/services/sms_otp_service.dart';
import '../config/test_config.dart';

void main() {
  group('Basic Authentication Tests', () {
    setUp(() {
      TestConfig.isTestMode = true;
      SmsOtpService.isTestMode = true;
    });

    test('SMS OTP Service should use fixed OTP in test mode', () {
      final smsService = SmsOtpService();
      
      // Generate OTP in test mode
      final generatedOtp = smsService.generateOTP();
      
      // Should return fixed test OTP
      expect(generatedOtp, equals('123456'));
    });

    test('SMS OTP Service should verify test OTP correctly', () {
      final smsService = SmsOtpService();
      
      // Verify the test OTP
      final isValid = smsService.verifyOTP('123456', 'any_sent_otp');
      
      // Should return true for test OTP
      expect(isValid, isTrue);
    });

    test('SMS OTP Service should also accept actual sent OTP in test mode', () {
      final smsService = SmsOtpService();
      
      final sentOtp = '654321';
      
      // Should accept the actual sent OTP too
      final isValid = smsService.verifyOTP(sentOtp, sentOtp);
      expect(isValid, isTrue);
    });

    test('Test configuration should have correct values', () {
      expect(TestConfig.isTestMode, isTrue);
      expect(TestConfig.testOtp, equals('123456'));
      expect(TestConfig.testPhoneNumber, equals('1234567890'));
      expect(TestConfig.testCountryCode, equals('+233'));
      expect(TestConfig.testFullName, equals('John Doe'));
      expect(TestConfig.testEmail, equals('john.doe@test.com'));
      expect(TestConfig.testCountry, equals('gh'));
    });
  });
}
