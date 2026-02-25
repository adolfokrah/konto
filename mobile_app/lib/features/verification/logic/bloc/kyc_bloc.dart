import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:Hoga/features/verification/data/repositories/verification_repository.dart';

part 'kyc_event.dart';
part 'kyc_state.dart';

class KycBloc extends Bloc<KycEvent, KycState> {
  final VerificationRepository _verificationRepository;

  KycBloc({required VerificationRepository verificationRepository})
    : _verificationRepository = verificationRepository,
      super(KycInitial()) {
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
          await _verificationRepository.requestKycVerification();

      if (result['success'] != true) {
        emit(KycFailure(result['message'] ?? 'Failed to create KYC session'));
        return;
      }

      final sessionUrl = result['sessionUrl'] as String?;

      // Try to open the verification URL in the browser
      if (sessionUrl != null && sessionUrl.isNotEmpty) {
        final uri = Uri.parse(sessionUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }

      // Verification link is also sent via email and SMS
      emit(KycInReview());
    } catch (e) {
      emit(KycFailure('Failed to start verification: ${e.toString()}'));
    }
  }
}
