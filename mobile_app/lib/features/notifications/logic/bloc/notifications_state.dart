part of 'notifications_bloc.dart';

@immutable
sealed class NotificationsState {}

final class NotificationsInitial extends NotificationsState {}

final class NotificationsLoading extends NotificationsState {}

final class NotificationsLoaded extends NotificationsState {
  final List<NotificationModel> notifications;
  final Map<String, dynamic> pagination;

  NotificationsLoaded({required this.notifications, required this.pagination});
}

final class NotificationsError extends NotificationsState {
  final String message;
  final String? error;

  NotificationsError({required this.message, this.error});
}
