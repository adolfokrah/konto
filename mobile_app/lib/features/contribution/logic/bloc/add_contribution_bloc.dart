import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:meta/meta.dart';

part 'add_contribution_event.dart';
part 'add_contribution_state.dart';

class AddContributionBloc
    extends Bloc<AddContributionEvent, AddContributionState> {
  AddContributionBloc() : super(AddContributionInitial()) {
    on<AddContributionSubmitted>(_addContributionSubmitted);
  }

  Future<void> _addContributionSubmitted(
    AddContributionSubmitted event,
    Emitter<AddContributionState> emit,
  ) async {
    emit(AddContributionLoading());

    try {
      final serviceRegistry = ServiceRegistry();
      final contributionRepository = serviceRegistry.contributionRepository;

      // Call the repository to add the contribution
      final response = await contributionRepository.addContribution(
        jarId: event.jarId,
        contributor: event.contributor,
        contributorPhoneNumber: event.contributorPhoneNumber,
        paymentMethod: event.paymentMethod,
        accountNumber: event.accountNumber,
        amountContributed: event.amountContributed,
        viaPaymentLink: event.viaPaymentLink,
      );

      if (response['success']) {
        emit(AddContributionSuccess());
      } else {
        emit(AddContributionFailure(response['message'] ?? 'Unknown error'));
      }
    } catch (e) {
      emit(
        AddContributionFailure('An unexpected error occurred: ${e.toString()}'),
      );
    }
  }
}
