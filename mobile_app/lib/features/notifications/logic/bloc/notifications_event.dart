part of 'notifications_bloc.dart';

@immutable
sealed class NotificationsEvent {}

final class FetchNotifications extends NotificationsEvent {
  final int? limit;
  final int? page;

  FetchNotifications({this.limit, this.page});
}
