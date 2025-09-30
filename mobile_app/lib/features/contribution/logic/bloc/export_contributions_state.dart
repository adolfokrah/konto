part of 'export_contributions_bloc.dart';

abstract class ExportContributionsState extends Equatable {
  const ExportContributionsState();
  @override
  List<Object?> get props => [];
}

class ExportContributionsInitial extends ExportContributionsState {}

class ExportContributionsInProgress extends ExportContributionsState {}

class ExportContributionsSuccess extends ExportContributionsState {
  final String message;
  const ExportContributionsSuccess({required this.message});
  @override
  List<Object?> get props => [message];
}

class ExportContributionsFailure extends ExportContributionsState {
  final String message;
  const ExportContributionsFailure({required this.message});
  @override
  List<Object?> get props => [message];
}
