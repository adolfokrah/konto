import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/verification/data/repositories/verification_repository.dart';
import 'package:Hoga/core/services/translation_service.dart';

part 'verification_event.dart';
part 'verification_state.dart';

class VerificationBloc extends Bloc<VerificationEvent, VerificationState> {
  final VerificationRepository _verificationRepository;
  final TranslationService _translationService;

  VerificationBloc({
    required VerificationRepository verificationRepository,
    required TranslationService translationService,
  }) : _verificationRepository = verificationRepository,
       _translationService = translationService,
       super(const VerificationInitial()) {
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
      final result = await _verificationRepository.requestPhoneVerification(
        phoneNumber: event.phoneNumber,
        email: event.email,
        countryCode: event.countryCode,
      );

      if (result['success'] == true) {
        emit(const VerificationCodeSent());
      } else {
        emit(
          VerificationFailure(
            result['message'] ??
                _translationService.failedToSendVerificationCode,
          ),
        );
      }
    } catch (e) {
      print('❌ Verification failed: ${e.toString()}');

      emit(
        VerificationFailure(
          _translationService.failedToSendVerificationCodeTryAgain,
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
      final result = await _verificationRepository.verifyOtp(
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
