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
