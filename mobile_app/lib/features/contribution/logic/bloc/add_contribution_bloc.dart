import 'package:bloc/bloc.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:meta/meta.dart';

part 'add_contribution_event.dart';
part 'add_contribution_state.dart';

class AddContributionBloc
    extends Bloc<AddContributionEvent, AddContributionState> {
  final ContributionRepository _contributionRepository;

  AddContributionBloc({required ContributionRepository contributionRepository})
    : _contributionRepository = contributionRepository,
      super(AddContributionInitial()) {
    on<AddContributionSubmitted>(_addContributionSubmitted);
  }

  Future<void> _addContributionSubmitted(
    AddContributionSubmitted event,
    Emitter<AddContributionState> emit,
  ) async {
    emit(AddContributionLoading());

    try {
      // Call the repository to add the contribution
      final response = await _contributionRepository.addContribution(
        jarId: event.jarId,
        contributor: event.contributor,
        contributorPhoneNumber: event.contributorPhoneNumber,
        paymentMethod: event.paymentMethod,
        accountNumber: event.accountNumber,
        amountContributed: event.amountContributed,
        viaPaymentLink: event.viaPaymentLink,
        mobileMoneyProvider: event.mobileMoneyProvider,
      );

      if (response['success']) {
        emit(AddContributionSuccess(response['data']['id'] as String));
      } else {
        emit(AddContributionFailure(response['message'] ?? 'UNKNOWN_ERROR'));
      }
    } catch (e) {
      emit(AddContributionFailure('UNEXPECTED_ERROR: ${e.toString()}'));
    }
  }
}
