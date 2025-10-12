import 'package:bloc/bloc.dart';
import 'package:Hoga/core/enums/app_theme.dart';
import 'package:Hoga/core/enums/app_language.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/user_account/data/repositories/user_account_repository.dart';

part 'user_account_event.dart';
part 'user_account_state.dart';

class UserAccountBloc extends Bloc<UserAccountEvent, UserAccountState> {
  final UserAccountRepository _userAccountRepository;
  final AuthBloc _authBloc;

  UserAccountBloc({required AuthBloc authBloc})
    : _userAccountRepository = ServiceRegistry().userAccountRepository,
      _authBloc = authBloc,
      super(UserAccountInitial()) {
    on<UpdatePersonalDetails>(_updatePersonalDetails);
    on<DeleteAccount>(_deleteAccount);
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
        appTheme: event.appTheme,
        appLanguage: event.appLanguage,
        photoId: event.photoId,
        fcmToken: event.fcmToken,
      );

      if (result.success && result.user != null) {
        emit(
          UserAccountSuccess(updatedUser: result.user!, token: result.token!),
        );
        _authBloc.add(
          UpdateUserData(updatedUser: result.user!, token: result.token!),
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

  Future<void> _deleteAccount(
    DeleteAccount event,
    Emitter<UserAccountState> emit,
  ) async {
    emit(UserAccountLoading());

    try {
      final result = await _userAccountRepository.deleteAccount(
        reason: event.reason,
      );

      if (result.success) {
        // emit(UserAccountDeleted(message: result.message));
        _authBloc.add(SignOutRequested());
      } else {
        emit(UserAccountError(message: result.message));
      }
    } catch (e) {
      emit(
        UserAccountError(message: 'Failed to delete account: ${e.toString()}'),
      );
    }
  }
}
