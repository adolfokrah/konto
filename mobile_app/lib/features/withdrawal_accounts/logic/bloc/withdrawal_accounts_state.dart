part of 'withdrawal_accounts_bloc.dart';

enum WithdrawalAccountsStatus { initial, loading, loaded, error }

@immutable
class WithdrawalAccountsState {
  /// Status of the account list.
  final WithdrawalAccountsStatus status;
  final List<WithdrawalAccountModel> accounts;
  final String? errorMessage;

  /// True while a mutating action (create/setDefault/delete) is running.
  final bool actionInProgress;

  /// Banks list + loading flag for the bank add flow.
  final List<BankModel> banks;
  final bool banksLoading;

  /// Name-verification transient state.
  final bool verifying;
  final String? verifiedName;
  final String? verifyError;

  /// One-shot signal set when an account is created successfully.
  final WithdrawalAccountModel? createdAccount;

  const WithdrawalAccountsState({
    this.status = WithdrawalAccountsStatus.initial,
    this.accounts = const [],
    this.errorMessage,
    this.actionInProgress = false,
    this.banks = const [],
    this.banksLoading = false,
    this.verifying = false,
    this.verifiedName,
    this.verifyError,
    this.createdAccount,
  });

  WithdrawalAccountsState copyWith({
    WithdrawalAccountsStatus? status,
    List<WithdrawalAccountModel>? accounts,
    String? errorMessage,
    bool? actionInProgress,
    List<BankModel>? banks,
    bool? banksLoading,
    bool? verifying,
    String? verifiedName,
    String? verifyError,
    WithdrawalAccountModel? createdAccount,
    bool clearErrorMessage = false,
    bool clearVerification = false,
    bool clearCreatedAccount = false,
  }) {
    return WithdrawalAccountsState(
      status: status ?? this.status,
      accounts: accounts ?? this.accounts,
      errorMessage: clearErrorMessage ? null : (errorMessage ?? this.errorMessage),
      actionInProgress: actionInProgress ?? this.actionInProgress,
      banks: banks ?? this.banks,
      banksLoading: banksLoading ?? this.banksLoading,
      verifying: verifying ?? this.verifying,
      verifiedName: clearVerification ? null : (verifiedName ?? this.verifiedName),
      verifyError: clearVerification ? null : (verifyError ?? this.verifyError),
      createdAccount:
          clearCreatedAccount ? null : (createdAccount ?? this.createdAccount),
    );
  }
}
