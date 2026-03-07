part of 'fetch_contribution_bloc.dart';

@immutable
sealed class FetchContributionState {}

final class FetchContributionInitial extends FetchContributionState {}

final class FetchContributionLoading extends FetchContributionState {}

final class FetchContributionLoaded extends FetchContributionState {
  final ContributionModel contribution;
  final List<Map<String, dynamic>> refundDocs;

  FetchContributionLoaded(this.contribution, {this.refundDocs = const []});
}

final class FetchContributionError extends FetchContributionState {
  final String message;

  FetchContributionError(this.message);
}
