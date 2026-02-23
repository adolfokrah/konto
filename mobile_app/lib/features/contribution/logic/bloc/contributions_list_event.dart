part of 'contributions_list_bloc.dart';

/// Enum for payment methods
enum PaymentMethod {
  mobileMoney('mobile-money'),
  cash('cash'),
  bankTransfer('bank');

  const PaymentMethod(this.value);
  final String value;
}

/// Enum for contribution statuses
enum ContributionStatus {
  pending('pending'),
  failed('failed'),
  completed('completed');

  const ContributionStatus(this.value);
  final String value;
}

@immutable
sealed class ContributionsListEvent {}

final class FetchContributions extends ContributionsListEvent {
  final String jarId;
  final String? contributor; // Filter contributions by contributor name
  final int page;
  final int limit;
  final String? currentUserId; // Current user ID
  final String? jarCreatorId; // Jar creator ID

  FetchContributions({
    required this.jarId,
    this.page = 1,
    this.limit = 10,
    this.contributor,
    this.currentUserId,
    this.jarCreatorId,
  });
}
