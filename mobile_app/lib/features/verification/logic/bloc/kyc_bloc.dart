import 'package:Hoga/core/utils/url_launcher_utils.dart';
import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/core/services/service_registry.dart';

part 'kyc_event.dart';
part 'kyc_state.dart';

class KycBloc extends Bloc<KycEvent, KycState> {
  final ServiceRegistry _serviceRegistry = ServiceRegistry();

  KycBloc() : super(KycInitial()) {
    on<SetDocument>(_setDocument);
    on<ClearDocumentSide>(_clearDocumentSide);
    on<RequestKycSession>(_requestKycSession);
  }

  void _setDocument(SetDocument event, Emitter<KycState> emit) {
    final currentState = state is KycDocument ? state as KycDocument : null;

    emit(
      KycDocument(
        documentType: event.documentType ?? currentState?.documentType,
        frontFilePath: event.frontFilePath ?? currentState?.frontFilePath,
        backFilePath: event.backFilePath ?? currentState?.backFilePath,
        photoFilePath: event.photoFilePath ?? currentState?.photoFilePath,
      ),
    );
  }

  void _clearDocumentSide(ClearDocumentSide event, Emitter<KycState> emit) {
    final currentState = state is KycDocument ? state as KycDocument : null;

    emit(
      KycDocument(
        documentType: currentState?.documentType,
        frontFilePath:
            event.side == 'front' ? null : currentState?.frontFilePath,
        backFilePath: event.side == 'back' ? null : currentState?.backFilePath,
        photoFilePath: currentState?.photoFilePath,
      ),
    );
  }

  Future<void> _requestKycSession(
    RequestKycSession event,
    Emitter<KycState> emit,
  ) async {
    emit(KycInProgress());

    try {
      // Call the repository to request KYC verification
      final result =
          await _serviceRegistry.verificationRepository
              .requestKycVerification();

      if (result['success'] == true) {
        UrlLauncherUtils.launch(result['sessionUrl']);
        // On success, emit KycSuccess state
        emit(KycSuccess());
      } else {
        // If the API call succeeded but returned success: false
        emit(KycFailure(result['message'] ?? 'Failed to create KYC session'));
      }
    } catch (e) {
      // On failure, emit KycFailure state with an error message
      emit(KycFailure('Failed to request KYC session: ${e.toString()}'));
    }
  }
}
