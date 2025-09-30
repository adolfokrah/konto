part of 'filter_contributions_bloc.dart';

@immutable
sealed class FilterContributionsEvent {}

final class InitializeFilters extends FilterContributionsEvent {}

final class TogglePaymentMethod extends FilterContributionsEvent {
  final String paymentMethod;

  TogglePaymentMethod(this.paymentMethod);
}

final class ToggleStatus extends FilterContributionsEvent {
  final String status;

  ToggleStatus(this.status);
}

final class ToggleCollector extends FilterContributionsEvent {
  final String collectorId;

  ToggleCollector(this.collectorId);
}

final class UpdateDateRange extends FilterContributionsEvent {
  final String selectedDate;
  final DateTime? startDate;
  final DateTime? endDate;

  UpdateDateRange({required this.selectedDate, this.startDate, this.endDate});
}

final class ClearAllFilters extends FilterContributionsEvent {}

final class SelectAllFilters extends FilterContributionsEvent {
  final List<String> allCollectorIds;

  SelectAllFilters(this.allCollectorIds);
}

final class ApplyFilters extends FilterContributionsEvent {
  final List<String> paymentMethods;
  final List<String> statuses;
  final List<String> collectors;
  final String? selectedDate;
  final DateTime? startDate;
  final DateTime? endDate;

  ApplyFilters({
    required this.paymentMethods,
    required this.statuses,
    required this.collectors,
    this.selectedDate,
    this.startDate,
    this.endDate,
  });
}
