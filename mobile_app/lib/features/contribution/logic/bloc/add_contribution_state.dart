part of 'add_contribution_bloc.dart';

@immutable
sealed class AddContributionState {}

final class AddContributionInitial extends AddContributionState {}

final class AddContributionLoading extends AddContributionState {}

final class AddContributionSuccess extends AddContributionState {}

final class AddContributionFailure extends AddContributionState {
  final String errorMessage;

  AddContributionFailure(this.errorMessage);
}
