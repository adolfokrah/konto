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

  PhoneNumberVerificationRequested({required this.phoneNumber});
}

final class VerificationSuccessRequested extends VerificationEvent {}
