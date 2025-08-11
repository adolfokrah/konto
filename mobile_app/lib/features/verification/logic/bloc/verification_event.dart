part of 'verification_bloc.dart';

@immutable
sealed class VerificationEvent {}

final class OtpChanged extends VerificationEvent {
  final String otp;

  OtpChanged(this.otp);
}

final class OtpSubmitted extends VerificationEvent {
  final String otp;

  OtpSubmitted(this.otp);
}

final class ResendOtpRequested extends VerificationEvent {}

final class ClearOtp extends VerificationEvent {}

// Initialize verification session with data from auth
final class InitializeVerification extends VerificationEvent {
  final String phoneNumber;
  final String sentOtp;
  final String countryCode;

  InitializeVerification({
    required this.phoneNumber,
    required this.sentOtp,
    required this.countryCode,
  });
}

// Simple Phone Verification Events
final class PhoneNumberVerificationRequested extends VerificationEvent {
  final String phoneNumber;

  PhoneNumberVerificationRequested(this.phoneNumber);
}
