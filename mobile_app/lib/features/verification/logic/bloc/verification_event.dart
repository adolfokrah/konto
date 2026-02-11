part of 'verification_bloc.dart';

@immutable
sealed class VerificationEvent {}

final class OtpChanged extends VerificationEvent {
  final String otp;

  OtpChanged(this.otp);
}

// Simple Phone Verification Events
final class PhoneNumberVerificationRequested extends VerificationEvent {
  final String phoneNumber;
  final String email;
  final String countryCode;

  PhoneNumberVerificationRequested({
    required this.phoneNumber,
    required this.email,
    required this.countryCode,
  });
}

final class VerificationSuccessRequested extends VerificationEvent {}

final class OtpVerificationRequested extends VerificationEvent {
  final String phoneNumber;
  final String countryCode;
  final String code;

  OtpVerificationRequested({
    required this.phoneNumber,
    required this.countryCode,
    required this.code,
  });
}
