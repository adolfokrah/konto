part of 'verification_bloc.dart';

@immutable
sealed class VerificationState {
  const VerificationState();
}

final class VerificationInitial extends VerificationState {
  const VerificationInitial();
}

final class VerificationLoading extends VerificationState {
  const VerificationLoading();
}

final class VerificationSuccess extends VerificationState {
  const VerificationSuccess();
}

final class VerificationCodeSent extends VerificationState {
  final String otpCode;
  const VerificationCodeSent({required this.otpCode});
}

final class VerificationFailure extends VerificationState {
  final String errorMessage;

  const VerificationFailure(this.errorMessage);
}
