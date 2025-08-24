part of 'fetch_contribution_bloc.dart';

@immutable
sealed class FetchContributionState {}

final class FetchContributionInitial extends FetchContributionState {}

final class FetchContributionLoading extends FetchContributionState {}

final class FetchContributionLoaded extends FetchContributionState {
  final ContributionModel contribution;

  FetchContributionLoaded(this.contribution);
}

final class FetchContributionError extends FetchContributionState {
  final String message;

  FetchContributionError(this.message);
}
