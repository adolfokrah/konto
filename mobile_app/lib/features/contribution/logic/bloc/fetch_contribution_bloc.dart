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
        final data = response['data'] as Map<String, dynamic>;
        final contribution = ContributionModel.fromJson(data);

        // Extract related refunds from the response (returned by get-transaction endpoint)
        final List<Map<String, dynamic>> refundDocs =
            (data['refunds'] as List<dynamic>?)
                ?.map((r) => r as Map<String, dynamic>)
                .toList() ??
            [];

        // Extract payout approvals from the response
        final List<Map<String, dynamic>> approvalDocs =
            (data['approvals'] as List<dynamic>?)
                ?.map((a) => a as Map<String, dynamic>)
                .toList() ??
            [];

        final int requiredApprovals = (data['requiredApprovals'] as int?) ?? 1;

        emit(
          FetchContributionLoaded(contribution, refundDocs: refundDocs, approvalDocs: approvalDocs, requiredApprovals: requiredApprovals),
        );
      } else {
        emit(
          FetchContributionError(
            response['message'] ?? 'Failed to fetch contribution',
          ),
        );
      }
    } catch (e) {
      emit(FetchContributionError('An unexpected error occurred: $e'));
    }
  }
}
