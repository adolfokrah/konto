import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/authentication/data/models/user.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  String? _phoneNumber;
  String? _sentOtp;
  
  AuthBloc() : super(const AuthInitial()) {
    on<PhoneNumberAvailabilityChecked>(_onPhoneNumberAvailabilityChecked);
    on<PhoneNumberSubmitted>(_onPhoneNumberSubmitted);
    on<UserRegistrationOtpRequested>(_onUserRegistrationOtpRequested);
    on<UserRegistrationWithOtpRequested>(_onUserRegistrationWithOtpRequested);
    on<SignOutRequested>(_onSignOutRequested);
    on<AutoLoginRequested>(_onAutoLoginRequested);
  }

  Future<void> _onPhoneNumberAvailabilityChecked(
    PhoneNumberAvailabilityChecked event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    
    try {
      final authRepository = ServiceRegistry().authRepository;
      
      // Don't format the phone number with country code since we send it separately
      // Just clean the phone number (remove non-digits)
      String cleanPhoneNumber = event.phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
      
      // Check phone number availability
      final result = await authRepository.checkPhoneNumberAvailability(
        phoneNumber: cleanPhoneNumber,
        countryCode: event.countryCode,
      );
      
      if (result['success'] == true) {
        emit(PhoneNumberAvailabilityResult(
          exists: result['exists'] ?? false,
          shouldLogin: result['shouldLogin'] ?? false,
          shouldRegister: result['shouldRegister'] ?? false,
          message: result['message'] ?? '',
          phoneNumber: cleanPhoneNumber,
          countryCode: event.countryCode,
        ));
      } else {
        emit(AuthFailure(result['message'] ?? 'Failed to check phone number availability'));
      }
    } catch (e) {
      emit(AuthFailure('Failed to check phone number availability: ${e.toString()}'));
    }
  }

  Future<void> _onPhoneNumberSubmitted(
    PhoneNumberSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    
    try {
      final authRepository = ServiceRegistry().authRepository;
      
      // Clean the phone number (remove non-digits) but don't add country code
      // The backend expects separate phoneNumber and countryCode fields
      String cleanPhoneNumber = event.phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
      _phoneNumber = cleanPhoneNumber;
      
      // Send OTP using simple SMS service
      Map<String, dynamic> result = await authRepository.verifyPhoneNumber(
        phoneNumber: _phoneNumber!,
        countryCode: event.countryCode,
      );
      
      if (result['success'] == true) {
        // Store the sent OTP for verification later
        _sentOtp = result['otp'];
        
        // Emit success state with phone number and OTP for navigation
        emit(AuthCodeSentSuccess(
          verificationId: _sentOtp!, // Use OTP as verification ID for simplicity
          phoneNumber: result['phoneNumber'],
          countryCode: event.countryCode,
        ));
      } else {
        emit(AuthFailure(result['message'] ?? 'Failed to send OTP'));
      }
    } catch (e) {
      emit(AuthFailure('Failed to send verification code: ${e.toString()}'));
    }
  }

  Future<void> _onSignOutRequested(
    SignOutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final authRepository = ServiceRegistry().authRepository;
      await authRepository.signOut();
      _phoneNumber = null;
      _sentOtp = null;
      emit(const AuthUnauthenticated());
    } catch (e) {
      emit(AuthFailure('Failed to sign out: ${e.toString()}'));
    }
  }

  Future<void> _onUserRegistrationOtpRequested(
    UserRegistrationOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final authRepository = ServiceRegistry().authRepository;
      
      // Send OTP for registration verification
      final result = await authRepository.verifyPhoneNumber(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
      );
      
      if (result['success'] == true) {
        final sentOtp = result['otp'] as String;
        
        emit(UserRegistrationOtpSent(
          phoneNumber: event.phoneNumber,
          countryCode: event.countryCode,
          country: event.country,
          fullName: event.fullName,
          email: event.email,
          sentOtp: sentOtp,
        ));
      } else {
        emit(UserRegistrationFailure(
          error: result['message'] ?? 'Failed to send OTP',
        ));
      }
    } catch (e) {
      emit(UserRegistrationFailure(
        error: 'Failed to send OTP: ${e.toString()}',
      ));
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
        final requiresLogin = result['requiresLogin'] as bool? ?? false;
        
        emit(UserRegistrationSuccess(
          user: user,
          token: token,
          requiresLogin: requiresLogin,
        ));
      } else {
        emit(UserRegistrationFailure(
          error: result['message'] ?? 'Registration failed',
          errors: result['errors'],
        ));
      }
    } catch (e) {
      emit(UserRegistrationFailure(
        error: 'Registration failed: ${e.toString()}',
      ));
    }
  }

  // Helper method to verify OTP (can be called from VerificationBloc)
  Future<Map<String, dynamic>> verifyOtp(String enteredOtp) async {
    if (_sentOtp == null || _phoneNumber == null) {
      return {
        'success': false,
        'message': 'No OTP session found'
      };
    }
    
    final authRepository = ServiceRegistry().authRepository;
    return await authRepository.verifyOTP(
      enteredOtp: enteredOtp,
      sentOtp: _sentOtp!,
      phoneNumber: _phoneNumber!,
    );
  }

  /// Auto login handler - uses stored user data to re-authenticate with backend
  Future<void> _onAutoLoginRequested(
    AutoLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AutoLoginLoading());
    
    try {
      final authRepository = ServiceRegistry().authRepository;
      
      // Check if there's any user data stored locally first
      final isLoggedIn = await authRepository.isUserLoggedIn();
      
      if (!isLoggedIn) {
        print('ℹ️ No stored session found');
        emit(const AutoLoginFailed(
          message: 'No stored session found'
        ));
        return;
      }

      // Attempt auto-login using stored phone number and country code
      final autoLoginResult = await authRepository.autoLogin();
      
      if (autoLoginResult['success'] == true) {
        final user = autoLoginResult['user'];
        final token = autoLoginResult['token'];
        
        print('✅ Auto-login successful for user: ${user.fullName}');
        emit(AutoLoginSuccess(
          user: user,
          token: token,
        ));
      } else {
        print('❌ Auto-login failed: ${autoLoginResult['message']}');
        emit(AutoLoginFailed(
          message: autoLoginResult['message'] ?? 'Auto-login failed'
        ));
      }
    } catch (e) {
      print('💥 Auto-login error: $e');
      emit(AutoLoginFailed(
        message: 'Auto-login failed: ${e.toString()}'
      ));
    }
  }

  // Getters for the sent OTP and phone number
  String? get sentOtp => _sentOtp;
  String? get phoneNumber => _phoneNumber;
}
