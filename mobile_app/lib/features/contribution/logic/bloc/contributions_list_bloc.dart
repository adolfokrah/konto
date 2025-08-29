import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/contribution/data/repositories/contribution_repository.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';
import 'package:meta/meta.dart';

part 'contributions_list_event.dart';
part 'contributions_list_state.dart';

class ContributionsListBloc
    extends Bloc<ContributionsListEvent, ContributionsListState> {
  final ContributionRepository _contributionRepository;

  ContributionsListBloc({ContributionRepository? contributionRepository})
    : _contributionRepository =
          contributionRepository ?? ServiceRegistry().contributionRepository,
      super(ContributionsListInitial()) {
    on<FetchContributions>(_onFetchContributions);
  }

  Future<void> _onFetchContributions(
    FetchContributions event,
    Emitter<ContributionsListState> emit,
  ) async {
    // Don't emit loading state if we're paginating and already have data
    final currentState = state;
    if (event.page == 1 || currentState is! ContributionsListLoaded) {
      emit(ContributionsListLoading());
    }

    try {
      // Convert enums to string values for API
      final paymentMethodStrings =
          event.paymentMethods?.map((e) => e.value).toList();
      final statusStrings = event.statuses?.map((e) => e.value).toList();

      final result = await _contributionRepository.getContributions(
        jarId: event.jarId,
        paymentMethods: paymentMethodStrings,
        statuses: statusStrings,
        collectors: event.collectors,
        date: event.date,
        limit: event.limit,
        page: event.page,
        contributor: event.contributor,
      );

      if (result['success']) {
        final responseData = result['data'];
        final contributionsJson = responseData['docs'] ?? [];

        // Convert JSON to ContributionModel objects
        final newContributions =
            contributionsJson
                .map<ContributionModel>(
                  (json) => ContributionModel.fromJson(json),
                )
                .toList();

        // If page > 1, append to existing contributions, otherwise replace
        List<ContributionModel> allContributions;
        if (event.page > 1 && currentState is ContributionsListLoaded) {
          allContributions = [
            ...currentState.contributions,
            ...newContributions,
          ];
        } else {
          allContributions = newContributions;
        }

        // Extract pagination data
        final totalDocs = responseData['totalDocs'] ?? 0;
        final limit = responseData['limit'] ?? 10;
        final totalPages = responseData['totalPages'] ?? 1;
        final page = responseData['page'] ?? 1;
        final pagingCounter = responseData['pagingCounter'] ?? 1;
        final hasPrevPage = responseData['hasPrevPage'] ?? false;
        final hasNextPage = responseData['hasNextPage'] ?? false;
        final prevPage = responseData['prevPage'];
        final nextPage = responseData['nextPage'];

        emit(
          ContributionsListLoaded(
            allContributions,
            totalDocs: totalDocs,
            limit: limit,
            totalPages: totalPages,
            page: page,
            pagingCounter: pagingCounter,
            hasPrevPage: hasPrevPage,
            hasNextPage: hasNextPage,
            prevPage: prevPage,
            nextPage: nextPage,
          ),
        );
      } else {
        emit(
          ContributionsListError(
            result['message'] ?? 'Failed to fetch contributions',
          ),
        );
      }
    } catch (e) {
      emit(
        ContributionsListError('An unexpected error occurred: ${e.toString()}'),
      );
    }
  }
}
