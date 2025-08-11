import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'verification_event.dart';
part 'verification_state.dart';

class VerificationBloc extends Bloc<VerificationEvent, VerificationState> {
  VerificationBloc() : super(const VerificationInitial()) {
    on<OtpChanged>(_onOtpChanged);
    on<OtpSubmitted>(_onOtpSubmitted);
    on<ResendOtpRequested>(_onResendOtpRequested);
    on<ClearOtp>(_onClearOtp);
  }

  void _onOtpChanged(OtpChanged event, Emitter<VerificationState> emit) {
    final isComplete = event.otp.length == 6; // Assuming 6-digit OTP
    emit(VerificationOtpInput(
      otp: event.otp,
      isComplete: isComplete,
      hasError: false,
    ));
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
      // Simulate API call
      await Future.delayed(const Duration(seconds: 2));
      
      // Mock validation - replace with actual API call
      if (event.otp == '123456') {
        emit(const VerificationSuccess());
      } else {
        emit(const VerificationFailure('Invalid verification code. Please try again.'));
      }
    } catch (e) {
      emit(const VerificationFailure('Something went wrong. Please try again.'));
    }
  }

  Future<void> _onResendOtpRequested(ResendOtpRequested event, Emitter<VerificationState> emit) async {
    emit(const VerificationLoading());

    try {
      // Simulate API call
      await Future.delayed(const Duration(seconds: 1));
      
      // Mock success - replace with actual API call
      emit(const VerificationResendSuccess());
      
      // Return to input state
      await Future.delayed(const Duration(milliseconds: 500));
      emit(const VerificationOtpInput());
    } catch (e) {
      emit(const VerificationResendFailure('Failed to resend code. Please try again.'));
    }
  }

  void _onClearOtp(ClearOtp event, Emitter<VerificationState> emit) {
    emit(const VerificationOtpInput());
  }
}
