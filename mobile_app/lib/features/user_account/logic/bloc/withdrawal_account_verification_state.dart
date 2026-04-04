part of 'withdrawal_account_verification_bloc.dart';

@immutable
sealed class WithdrawalAccountVerificationState {}

final class WithdrawalAccountVerificationInitial
    extends WithdrawalAccountVerificationState {}

final class WithdrawalAccountVerificationLoading
    extends WithdrawalAccountVerificationState {}

final class WithdrawalAccountVerificationSuccess
    extends WithdrawalAccountVerificationState {
  final String name;
  final String accountNumber;

  WithdrawalAccountVerificationSuccess({
    required this.name,
    required this.accountNumber,
  });
}

final class WithdrawalAccountVerificationFailure
    extends WithdrawalAccountVerificationState {
  final String message;

  WithdrawalAccountVerificationFailure({required this.message});
}
