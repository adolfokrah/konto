import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/user_account/data/repositories/user_account_repository.dart';
import 'package:meta/meta.dart';

part 'withdrawal_account_verification_event.dart';
part 'withdrawal_account_verification_state.dart';

class WithdrawalAccountVerificationBloc
    extends
        Bloc<
          WithdrawalAccountVerificationEvent,
          WithdrawalAccountVerificationState
        > {
  final UserAccountRepository _userAccountRepository;

  WithdrawalAccountVerificationBloc()
    : _userAccountRepository = ServiceRegistry().userAccountRepository,
      super(WithdrawalAccountVerificationInitial()) {
    on<RequestValidateWithdrawalAccountEvent>(
      _onRequestValidateWithdrawalAccount,
    );
  }

  Future<void> _onRequestValidateWithdrawalAccount(
    RequestValidateWithdrawalAccountEvent event,
    Emitter<WithdrawalAccountVerificationState> emit,
  ) async {
    emit(WithdrawalAccountVerificationLoading());

    final result = await _userAccountRepository.verifyAccountDetails(
      phoneNumber: event.phoneNumber,
      bank: event.bank,
      name: event.name,
    );

    if (result.success) {
      emit(
        WithdrawalAccountVerificationSuccess(
          message: result.message,
          valid: result.valid,
        ),
      );
    } else {
      emit(WithdrawalAccountVerificationFailure(message: result.message));
    }
  }
}
