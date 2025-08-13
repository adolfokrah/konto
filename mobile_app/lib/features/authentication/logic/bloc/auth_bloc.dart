import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/authentication/data/models/user.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {

  
  AuthBloc() : super(const AuthInitial()) {
    on<UserRegistrationWithOtpRequested>(_onUserRegistrationWithOtpRequested);
    on<AutoLoginRequested>(_onAutoLoginRequested);
    on<PhoneNumberAvailabilityChecked>(_onPhoneNumberAvailabilityChecked);
    on<RequestLogin>(_onRequestLogin);
    on<SignOutRequested>(_onSignOutRequested);
  }

  /// Checks if the phone number is available for registration
  Future<void> _onPhoneNumberAvailabilityChecked(
    PhoneNumberAvailabilityChecked event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final authRepository = ServiceRegistry().authRepository;
      
      // Check phone number availability
      final isAvailable = await authRepository.checkPhoneNumberAvailability(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
      );
      
      if (isAvailable['exists'] == true) {
        // Emit a success state indicating phone number is available
        emit(PhoneNumberAvailable(
          phoneNumber: event.phoneNumber,
          countryCode: event.countryCode,
        ));
      } else {
        emit(PhoneNumberNotAvailable(
          phoneNumber: event.phoneNumber,
          countryCode: event.countryCode,
        ));
      }
    } catch (e) {
      emit(AuthError(error: 'Failed to check phone number availability: ${e.toString()}'));
    }
  }


  Future<void> _onRequestLogin(
    RequestLogin event,
    Emitter<AuthState> emit
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
        
        emit(AuthAuthenticated(
          user: user,
          token: token ?? '',
        ));
      } else {
        emit(AuthError(error: loginResult['message'] ?? 'Login failed'));
      }
    } catch (e) {
      emit(AuthError(error: 'Login failed: ${e.toString()}'));
    }
  }


  Future<void> _onUserRegistrationWithOtpRequested(
    UserRegistrationWithOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final authRepository = ServiceRegistry().authRepository;
      
      // Register user after OTP verification
      final result = await authRepository.registerUserAfterOtpVerification(
        enteredOtp: event.enteredOtp,
        sentOtp: event.sentOtp,
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
        country: event.country,
        fullName: event.fullName,
        email: event.email,
      );
      
      if (result['success'] == true) {
        final user = result['user'] as User;
        final token = result['token'] as String?;
        
        emit(AuthAuthenticated(
          user: user,
          token: token ?? '',
        ));
      } else {
        emit(AuthError(
          error: result['message'] ?? 'Registration failed',
        ));
      }
    } catch (e) {
      emit(AuthError(
        error: 'Registration failed: ${e.toString()}',
      ));
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
        
        emit(AuthAuthenticated(
          user: user,
          token: token,
        ));
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
      emit(AuthError(error: 'Failed to sign out: ${e.toString()}'));
    }
  }
}
