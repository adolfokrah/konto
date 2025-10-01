part of 'collectors_bloc.dart';

@immutable
sealed class CollectorsState {}

final class CollectorsInitial extends CollectorsState {}

final class CollectorsLoading extends CollectorsState {}

final class CollectorsLoaded extends CollectorsState {
  final List<CollectorModel> collectors;

  CollectorsLoaded({required this.collectors});
}

final class CollectorsError extends CollectorsState {
  final String message;

  CollectorsError({required this.message});
}
