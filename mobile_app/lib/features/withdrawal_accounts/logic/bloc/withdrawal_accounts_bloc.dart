import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/data/repositories/withdrawal_accounts_repository.dart';

part 'withdrawal_accounts_event.dart';
part 'withdrawal_accounts_state.dart';

class WithdrawalAccountsBloc
    extends Bloc<WithdrawalAccountsEvent, WithdrawalAccountsState> {
  final WithdrawalAccountsRepository _repository;

  WithdrawalAccountsBloc({required WithdrawalAccountsRepository repository})
    : _repository = repository,
      super(const WithdrawalAccountsState()) {
    on<LoadWithdrawalAccounts>(_onLoad);
    on<CreateWithdrawalAccount>(_onCreate);
    on<SetDefaultWithdrawalAccount>(_onSetDefault);
    on<DeleteWithdrawalAccount>(_onDelete);
    on<LoadBanks>(_onLoadBanks);
    on<VerifyWithdrawalAccount>(_onVerify);
  }

  Future<void> _onLoad(
    LoadWithdrawalAccounts event,
    Emitter<WithdrawalAccountsState> emit,
  ) async {
    emit(state.copyWith(
      status: WithdrawalAccountsStatus.loading,
      clearErrorMessage: true,
    ));
    final result = await _repository.listAccounts();
    if (result.success) {
      emit(state.copyWith(
        status: WithdrawalAccountsStatus.loaded,
        accounts: result.accounts,
      ));
    } else {
      emit(state.copyWith(
        status: WithdrawalAccountsStatus.error,
        errorMessage: result.message,
      ));
    }
  }

  Future<void> _onCreate(
    CreateWithdrawalAccount event,
    Emitter<WithdrawalAccountsState> emit,
  ) async {
    emit(state.copyWith(actionInProgress: true, clearErrorMessage: true));
    final result = await _repository.createAccount(
      type: event.type,
      provider: event.provider,
      accountNumber: event.accountNumber,
      accountHolder: event.accountHolder,
      label: event.label,
      isDefault: event.isDefault,
    );
    if (result.success) {
      // Refresh the list so default flags stay consistent.
      final listResult = await _repository.listAccounts();
      emit(state.copyWith(
        actionInProgress: false,
        accounts: listResult.success ? listResult.accounts : state.accounts,
        status: WithdrawalAccountsStatus.loaded,
        createdAccount: result.account,
      ));
    } else {
      emit(state.copyWith(
        actionInProgress: false,
        errorMessage: result.message,
      ));
    }
  }

  Future<void> _onSetDefault(
    SetDefaultWithdrawalAccount event,
    Emitter<WithdrawalAccountsState> emit,
  ) async {
    emit(state.copyWith(actionInProgress: true, clearErrorMessage: true));
    final result = await _repository.setDefault(id: event.id);
    if (result.success) {
      final listResult = await _repository.listAccounts();
      emit(state.copyWith(
        actionInProgress: false,
        accounts: listResult.success ? listResult.accounts : state.accounts,
      ));
    } else {
      emit(state.copyWith(
        actionInProgress: false,
        errorMessage: result.message,
      ));
    }
  }

  Future<void> _onDelete(
    DeleteWithdrawalAccount event,
    Emitter<WithdrawalAccountsState> emit,
  ) async {
    emit(state.copyWith(actionInProgress: true, clearErrorMessage: true));
    final result = await _repository.deleteAccount(id: event.id);
    if (result.success) {
      final listResult = await _repository.listAccounts();
      emit(state.copyWith(
        actionInProgress: false,
        accounts: listResult.success ? listResult.accounts : state.accounts,
      ));
    } else {
      emit(state.copyWith(
        actionInProgress: false,
        errorMessage: result.message,
      ));
    }
  }

  Future<void> _onLoadBanks(
    LoadBanks event,
    Emitter<WithdrawalAccountsState> emit,
  ) async {
    if (state.banks.isNotEmpty) return; // cache
    emit(state.copyWith(banksLoading: true));
    final result = await _repository.fetchBanks();
    emit(state.copyWith(
      banksLoading: false,
      banks: result.success ? result.banks : state.banks,
    ));
  }

  Future<void> _onVerify(
    VerifyWithdrawalAccount event,
    Emitter<WithdrawalAccountsState> emit,
  ) async {
    emit(state.copyWith(verifying: true, clearVerification: true));
    final result = await _repository.verifyAccount(
      type: event.type,
      bank: event.bank,
      accountNumber: event.accountNumber,
    );
    if (result.success) {
      emit(state.copyWith(verifying: false, verifiedName: result.accountName));
    } else {
      emit(state.copyWith(verifying: false, verifyError: result.message));
    }
  }
}
