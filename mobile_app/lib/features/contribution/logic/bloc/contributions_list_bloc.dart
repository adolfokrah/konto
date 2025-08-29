import 'package:bloc/bloc.dart';
import 'package:konto/core/constants/filter_options.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/contribution/data/repositories/contribution_repository.dart';
import 'package:konto/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';
import 'package:meta/meta.dart';

part 'contributions_list_event.dart';
part 'contributions_list_state.dart';

class ContributionsListBloc
    extends Bloc<ContributionsListEvent, ContributionsListState> {
  final ContributionRepository _contributionRepository;
  FilterContributionsBloc? _filterBloc;

  ContributionsListBloc({
    ContributionRepository? contributionRepository,
    FilterContributionsBloc? filterBloc,
  }) : _contributionRepository =
           contributionRepository ?? ServiceRegistry().contributionRepository,
       _filterBloc = filterBloc,
       super(ContributionsListInitial()) {
    on<FetchContributions>(_onFetchContributions);
  }

  // Method to set the filter bloc later if needed
  void setFilterBloc(FilterContributionsBloc filterBloc) {
    _filterBloc = filterBloc;
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
      // Get filter values from FilterContributionsBloc state if available
      List<String>? paymentMethodStrings;
      List<String>? statusStrings;
      List<String>? collectors;
      DateTime? startDate;
      DateTime? endDate;

      if (_filterBloc != null) {
        final filterState = _filterBloc!.state;

        if (filterState is FilterContributionsLoaded) {
          // Payment methods are already strings
          paymentMethodStrings = filterState.selectedPaymentMethods;

          // Statuses are already strings
          statusStrings = filterState.selectedStatuses;

          // Collectors are already strings (user IDs)
          collectors = filterState.selectedCollectors;

          // Convert date string to DateTime range if applicable
          if (filterState.selectedDate != null &&
              filterState.selectedDate != FilterOptions.defaultDateOption) {
            if (filterState.selectedDate == FilterOptions.todayOption) {
              final today = DateTime.now();
              startDate = DateTime(
                today.year,
                today.month,
                today.day,
              ); // Start of today
              endDate = DateTime(
                today.year,
                today.month,
                today.day,
                23,
                59,
                59,
                999,
              ); // End of today
            } else if (filterState.selectedDate ==
                FilterOptions.yesterdayOption) {
              final yesterday = DateTime.now().subtract(
                const Duration(days: 1),
              );
              startDate = DateTime(
                yesterday.year,
                yesterday.month,
                yesterday.day,
              ); // Start of yesterday
              endDate = DateTime(
                yesterday.year,
                yesterday.month,
                yesterday.day,
                23,
                59,
                59,
                999,
              ); // End of yesterday
            } else if (filterState.selectedDate ==
                FilterOptions.last7DaysOption) {
              final now = DateTime.now();
              // Calculate 7 days ago from today
              startDate = now.subtract(const Duration(days: 6));
              endDate = now;
            } else if (filterState.selectedDate ==
                FilterOptions.last30DaysOption) {
              final now = DateTime.now();
              // Calculate 30 days ago from today
              startDate = now.subtract(const Duration(days: 29));
              endDate = now;
            } else {
              startDate = filterState.startDate;
              endDate = filterState.endDate;
            }
          }
        }
      }

      final result = await _contributionRepository.getContributions(
        jarId: event.jarId,
        paymentMethods: paymentMethodStrings,
        statuses: statusStrings,
        collectors: collectors,
        startDate: startDate,
        endDate: endDate,
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
