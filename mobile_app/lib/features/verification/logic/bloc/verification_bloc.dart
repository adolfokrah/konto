import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';

part 'verification_event.dart';
part 'verification_state.dart';

class VerificationBloc extends Bloc<VerificationEvent, VerificationState> {
  String? _sentOtp;
  String? _phoneNumber;
  String? _countryCode;
  
  VerificationBloc() : super(const VerificationInitial()) {
    on<OtpChanged>(_onOtpChanged);
    on<OtpSubmitted>(_onOtpSubmitted);
    on<ResendOtpRequested>(_onResendOtpRequested);
    on<ClearOtp>(_onClearOtp);
    on<InitializeVerification>(_onInitializeVerification);
    on<PhoneNumberVerificationRequested>(_onPhoneNumberVerificationRequested);
  }

  void _onOtpChanged(OtpChanged event, Emitter<VerificationState> emit) {
    final isComplete = event.otp.length == 6; // Assuming 6-digit OTP
    emit(VerificationOtpInput(
      otp: event.otp,
      isComplete: isComplete,
      hasError: false,
    ));
  }

  void _onInitializeVerification(InitializeVerification event, Emitter<VerificationState> emit) {
    _sentOtp = event.sentOtp;
    _phoneNumber = event.phoneNumber;
    _countryCode = event.countryCode;
    emit(const VerificationCodeSent());
  }

  Future<void> _onOtpSubmitted(OtpSubmitted event, Emitter<VerificationState> emit) async {
    if (event.otp.length != 6) {
      emit(VerificationOtpInput(
        otp: event.otp,
        isComplete: false,
        hasError: true,
        errorMessage: 'Please enter a complete 6-digit code',
      ));
      return;
    }

    emit(const VerificationLoading());

    try {
      if (_sentOtp != null) {
        // Use AuthBloc's verifyOtp method which handles login after verification
        final authBloc = ServiceRegistry().authRepository;
        final result = await authBloc.verifyOTPAndLogin(
          enteredOtp: event.otp,
          sentOtp: _sentOtp!,
          phoneNumber: _phoneNumber!,
          countryCode: _countryCode ?? '+1', // Default to +1 if not set
        );
        
        if (result['success'] == true) {
          emit(const VerificationSuccess());
        } else {
          emit(VerificationFailure(result['message'] ?? 'Invalid verification code'));
        }
      } else {
        emit(const VerificationFailure('No verification code sent. Please request a new code.'));
      }
    } catch (e) {
      emit(const VerificationFailure('Something went wrong. Please try again.'));
    }
  }

  Future<void> _onPhoneNumberVerificationRequested(
    PhoneNumberVerificationRequested event,
    Emitter<VerificationState> emit,
  ) async {
    emit(const VerificationLoading());

    try {
      final verificationRepository = ServiceRegistry().verificationRepository;
      final result = await verificationRepository.requestPhoneVerification(
        phoneNumber: event.phoneNumber,
      );
      
      if (result['success'] == true) {
        _sentOtp = result['otp']; // In production, this should be stored securely
        _phoneNumber = result['phoneNumber'];
        emit(const VerificationCodeSent());
      } else {
        emit(VerificationFailure(result['message'] ?? 'Failed to send verification code'));
      }
    } catch (e) {
      emit(const VerificationFailure('Failed to send verification code. Please try again.'));
    }
  }

  Future<void> _onResendOtpRequested(ResendOtpRequested event, Emitter<VerificationState> emit) async {
    if (_phoneNumber == null) {
      emit(const VerificationFailure('No phone number found. Please start verification again.'));
      return;
    }

    emit(const VerificationLoading());

    try {
      final verificationRepository = ServiceRegistry().verificationRepository;
      final result = await verificationRepository.requestPhoneVerification(
        phoneNumber: _phoneNumber!,
      );
      
      if (result['success'] == true) {
        _sentOtp = result['otp']; // In production, this should be stored securely
        emit(const VerificationResendSuccess());
        
        // Return to input state after short delay
        await Future.delayed(const Duration(milliseconds: 500));
        emit(const VerificationOtpInput());
      } else {
        emit(VerificationResendFailure(result['message'] ?? 'Failed to resend code'));
      }
    } catch (e) {
      emit(const VerificationResendFailure('Failed to resend code. Please try again.'));
    }
  }

  void _onClearOtp(ClearOtp event, Emitter<VerificationState> emit) {
    emit(const VerificationOtpInput());
  }

  // Helper method to get sent OTP (for testing purposes only)
  String? get sentOtp => _sentOtp;
}
