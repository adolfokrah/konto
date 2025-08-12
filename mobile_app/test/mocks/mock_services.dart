import 'package:konto/core/services/local_storage_service.dart';
import 'package:konto/core/services/sms_otp_service.dart';
import 'package:konto/features/onboarding/data/repositories/onboarding_repository.dart';

/// Mock LocalStorageService for testing
class MockLocalStorageService extends LocalStorageService {
  final Map<String, String> _storage = {};

  @override
  Future<String?> getToken(String key) async {
    // Simulate fast storage access
    return _storage[key];
  }

  @override
  Future<void> saveToken(String key, String value) async {
    // Simulate fast storage save
    _storage[key] = value;
  }

  @override
  Future<void> deleteToken(String key) async {
    // Simulate fast storage delete
    _storage.remove(key);
  }

  /// Test helper to clear all storage
  Future<void> clearAll() async {
    // Simulate fast storage clear
    _storage.clear();
  }

  /// Test helper to check storage state
  Map<String, String> get storage => Map.from(_storage);
}

/// Mock SmsOtpService for testing
class MockSmsOtpService extends SmsOtpService {
  static bool _isTestMode = true;
  static String _testOtp = '123456';
  
  @override
  String generateOTP() {
    if (_isTestMode) {
      return _testOtp;
    }
    return super.generateOTP();
  }

  @override
  bool verifyOTP(String enteredOtp, String sentOtp) {
    if (_isTestMode) {
      return enteredOtp == _testOtp || enteredOtp == sentOtp;
    }
    return super.verifyOTP(enteredOtp, sentOtp);
  }

  /// Test helpers
  static void setTestMode(bool isTest) => _isTestMode = isTest;
  static void setTestOtp(String otp) => _testOtp = otp;
}

/// Mock OnboardingRepository for testing
class MockOnboardingRepository extends OnboardingRepository {
  bool _onboardingCompleted = false;

  MockOnboardingRepository() : super(localStorageService: MockLocalStorageService());

  @override
  Future<bool> checkOnboardingStatus() async {
    // Fast synchronous response
    return _onboardingCompleted;
  }

  @override
  Future<void> completeOnboarding() async {
    // Fast synchronous completion
    _onboardingCompleted = true;
  }

  @override
  Future<void> resetOnboarding() async {
    // Fast synchronous reset
    _onboardingCompleted = false;
  }

  /// Test helper
  void setOnboardingCompleted(bool completed) => _onboardingCompleted = completed;
}

/// Test utilities for creating mock services
class MockServices {
  static MockLocalStorageService createMockStorage() => MockLocalStorageService();
  static MockSmsOtpService createMockSmsService() => MockSmsOtpService();
  static MockOnboardingRepository createMockOnboardingRepo() => MockOnboardingRepository();

  /// Create a pre-configured set of mock services for testing
  static Map<String, dynamic> createTestServices() {
    return {
      'localStorage': createMockStorage(),
      'smsService': createMockSmsService(),
      'onboardingRepo': createMockOnboardingRepo(),
    };
  }

  /// Reset all mock services to default state
  static void resetAllMocks() {
    MockSmsOtpService.setTestMode(true);
    MockSmsOtpService.setTestOtp('123456');
  }
}
