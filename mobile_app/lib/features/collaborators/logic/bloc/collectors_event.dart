part of 'collectors_bloc.dart';

@immutable
sealed class CollectorsEvent {}

final class SearchCollectors extends CollectorsEvent {
  final String query;

  SearchCollectors(this.query);
}
