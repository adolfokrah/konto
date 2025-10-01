part of 'reminder_bloc.dart';

@immutable
sealed class ReminderEvent {}

final class SendReminderToCollector extends ReminderEvent {
  final String collectorId;
  final String jarId;

  SendReminderToCollector({required this.collectorId, required this.jarId});
}
