part of 'fetch_contribution_bloc.dart';

@immutable
sealed class FetchContributionState {}

final class FetchContributionInitial extends FetchContributionState {}

final class FetchContributionLoading extends FetchContributionState {}

final class FetchContributionLoaded extends FetchContributionState {
  final ContributionModel contribution;
  final List<Map<String, dynamic>> refundDocs;
  final List<Map<String, dynamic>> approvalDocs;
  final int requiredApprovals;

  FetchContributionLoaded(this.contribution, {this.refundDocs = const [], this.approvalDocs = const [], this.requiredApprovals = 1});
}

final class FetchContributionError extends FetchContributionState {
  final String message;

  FetchContributionError(this.message);
}
