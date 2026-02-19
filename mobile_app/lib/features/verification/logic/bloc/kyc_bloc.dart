import 'package:bloc/bloc.dart';
import 'package:didit_sdk/sdk_flutter.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/core/services/service_registry.dart';

part 'kyc_event.dart';
part 'kyc_state.dart';

class KycBloc extends Bloc<KycEvent, KycState> {
  final ServiceRegistry _serviceRegistry = ServiceRegistry();

  KycBloc() : super(KycInitial()) {
    on<RequestKycSession>(_requestKycSession);
  }

  Future<void> _requestKycSession(
    RequestKycSession event,
    Emitter<KycState> emit,
  ) async {
    emit(KycInProgress());

    try {
      // Request a KYC session from the backend
      final result =
          await _serviceRegistry.verificationRepository
              .requestKycVerification();

      if (result['success'] != true) {
        emit(KycFailure(result['message'] ?? 'Failed to create KYC session'));
        return;
      }

      final sessionToken = result['sessionToken'] as String?;
      if (sessionToken == null || sessionToken.isEmpty) {
        emit(KycFailure('Session token not received from server'));
        return;
      }

      // Launch native Didit verification SDK
      final sdkResult = await DiditSdk.startVerification(sessionToken);

      switch (sdkResult) {
        case VerificationCompleted(:final session):
          if (session.status == VerificationStatus.approved) {
            emit(KycSuccess());
          } else if (session.status == VerificationStatus.pending) {
            emit(KycInReview());
          } else {
            emit(KycFailure('Verification was declined'));
          }
        case VerificationCancelled():
          emit(KycInitial());
        case VerificationFailed(:final error):
          emit(KycFailure(error.message ?? 'Verification failed'));
      }
    } catch (e) {
      emit(KycFailure('Failed to start verification: ${e.toString()}'));
    }
  }
}
