import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/authentication/data/repositories/auth_repository.dart';
import 'package:Hoga/core/services/translation_service.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;
  final TranslationService _translationService;

  AuthBloc({
    required AuthRepository authRepository,
    required TranslationService translationService,
  }) : _authRepository = authRepository,
       _translationService = translationService,
       super(const AuthInitial()) {
    on<RequestRegistration>(_onRequestRegistration);
    on<AutoLoginRequested>(_onAutoLoginRequested);
    on<CheckUserExistence>(_onCheckUserExistence);
    on<RequestLogin>(_onRequestLogin);
    on<SignOutRequested>(_onSignOutRequested);
    on<UpdateUserData>(_onUpdateUserData);
  }

  /// Checks if the phone number is available for registration
  Future<void> _onCheckUserExistence(
    CheckUserExistence event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      // Check user existence
      final response = await _authRepository.checkUserExistence(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
        email: event.email,
        username: event.username,
      );

      if (response['exists'] == true) {
        // User exists - check which field conflicts
        final conflictField = response['conflictField'];
        final message = response['message'] ?? 'User already exists';

        // If username or email conflicts, show as error
        if (conflictField == 'username' || conflictField == 'email') {
          emit(AuthError(error: message));
        } else {
          // Phone number conflict - user should login
          emit(
            PhoneNumberNotAvailable(
              phoneNumber: event.phoneNumber,
              countryCode: event.countryCode,
              email: response['email'],
            ),
          );
        }
      } else if (response['exists'] == false) {
        // User doesn't exist - available for registration
        emit(
          PhoneNumberAvailable(
            phoneNumber: event.phoneNumber,
            countryCode: event.countryCode,
            email: response['email'],
          ),
        );
      } else {
        throw Exception(
          _translationService.errorCheckingPhoneAvailabilityWithMessage(
            response['message'],
          ),
        );
      }
    } catch (e) {
      emit(AuthError(error: _translationService.failedToCheckPhoneNumber));
    }
  }

  Future<void> _onRequestLogin(
    RequestLogin event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      // Attempt to login with the provided phone number and country code
      final loginResult = await _authRepository.loginWithPhoneNumber(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
      );

      if (loginResult['success'] == true) {
        final user = loginResult['user'] as User;
        final token = loginResult['token'] as String?;

        emit(AuthAuthenticated(user: user, token: token ?? ''));
      } else {
        emit(
          AuthError(
            error: loginResult['message'] ?? _translationService.loginFailed,
          ),
        );
      }
    } catch (e) {
      emit(
        AuthError(
          error: _translationService.loginFailedWithDetails(e.toString()),
        ),
      );
    }
  }

  Future<void> _onRequestRegistration(
    RequestRegistration event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      // Register user after OTP verification
      final result = await _authRepository.registerUser(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
        country: event.country,
        firstName: event.firstName,
        lastName: event.lastName,
        username: event.username,
        email: event.email,
      );

      if (result['success'] == true) {
        final user = result['user'] as User;
        final token = result['token'] as String?;

        emit(AuthAuthenticated(user: user, token: token ?? ''));
      } else {
        emit(
          AuthError(
            error: result['message'] ?? _translationService.registrationFailed,
          ),
        );
      }
    } catch (e) {
      emit(
        AuthError(
          error: _translationService.registrationFailedWithDetails(e.toString()),
        ),
      );
    }
  }

  /// Auto login handler - uses stored user data to re-authenticate with backend
  Future<void> _onAutoLoginRequested(
    AutoLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      print('🔄 Starting auto login process...');

      // Check if there's any user data stored locally first
      final isLoggedIn = await _authRepository.isUserLoggedIn();
      print('🔐 Is user logged in: $isLoggedIn');

      if (!isLoggedIn) {
        print('❌ User not logged in, emitting AuthInitial');
        emit(const AuthInitial());
        return;
      }

      // Attempt auto-login using stored phone number and country code
      print('🔄 Attempting auto login...');
      final autoLoginResult = await _authRepository.autoLogin();
      print(
        '🔄 Auto login result: ${autoLoginResult['success']} - ${autoLoginResult['message']}',
      );

      if (autoLoginResult['success'] == true) {
        final user = autoLoginResult['user'];
        final token = autoLoginResult['token'];
        print('✅ Auto login successful, emitting AuthAuthenticated');

        emit(AuthAuthenticated(user: user, token: token));
      } else {
        print('❌ Auto login failed: ${autoLoginResult['message']}');
        emit(const AuthInitial());
      }
    } catch (e) {
      print('💥 Auto login exception: $e');
      emit(const AuthInitial());
    }
  }

  Future<void> _onSignOutRequested(
    SignOutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      // Clear user session
      await _authRepository.signOut();

      emit(const AuthInitial());
    } catch (e) {
      emit(
        AuthError(
          error: _translationService.failedToSignOutWithDetails(e.toString()),
        ),
      );
    }
  }

  Future<void> _onUpdateUserData(
    UpdateUserData event,
    Emitter<AuthState> emit,
  ) async {
    final updatedUser = event.updatedUser;
    final token = event.token;

    emit(AuthAuthenticated(user: updatedUser, token: token));
  }
}
