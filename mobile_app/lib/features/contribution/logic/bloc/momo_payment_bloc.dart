import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/contribution/data/models/momo_charge_model.dart';
import 'package:konto/features/contribution/data/repositories/momo_repository.dart';
import 'package:meta/meta.dart';

part 'momo_payment_event.dart';
part 'momo_payment_state.dart';

class MomoPaymentBloc extends Bloc<MomoPaymentEvent, MomoPaymentState> {
  final MomoRepository _momoRepository;

  MomoPaymentBloc({MomoRepository? momoRepository})
    : _momoRepository = momoRepository ?? ServiceRegistry().momoRepository,
      super(MomoPaymentInitial()) {
    on<MomoPaymentRequested>(_onMomoPaymentRequested);
    on<SubmitOtpRequested>(_onSubmitOtpRequested);
    on<VerifyPaymentRequested>(_onVerifyPaymentRequested);
  }

  Future<void> _onMomoPaymentRequested(
    MomoPaymentRequested event,
    Emitter<MomoPaymentState> emit,
  ) async {
    emit(MomoPaymentLoading());
    try {
      final charge = await _momoRepository.chargeMomo(
        contributionId: event.contributionId,
      );

      emit(MomoPaymentSuccess(charge));
    } catch (e) {
      emit(MomoPaymentFailure(e.toString()));
    }
  }

  Future<void> _onSubmitOtpRequested(
    SubmitOtpRequested event,
    Emitter<MomoPaymentState> emit,
  ) async {
    emit(MomoPaymentLoading());
    try {
      final charge = await _momoRepository.submitOtp(
        reference: event.reference,
        otp: event.otpCode,
      );

      // After successful OTP, we might want to emit a different success state
      // or trigger another action. For now, emit success with the current charge
      emit(MomoPaymentSuccess(charge));
    } catch (e) {
      emit(MomoPaymentFailure(e.toString()));
    }
  }

  Future<void> _onVerifyPaymentRequested(
    VerifyPaymentRequested event,
    Emitter<MomoPaymentState> emit,
  ) async {
    try {
      final charge = await _momoRepository.verifyPayment(
        reference: event.reference,
      );

      emit(MomoPaymentSuccess(charge));
    } catch (e) {
      emit(MomoPaymentFailure(e.toString()));
    }
  }
}
