import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/business_kyb/data/repositories/business_kyb_repository.dart';

part 'business_kyb_event.dart';
part 'business_kyb_state.dart';

class BusinessKybBloc extends Bloc<BusinessKybEvent, BusinessKybState> {
  final BusinessKybRepository _businessKybRepository;

  BusinessKybBloc({required BusinessKybRepository businessKybRepository})
    : _businessKybRepository = businessKybRepository,
      super(BusinessKybInitial()) {
    on<LoadKybStatus>(_onLoadKybStatus);
    on<SubmitKybRequested>(_onSubmitKybRequested);
  }

  Future<void> _onLoadKybStatus(
    LoadKybStatus event,
    Emitter<BusinessKybState> emit,
  ) async {
    emit(BusinessKybLoadingStatus());

    try {
      final result = await _businessKybRepository.getMyKyb();

      if (result['success'] != true) {
        emit(
          BusinessKybFailure(
            result['message'] ?? 'Failed to load verification status',
          ),
        );
        return;
      }

      final data = result['data'] as Map<String, dynamic>?;
      emit(
        BusinessKybStatusLoaded(
          status: data?['status']?.toString() ?? 'none',
          rejectionReason: data?['rejectionReason']?.toString(),
        ),
      );
    } catch (e) {
      emit(
        BusinessKybFailure(
          'Failed to load verification status: ${e.toString()}',
        ),
      );
    }
  }

  Future<void> _onSubmitKybRequested(
    SubmitKybRequested event,
    Emitter<BusinessKybState> emit,
  ) async {
    emit(BusinessKybSubmitting());

    try {
      // Documents have already been uploaded to the private
      // `business-documents` collection via the shared image uploader, so the
      // event carries the resulting document ids directly.
      final directors =
          event.directors
              .map(
                (director) => <String, dynamic>{
                  'fullName': director.fullName,
                  'idDocument': director.idFrontDocId,
                  'idDocumentBack': director.idBackDocId,
                },
              )
              .toList();

      // Submit the verification.
      final submitResult = await _businessKybRepository.submitKyb(
        businessName: event.businessName,
        companyRegistrationDocId: event.companyRegDocId,
        proofOfAddressId: event.proofOfAddressDocId,
        directors: directors,
      );

      if (submitResult['success'] != true) {
        emit(
          BusinessKybFailure(
            submitResult['message'] ?? 'Failed to submit business verification',
          ),
        );
        return;
      }

      emit(BusinessKybSubmitted());
    } catch (e) {
      emit(
        BusinessKybFailure(
          'Failed to submit business verification: ${e.toString()}',
        ),
      );
    }
  }
}
