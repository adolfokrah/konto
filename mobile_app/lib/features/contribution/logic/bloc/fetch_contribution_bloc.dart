import 'package:bloc/bloc.dart';
import 'package:Hoga/features/contribution/data/models/contribution_model.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:meta/meta.dart';

part 'fetch_contribution_event.dart';
part 'fetch_contribution_state.dart';

class FetchContributionBloc
    extends Bloc<FetchContributionEvent, FetchContributionState> {
  final ContributionRepository _contributionRepository;

  FetchContributionBloc({required ContributionRepository contributionRepository})
    : _contributionRepository = contributionRepository,
      super(FetchContributionInitial()) {
    on<FetchContributionById>(_fetchContributionById);
  }

  Future<void> _fetchContributionById(
    FetchContributionById event,
    Emitter<FetchContributionState> emit,
  ) async {
    emit(FetchContributionLoading());

    try {
      final response = await _contributionRepository
          .getContributionById(contributionId: event.contributionId);

      if (response['success']) {
        final contribution = ContributionModel.fromJson(response['data']);

        // Fetch related refunds if this is a contribution
        List<ContributionModel> relatedRefunds = [];
        if (contribution.isContribution) {
          final refundsResponse = await _contributionRepository.getContributions(
            jarId: contribution.jar.id,
            transactionTypes: ['refund'],
            linkedTransactionId: contribution.id,
          );
          if (refundsResponse['success'] == true) {
            final docs = refundsResponse['data']?['docs'] as List<dynamic>? ??
                refundsResponse['docs'] as List<dynamic>? ??
                [];
            relatedRefunds = docs
                .map((doc) => ContributionModel.fromJson(doc as Map<String, dynamic>))
                .toList();
          }
        }

        emit(
          FetchContributionLoaded(contribution, relatedRefunds: relatedRefunds),
        );
      } else {
        print(
          '❌ Contribution API Error: ${response['message']}',
        ); // Debug logging
        emit(
          FetchContributionError(
            response['message'] ?? 'Failed to fetch contribution',
          ),
        );
      }
    } catch (e) {
      print('💥 Contribution API Exception: $e'); // Debug logging
      emit(FetchContributionError('An unexpected error occurred: $e'));
    }
  }
}
