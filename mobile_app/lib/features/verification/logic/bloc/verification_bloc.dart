import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';

part 'verification_event.dart';
part 'verification_state.dart';

class VerificationBloc extends Bloc<VerificationEvent, VerificationState> {
  VerificationBloc() : super(const VerificationInitial()) {
    on<PhoneNumberVerificationRequested>(_onPhoneNumberVerificationRequested);
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
        emit(VerificationCodeSent(
          otpCode: result['otp']!,
        ));
      } else {
        emit(VerificationFailure(result['message'] ?? 'Failed to send verification code'));
      }
    } catch (e) {
      emit(const VerificationFailure('Failed to send verification code. Please try again.'));
    }
  }
}
