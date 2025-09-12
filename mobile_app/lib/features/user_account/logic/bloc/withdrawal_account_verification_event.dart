part of 'withdrawal_account_verification_bloc.dart';

@immutable
sealed class WithdrawalAccountVerificationEvent {}

final class RequestValidateWithdrawalAccountEvent
    extends WithdrawalAccountVerificationEvent {
  final String phoneNumber;
  final String bank;

  RequestValidateWithdrawalAccountEvent({
    required this.phoneNumber,
    required this.bank,
  });
}
