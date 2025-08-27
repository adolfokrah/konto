part of 'momo_payment_bloc.dart';

@immutable
sealed class MomoPaymentState {}

final class MomoPaymentInitial extends MomoPaymentState {}

final class MomoPaymentLoading extends MomoPaymentState {}

final class MomoPaymentSuccess extends MomoPaymentState {
  final MomoChargeModel charge;

  MomoPaymentSuccess(this.charge);
}

final class MomoPaymentOtpSuccess extends MomoPaymentState {}

final class MomoPaymentFailure extends MomoPaymentState {
  final String error;

  MomoPaymentFailure(this.error);
}
