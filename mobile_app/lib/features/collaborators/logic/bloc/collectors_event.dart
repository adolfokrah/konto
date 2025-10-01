part of 'collectors_bloc.dart';

@immutable
sealed class CollectorsEvent {}

final class SearchCollectors extends CollectorsEvent {
  final String query;

  SearchCollectors(this.query);
}

final class SendReminderToCollector extends CollectorsEvent {
  final String jarId;
  final String collectorId;

  SendReminderToCollector({required this.jarId, required this.collectorId});
}
