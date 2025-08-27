import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/authentication/data/models/user.dart';
import 'package:konto/features/user_account/data/repositories/user_account_repository.dart';

part 'user_account_event.dart';
part 'user_account_state.dart';

class UserAccountBloc extends Bloc<UserAccountEvent, UserAccountState> {
  final UserAccountRepository _userAccountRepository;

  UserAccountBloc()
    : _userAccountRepository = ServiceRegistry().userAccountRepository,
      super(UserAccountInitial()) {
    on<UpdatePersonalDetails>(_updatePersonalDetails);
  }

  Future<void> _updatePersonalDetails(
    UpdatePersonalDetails event,
    Emitter<UserAccountState> emit,
  ) async {
    emit(UserAccountLoading());

    try {
      final result = await _userAccountRepository.updatePersonalDetails(
        fullName: event.fullName,
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
        country: event.country,
        email: event.email,
        accountNumber: event.accountNumber,
        bank: event.bank,
        accountHolder: event.accountHolder,
      );

      if (result.success && result.user != null) {
        emit(
          UserAccountSuccess(updatedUser: result.user!, token: result.token!),
        );
      } else {
        emit(UserAccountError(message: result.message));
      }
    } catch (e) {
      emit(
        UserAccountError(
          message: 'Failed to update personal details: ${e.toString()}',
        ),
      );
    }
  }
}
