part of 'momo_payment_bloc.dart';

@immutable
sealed class MomoPaymentEvent {}

final class MomoPaymentRequested extends MomoPaymentEvent {
  final String contributionId;

  MomoPaymentRequested(this.contributionId);
}

final class SubmitOtpRequested extends MomoPaymentEvent {
  final String otpCode;
  final String reference;

  SubmitOtpRequested({required this.otpCode, required this.reference});
}

final class VerifyPaymentRequested extends MomoPaymentEvent {
  final String reference;

  VerifyPaymentRequested(this.reference);
}
