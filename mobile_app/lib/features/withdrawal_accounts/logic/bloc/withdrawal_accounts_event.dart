part of 'withdrawal_accounts_bloc.dart';

@immutable
sealed class WithdrawalAccountsEvent {}

/// Load the current user's withdrawal accounts.
final class LoadWithdrawalAccounts extends WithdrawalAccountsEvent {}

/// Create a new withdrawal account.
final class CreateWithdrawalAccount extends WithdrawalAccountsEvent {
  final String type; // 'mobile-money' | 'bank'
  final String provider;
  final String accountNumber;
  final String accountHolder;
  final String? label;
  final bool isDefault;

  CreateWithdrawalAccount({
    required this.type,
    required this.provider,
    required this.accountNumber,
    required this.accountHolder,
    this.label,
    this.isDefault = false,
  });
}

/// Set an account as the default.
final class SetDefaultWithdrawalAccount extends WithdrawalAccountsEvent {
  final String id;
  SetDefaultWithdrawalAccount({required this.id});
}

/// Delete an account.
final class DeleteWithdrawalAccount extends WithdrawalAccountsEvent {
  final String id;
  DeleteWithdrawalAccount({required this.id});
}

/// Load the supported banks (for the bank add flow).
final class LoadBanks extends WithdrawalAccountsEvent {}

/// Verify the account holder name.
final class VerifyWithdrawalAccount extends WithdrawalAccountsEvent {
  final String type; // 'mobile-money' | 'bank'
  final String bank; // operator or bank code
  final String accountNumber; // phone number or account number

  VerifyWithdrawalAccount({
    required this.type,
    required this.bank,
    required this.accountNumber,
  });
}
