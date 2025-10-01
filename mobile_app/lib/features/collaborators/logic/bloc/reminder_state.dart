part of 'reminder_bloc.dart';

@immutable
sealed class ReminderState {}

final class ReminderInitial extends ReminderState {}

final class ReminderInProgress extends ReminderState {}

final class ReminderSuccess extends ReminderState {
  final String message;

  ReminderSuccess({required this.message});
}

final class ReminderFailure extends ReminderState {
  final String error;

  ReminderFailure(this.error);
}
