import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/authentication/data/models/user.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc() : super(const AuthInitial()) {
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
      final authRepository = ServiceRegistry().authRepository;
      final translationService = ServiceRegistry().translationService;

      // Check user existence
      final response = await authRepository.checkUserExistence(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
        email: event.email,
      );

      print(response);

      if (response['exists'] == true) {
        // Emit a success state indicating phone number is available
        emit(
          PhoneNumberAvailable(
            phoneNumber: event.phoneNumber,
            countryCode: event.countryCode,
          ),
        );
      } else if (response['exists'] == false) {
        emit(
          PhoneNumberNotAvailable(
            phoneNumber: event.phoneNumber,
            countryCode: event.countryCode,
          ),
        );
      } else {
        throw Exception(
          translationService.errorCheckingPhoneAvailabilityWithMessage(
            response['message'],
          ),
        );
      }
    } catch (e) {
      final translationService = ServiceRegistry().translationService;
      emit(AuthError(error: translationService.failedToCheckPhoneNumber));
    }
  }

  Future<void> _onRequestLogin(
    RequestLogin event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final authRepository = ServiceRegistry().authRepository;

      // Attempt to login with the provided phone number and country code
      final loginResult = await authRepository.loginWithPhoneNumber(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
      );

      if (loginResult['success'] == true) {
        final user = loginResult['user'] as User;
        final token = loginResult['token'] as String?;

        emit(AuthAuthenticated(user: user, token: token ?? ''));
      } else {
        final translationService = ServiceRegistry().translationService;
        emit(
          AuthError(
            error: loginResult['message'] ?? translationService.loginFailed,
          ),
        );
      }
    } catch (e) {
      final translationService = ServiceRegistry().translationService;
      emit(
        AuthError(
          error: translationService.loginFailedWithDetails(e.toString()),
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
      final authRepository = ServiceRegistry().authRepository;

      // Register user after OTP verification
      final result = await authRepository.registerUser(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
        country: event.country,
        fullName: event.fullName,
        email: event.email,
      );

      if (result['success'] == true) {
        final user = result['user'] as User;
        final token = result['token'] as String?;

        emit(AuthAuthenticated(user: user, token: token ?? ''));
      } else {
        final translationService = ServiceRegistry().translationService;
        emit(
          AuthError(
            error: result['message'] ?? translationService.registrationFailed,
          ),
        );
      }
    } catch (e) {
      final translationService = ServiceRegistry().translationService;
      emit(
        AuthError(
          error: translationService.registrationFailedWithDetails(e.toString()),
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
      final authRepository = ServiceRegistry().authRepository;

      // Check if there's any user data stored locally first
      final isLoggedIn = await authRepository.isUserLoggedIn();

      if (!isLoggedIn) {
        emit(AuthInitial());
        return;
      }

      // Attempt auto-login using stored phone number and country code
      final autoLoginResult = await authRepository.autoLogin();

      if (autoLoginResult['success'] == true) {
        final user = autoLoginResult['user'];
        final token = autoLoginResult['token'];

        emit(AuthAuthenticated(user: user, token: token));
      } else {
        emit(AuthInitial());
      }
    } catch (e) {
      emit(AuthInitial());
    }
  }

  Future<void> _onSignOutRequested(
    SignOutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final authRepository = ServiceRegistry().authRepository;

      // Clear user session
      await authRepository.signOut();

      emit(const AuthInitial());
    } catch (e) {
      final translationService = ServiceRegistry().translationService;
      emit(
        AuthError(
          error: translationService.failedToSignOutWithDetails(e.toString()),
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
