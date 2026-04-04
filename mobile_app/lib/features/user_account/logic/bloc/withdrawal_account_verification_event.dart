part of 'withdrawal_account_verification_bloc.dart';

@immutable
sealed class WithdrawalAccountVerificationEvent {}

final class RequestValidateWithdrawalAccountEvent
    extends WithdrawalAccountVerificationEvent {
  final String accountNumber;
  final String bank;
  final String paymentMethod;

  RequestValidateWithdrawalAccountEvent({
    required this.accountNumber,
    required this.bank,
    required this.paymentMethod,
  });
}
