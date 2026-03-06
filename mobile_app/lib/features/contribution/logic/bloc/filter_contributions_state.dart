part of 'filter_contributions_bloc.dart';

@immutable
sealed class FilterContributionsState {}

final class FilterContributionsLoaded extends FilterContributionsState {
  final List<String>? selectedPaymentMethods;
  final List<String>? selectedStatuses;
  final List<String>? selectedCollectors;
  final List<String>? selectedTransactionTypes;
  final String? selectedDate;
  final DateTime? startDate;
  final DateTime? endDate;

  FilterContributionsLoaded({
    this.selectedPaymentMethods,
    this.selectedStatuses,
    this.selectedCollectors,
    this.selectedTransactionTypes,
    this.selectedDate,
    this.startDate,
    this.endDate,
  });

  /// Check if any filters are applied
  bool get hasFilters =>
      selectedPaymentMethods?.isNotEmpty == true ||
      selectedStatuses?.isNotEmpty == true ||
      selectedCollectors?.isNotEmpty == true ||
      selectedTransactionTypes?.isNotEmpty == true ||
      (selectedDate != null && selectedDate != FilterOptions.defaultDateOption);
}
