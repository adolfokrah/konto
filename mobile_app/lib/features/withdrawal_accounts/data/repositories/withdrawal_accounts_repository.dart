import 'package:Hoga/features/withdrawal_accounts/data/api_providers/withdrawal_accounts_api_provider.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';

/// Repository orchestrating withdrawal account operations.
class WithdrawalAccountsRepository {
  final WithdrawalAccountsApiProvider _apiProvider;

  WithdrawalAccountsRepository({
    required WithdrawalAccountsApiProvider apiProvider,
  }) : _apiProvider = apiProvider;

  /// List the current user's withdrawal accounts.
  Future<({bool success, String? message, List<WithdrawalAccountModel> accounts})>
  listAccounts() async {
    final result = await _apiProvider.listAccounts();
    if (result['success'] == true) {
      final docs = (result['data'] as List?) ?? [];
      final accounts =
          docs
              .whereType<Map>()
              .map(
                (e) => WithdrawalAccountModel.fromJson(
                  Map<String, dynamic>.from(e),
                ),
              )
              .toList();
      return (success: true, message: null, accounts: accounts);
    }
    return (
      success: false,
      message: result['message'] as String? ?? 'Failed to load accounts',
      accounts: <WithdrawalAccountModel>[],
    );
  }

  /// Create a withdrawal account.
  Future<({bool success, String? message, WithdrawalAccountModel? account})>
  createAccount({
    required String type,
    required String provider,
    required String accountNumber,
    required String accountHolder,
    String? label,
    bool? isDefault,
  }) async {
    final result = await _apiProvider.createAccount(
      type: type,
      provider: provider,
      accountNumber: accountNumber,
      accountHolder: accountHolder,
      label: label,
      isDefault: isDefault,
    );
    if (result['success'] == true && result['data'] != null) {
      return (
        success: true,
        message: null,
        account: WithdrawalAccountModel.fromJson(
          Map<String, dynamic>.from(result['data'] as Map),
        ),
      );
    }
    return (
      success: false,
      message: result['message'] as String? ?? 'Failed to save account',
      account: null,
    );
  }

  Future<({bool success, String? message})> setDefault({
    required String id,
  }) async {
    final result = await _apiProvider.setDefault(id: id);
    return (
      success: result['success'] == true,
      message: result['message'] as String?,
    );
  }

  Future<({bool success, String? message})> deleteAccount({
    required String id,
  }) async {
    final result = await _apiProvider.deleteAccount(id: id);
    return (
      success: result['success'] == true,
      message: result['message'] as String?,
    );
  }

  /// Fetch supported banks.
  Future<({bool success, String? message, List<BankModel> banks})>
  fetchBanks() async {
    final result = await _apiProvider.fetchBanks();
    if (result['success'] == true) {
      final list = (result['data'] as List?) ?? [];
      final banks =
          list
              .whereType<Map>()
              .map((e) => BankModel.fromJson(Map<String, dynamic>.from(e)))
              .toList();
      return (success: true, message: null, banks: banks);
    }
    return (
      success: false,
      message: result['message'] as String? ?? 'Failed to load banks',
      banks: <BankModel>[],
    );
  }

  /// Verify account holder name. Returns the resolved name on success.
  Future<({bool success, String? accountName, String? message})> verifyAccount({
    required String type,
    required String bank,
    required String accountNumber,
  }) async {
    final result = await _apiProvider.verifyAccount(
      type: type,
      bank: bank,
      accountNumber: accountNumber,
    );
    if (result['success'] == true && result['data'] != null) {
      final name = (result['data'] as Map)['account_name']?.toString();
      return (success: true, accountName: name, message: null);
    }
    return (
      success: false,
      accountName: null,
      message: result['message'] as String? ?? 'Could not verify account',
    );
  }
}
