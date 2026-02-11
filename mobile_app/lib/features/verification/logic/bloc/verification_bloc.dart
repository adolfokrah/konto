import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/core/services/service_registry.dart';

part 'verification_event.dart';
part 'verification_state.dart';

class VerificationBloc extends Bloc<VerificationEvent, VerificationState> {
  VerificationBloc() : super(const VerificationInitial()) {
    on<PhoneNumberVerificationRequested>(_onPhoneNumberVerificationRequested);
    on<VerificationSuccessRequested>(_onVerificationSuccessRequested);
    on<OtpVerificationRequested>(_onOtpVerificationRequested);
  }

  Future<void> _onVerificationSuccessRequested(
    VerificationSuccessRequested event,
    Emitter<VerificationState> emit,
  ) async {
    emit(const VerificationSuccess());
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
        email: event.email,
        countryCode: event.countryCode,
      );

      if (result['success'] == true) {
        emit(const VerificationCodeSent());
      } else {
        final translationService = ServiceRegistry().translationService;
        emit(
          VerificationFailure(
            result['message'] ??
                translationService.failedToSendVerificationCode,
          ),
        );
      }
    } catch (e) {
      print('❌ Verification failed: ${e.toString()}');

      final translationService = ServiceRegistry().translationService;
      emit(
        VerificationFailure(
          translationService.failedToSendVerificationCodeTryAgain,
        ),
      );
    }
  }

  Future<void> _onOtpVerificationRequested(
    OtpVerificationRequested event,
    Emitter<VerificationState> emit,
  ) async {
    emit(const VerificationVerifying());
    try {
      final verificationRepository = ServiceRegistry().verificationRepository;
      final result = await verificationRepository.verifyOtp(
        phoneNumber: event.phoneNumber,
        countryCode: event.countryCode,
        code: event.code,
      );

      if (result['success'] == true) {
        emit(const VerificationSuccess());
      } else {
        emit(VerificationFailure(result['message'] ?? 'Invalid OTP'));
      }
    } catch (e) {
      print('❌ OTP verification failed: ${e.toString()}');
      emit(VerificationFailure('Failed to verify OTP. Please try again.'));
    }
  }
}
