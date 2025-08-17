import 'dart:ui';
import 'package:konto/l10n/app_localizations.dart';

/// Translation service for accessing localized strings without context
/// This is particularly useful for BLoCs and other business logic classes
class TranslationService {
  static final TranslationService _instance = TranslationService._internal();
  factory TranslationService() => _instance;
  TranslationService._internal();

  AppLocalizations? _localizations;

  /// Initialize with current locale from system or app
  void initialize([Locale? locale]) {
    final currentLocale = locale ?? PlatformDispatcher.instance.locale;
    _localizations = lookupAppLocalizations(currentLocale);
  }

  /// Update localizations when locale changes
  void updateLocale(Locale locale) {
    _localizations = lookupAppLocalizations(locale);
  }

  /// Get current localizations - throws if not initialized
  AppLocalizations get localizations {
    if (_localizations == null) {
      // Initialize with default locale if not already initialized
      initialize();
    }
    return _localizations!;
  }

  // Convenience getters for commonly used error messages
  String get errorCheckingPhoneAvailability =>
      localizations.errorCheckingPhoneAvailability;
  String get failedToCheckPhoneNumber => localizations.failedToCheckPhoneNumber;
  String get loginFailed => localizations.loginFailed;
  String get registrationFailed => localizations.registrationFailed;
  String get failedToSignOut => localizations.failedToSignOut;
  String get otpDoesNotMatch => localizations.otpDoesNotMatch;
  String get failedToSendVerificationCode =>
      localizations.failedToSendVerificationCode;
  String get failedToSendVerificationCodeTryAgain =>
      localizations.failedToSendVerificationCodeTryAgain;

  String get failedToReloadJarSummary => localizations.failedToReloadJarSummary;

  /// Format error message with dynamic content
  String errorCheckingPhoneAvailabilityWithMessage(String message) {
    return '${localizations.errorCheckingPhoneAvailability}: $message';
  }

  String loginFailedWithDetails(String details) {
    return '${localizations.loginFailed}: $details';
  }

  String registrationFailedWithDetails(String details) {
    return '${localizations.registrationFailed}: $details';
  }

  String failedToSignOutWithDetails(String details) {
    return '${localizations.failedToSignOut}: $details';
  }

  /// Get formatted OTP SMS message
  String getOtpSmsMessage(String otp, int minutes) {
    return localizations.otpSmsMessage(otp, minutes);
  }

  /// Get formatted unexpected error message
  String unexpectedErrorOccurredWithDetails(String error) {
    return localizations.unexpectedErrorOccurred(error);
  }
}
