/// Test configuration constants
class TestConfig {
  // Test mode OTP
  static const String testOtp = '123456';
  
  // Test user data
  static const String testPhoneNumber = '1234567890';
  static const String testCountryCode = '+233';
  static const String testCountry = 'gh';
  static const String testFullName = 'John Doe';
  static const String testEmail = 'john.doe@test.com';
  
  // Test backend config
  static const String testBaseUrl = 'http://192.168.0.160:3000/api';
  
  // Test mode flag
  static bool isTestMode = false;
  
  // Performance optimizations for tests
  static const Duration fastTimeout = Duration(seconds: 5);
  static const Duration mediumTimeout = Duration(seconds: 10);
  static const Duration slowTimeout = Duration(seconds: 15);
  static const Duration pumpDelay = Duration(milliseconds: 50);
  
  // Test categories
  static const String unitTest = 'unit';
  static const String widgetTest = 'widget';
  static const String e2eTest = 'e2e';
  
  /// Enable fast mode for testing
  static void enableFastMode() {
    isTestMode = true;
  }
  
  /// Get timeout based on test type
  static Duration getTimeout(String testType) {
    switch (testType) {
      case unitTest:
        return fastTimeout;
      case widgetTest:
        return mediumTimeout;
      case e2eTest:
        return slowTimeout;
      default:
        return mediumTimeout;
    }
  }
}
