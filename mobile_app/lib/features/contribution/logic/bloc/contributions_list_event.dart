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
  final bool isAdminCollector; // Whether user is an admin collector on this jar

  /// When set, the feed spans every jar in the scope instead of [jarId]
  /// (which is then ignored).
  final AllJarsScope? allJarsScope;

  FetchContributions({
    required this.jarId,
    this.page = 1,
    this.limit = 10,
    this.contributor,
    this.currentUserId,
    this.jarCreatorId,
    this.isAdminCollector = false,
    this.allJarsScope,
  });
}

/// The user's jars for the all-jars feed, split by what they may see:
/// every payment on jars they own or are an accepted admin collector on,
/// only the payments they collected on the rest.
@immutable
class AllJarsScope {
  final List<String> fullAccessJarIds;
  final List<String> collectorOnlyJarIds;

  const AllJarsScope({
    required this.fullAccessJarIds,
    required this.collectorOnlyJarIds,
  });

  bool get isEmpty => fullAccessJarIds.isEmpty && collectorOnlyJarIds.isEmpty;
}
