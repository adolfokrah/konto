part of 'verification_bloc.dart';

@immutable
sealed class VerificationState {
  const VerificationState();
}

final class VerificationInitial extends VerificationState {
  const VerificationInitial();
}

final class VerificationOtpInput extends VerificationState {
  final String otp;
  final bool isComplete;
  final bool hasError;
  final String? errorMessage;

  const VerificationOtpInput({
    this.otp = '',
    this.isComplete = false,
    this.hasError = false,
    this.errorMessage,
  });

  VerificationOtpInput copyWith({
    String? otp,
    bool? isComplete,
    bool? hasError,
    String? errorMessage,
  }) {
    return VerificationOtpInput(
      otp: otp ?? this.otp,
      isComplete: isComplete ?? this.isComplete,
      hasError: hasError ?? this.hasError,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

final class VerificationLoading extends VerificationState {
  const VerificationLoading();
}

final class VerificationSuccess extends VerificationState {
  const VerificationSuccess();
}

final class VerificationFailure extends VerificationState {
  final String errorMessage;

  const VerificationFailure(this.errorMessage);
}

final class VerificationResendSuccess extends VerificationState {
  const VerificationResendSuccess();
}

final class VerificationResendFailure extends VerificationState {
  final String errorMessage;

  const VerificationResendFailure(this.errorMessage);
}
