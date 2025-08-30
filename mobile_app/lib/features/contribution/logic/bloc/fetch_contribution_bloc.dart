import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/contribution/data/models/contribution_model.dart';
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

    final response = await serviceRegistry.contributionRepository
        .getContributionById(contributionId: event.contributionId);

    if (response['success']) {
      emit(
        FetchContributionLoaded(ContributionModel.fromJson(response['data'])),
      );
    } else {
      emit(FetchContributionError('Failed to fetch contribution'));
    }
  }
}
