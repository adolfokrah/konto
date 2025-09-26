import 'package:bloc/bloc.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:Hoga/features/contribution/data/models/contribution_model.dart';
import 'package:meta/meta.dart';

part 'fetch_contribution_event.dart';
part 'fetch_contribution_state.dart';

class FetchContributionBloc
    extends Bloc<FetchContributionEvent, FetchContributionState> {
  FetchContributionBloc() : super(FetchContributionInitial()) {
    on<FetchContributionById>(_fetchContributionById);
  }

  Future<void> _fetchContributionById(
    FetchContributionById event,
    Emitter<FetchContributionState> emit,
  ) async {
    emit(FetchContributionLoading());

    final serviceRegistry = ServiceRegistry();

    try {
      final response = await serviceRegistry.contributionRepository
          .getContributionById(contributionId: event.contributionId);

      if (response['success']) {
        emit(
          FetchContributionLoaded(ContributionModel.fromJson(response['data'])),
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
