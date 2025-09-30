import 'package:bloc/bloc.dart';
import 'package:Hoga/core/constants/filter_options.dart';
import 'package:meta/meta.dart';

part 'filter_contributions_event.dart';
part 'filter_contributions_state.dart';

class FilterContributionsBloc
    extends Bloc<FilterContributionsEvent, FilterContributionsState> {
  FilterContributionsBloc() : super(FilterContributionsLoaded()) {
    on<TogglePaymentMethod>(_onTogglePaymentMethod);
    on<ToggleStatus>(_onToggleStatus);
    on<ToggleCollector>(_onToggleCollector);
    on<UpdateDateRange>(_onUpdateDateRange);
    on<ClearAllFilters>(_onClearAllFilters);
    on<SelectAllFilters>(_onSelectAllFilters);
    on<ApplyFilters>(_onApplyFilters);
  }

  void _onTogglePaymentMethod(
    TogglePaymentMethod event,
    Emitter<FilterContributionsState> emit,
  ) {
    final currentState = state;
    if (currentState is FilterContributionsLoaded) {
      final updatedMethods = List<String>.from(
        currentState.selectedPaymentMethods ?? [],
      );

      if (updatedMethods.contains(event.paymentMethod)) {
        updatedMethods.remove(event.paymentMethod);
      } else {
        updatedMethods.add(event.paymentMethod);
      }

      emit(
        FilterContributionsLoaded(
          selectedPaymentMethods: updatedMethods,
          selectedStatuses: currentState.selectedStatuses,
          selectedCollectors: currentState.selectedCollectors,
          selectedDate: currentState.selectedDate,
          startDate: currentState.startDate,
          endDate: currentState.endDate,
        ),
      );
    }
  }

  void _onToggleStatus(
    ToggleStatus event,
    Emitter<FilterContributionsState> emit,
  ) {
    final currentState = state;
    if (currentState is FilterContributionsLoaded) {
      final updatedStatuses = List<String>.from(
        currentState.selectedStatuses ?? [],
      );

      if (updatedStatuses.contains(event.status)) {
        updatedStatuses.remove(event.status);
      } else {
        updatedStatuses.add(event.status);
      }

      emit(
        FilterContributionsLoaded(
          selectedPaymentMethods: currentState.selectedPaymentMethods,
          selectedStatuses: updatedStatuses,
          selectedCollectors: currentState.selectedCollectors,
          selectedDate: currentState.selectedDate,
          startDate: currentState.startDate,
          endDate: currentState.endDate,
        ),
      );
    }
  }

  void _onToggleCollector(
    ToggleCollector event,
    Emitter<FilterContributionsState> emit,
  ) {
    final currentState = state;
    if (currentState is FilterContributionsLoaded) {
      final updatedCollectors = List<String>.from(
        currentState.selectedCollectors ?? [],
      );

      if (updatedCollectors.contains(event.collectorId)) {
        updatedCollectors.remove(event.collectorId);
      } else {
        updatedCollectors.add(event.collectorId);
      }

      emit(
        FilterContributionsLoaded(
          selectedPaymentMethods: currentState.selectedPaymentMethods,
          selectedStatuses: currentState.selectedStatuses,
          selectedCollectors: updatedCollectors,
          selectedDate: currentState.selectedDate,
          startDate: currentState.startDate,
          endDate: currentState.endDate,
        ),
      );
    }
  }

  void _onUpdateDateRange(
    UpdateDateRange event,
    Emitter<FilterContributionsState> emit,
  ) {
    final currentState = state;
    if (currentState is FilterContributionsLoaded) {
      emit(
        FilterContributionsLoaded(
          selectedPaymentMethods: currentState.selectedPaymentMethods,
          selectedStatuses: currentState.selectedStatuses,
          selectedCollectors: currentState.selectedCollectors,
          selectedDate: event.selectedDate,
          startDate: event.startDate,
          endDate: event.endDate,
        ),
      );
    }
  }

  void _onClearAllFilters(
    ClearAllFilters event,
    Emitter<FilterContributionsState> emit,
  ) {
    emit(FilterContributionsLoaded());
  }

  void _onSelectAllFilters(
    SelectAllFilters event,
    Emitter<FilterContributionsState> emit,
  ) {
    const allPaymentMethods = ['mobile-money', 'cash', 'bank-transfer'];
    const allStatuses = ['pending', 'completed', 'failed', 'transferred'];

    final currentState = state;
    if (currentState is FilterContributionsLoaded) {
      emit(
        FilterContributionsLoaded(
          selectedPaymentMethods: allPaymentMethods,
          selectedStatuses: allStatuses,
          selectedCollectors: event.allCollectorIds,
          selectedDate: currentState.selectedDate ?? 'Any',
          startDate: currentState.startDate,
          endDate: currentState.endDate,
        ),
      );
    }
  }

  void _onApplyFilters(
    ApplyFilters event,
    Emitter<FilterContributionsState> emit,
  ) {
    emit(
      FilterContributionsLoaded(
        selectedPaymentMethods: event.paymentMethods,
        selectedStatuses: event.statuses,
        selectedCollectors: event.collectors,
        selectedDate: event.selectedDate,
        startDate: event.startDate,
        endDate: event.endDate,
      ),
    );
  }
}
