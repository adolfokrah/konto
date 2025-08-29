part of 'contributions_list_bloc.dart';

/// Enum for payment methods
enum PaymentMethod {
  mobileMoney('mobile-money'),
  cash('cash'),
  bankTransfer('bank-transfer');

  const PaymentMethod(this.value);
  final String value;
}

/// Enum for contribution statuses
enum ContributionStatus {
  pending('pending'),
  failed('failed'),
  transferred('transferred'),
  completed('completed');

  const ContributionStatus(this.value);
  final String value;
}

@immutable
sealed class ContributionsListEvent {}

final class FetchContributions extends ContributionsListEvent {
  final String jarId;
  final List<PaymentMethod>? paymentMethods;
  final List<ContributionStatus>? statuses;
  final List<String>? collectors; // List of collector user IDs
  final DateTime? date; // Filter contributions from this date onwards
  final String? contributor; // Filter contributions by contributor name
  final int page;
  final int limit;

  FetchContributions({
    required this.jarId,
    this.paymentMethods,
    this.statuses,
    this.collectors,
    this.date,
    this.page = 1,
    this.limit = 10,
    this.contributor,
  });
}
