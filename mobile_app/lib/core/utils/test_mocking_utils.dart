import 'package:Hoga/core/services/sms_otp_service.dart';
import 'package:Hoga/features/verification/data/api_providers/sms_api_provider.dart';

/// Test utilities for mocking SMS and WhatsApp functionality during tests
class TestMockingUtils {
  /// Enable test mode for all SMS/WhatsApp related services
  /// This will mock all SMS and WhatsApp sending operations
  static void enableTestMode() {
    SmsOtpService.isTestMode = true;
    SmsApiProvider.isTestMode = true;
    print('🧪 TEST MODE ENABLED: SMS and WhatsApp operations will be mocked');
  }

  /// Disable test mode and return to normal operations
  static void disableTestMode() {
    SmsOtpService.isTestMode = false;
    SmsApiProvider.isTestMode = false;
    print(
      '✅ TEST MODE DISABLED: SMS and WhatsApp operations will work normally',
    );
  }

  /// Check if test mode is currently enabled
  static bool get isTestModeEnabled {
    return SmsOtpService.isTestMode && SmsApiProvider.isTestMode;
  }

  /// Reset all test states (useful for test cleanup)
  static void resetTestState() {
    disableTestMode();
  }
}
