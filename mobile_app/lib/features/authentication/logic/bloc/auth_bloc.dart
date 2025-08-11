import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  String? _phoneNumber;
  String? _sentOtp;
  
  AuthBloc() : super(const AuthInitial()) {
    on<PhoneNumberSubmitted>(_onPhoneNumberSubmitted);
    on<SignOutRequested>(_onSignOutRequested);
  }

  Future<void> _onPhoneNumberSubmitted(
    PhoneNumberSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    
    try {
      final authRepository = ServiceRegistry().authRepository;
      
      // Format phone number
      _phoneNumber = authRepository.formatPhoneNumber(
        event.phoneNumber,
        event.countryCode,
      );
      
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

  // Getters for the sent OTP and phone number
  String? get sentOtp => _sentOtp;
  String? get phoneNumber => _phoneNumber;
}
