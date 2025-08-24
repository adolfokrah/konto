part of 'fetch_contribution_bloc.dart';

@immutable
sealed class FetchContributionEvent {}

final class FetchContributionById extends FetchContributionEvent {
  final String contributionId;

  FetchContributionById(this.contributionId);
}
