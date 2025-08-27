part of 'withdrawal_account_verification_bloc.dart';

@immutable
sealed class WithdrawalAccountVerificationEvent {}

final class RequestValidateWithdrawalAccountEvent
    extends WithdrawalAccountVerificationEvent {
  final String phoneNumber;
  final String bank;
  final String name;

  RequestValidateWithdrawalAccountEvent({
    required this.phoneNumber,
    required this.bank,
    required this.name,
  });
}
