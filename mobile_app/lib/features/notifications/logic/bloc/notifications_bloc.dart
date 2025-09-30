import 'package:Hoga/features/notifications/data/models/notification_model.dart';
import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/core/services/service_registry.dart';

part 'notifications_event.dart';
part 'notifications_state.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  NotificationsBloc() : super(NotificationsInitial()) {
    on<FetchNotifications>(_fetchNotifications);
    on<MarkjarInviteAsRead>(_markJarInviteAsRead);
  }

  Future<void> _fetchNotifications(
    FetchNotifications event,
    Emitter<NotificationsState> emit,
  ) async {
    emit(NotificationsLoading());
    try {
      // Access repository from ServiceRegistry
      final repo = ServiceRegistry().notificationsRepository;

      final response = await repo.fetchUserNotifications(
        limit: event.limit,
        page: event.page,
      );

      if (response['success'] == true) {
        final List<NotificationModel> notifications =
            (response['data'] as List<NotificationModel>);
        final pagination =
            response['pagination'] as Map<String, dynamic>? ?? {};
        emit(
          NotificationsLoaded(
            notifications: notifications,
            pagination: pagination,
          ),
        );
      } else {
        emit(
          NotificationsError(
            message: response['message'] ?? 'Failed to fetch notifications',
          ),
        );
      }
    } catch (e) {
      emit(NotificationsError(message: 'Failed to fetch notifications'));
    }
  }

  Future<void> _markJarInviteAsRead(
    MarkjarInviteAsRead event,
    Emitter<NotificationsState> emit,
  ) async {
    try {
      final repo = ServiceRegistry().notificationsRepository;
      await repo.markNotificationAsRead(notificationId: event.notificationId);
      // After marking as read, refetch the latest notifications without flashing loading state.
      try {
        final response = await repo.fetchUserNotifications(limit: 20, page: 1);
        if (response['success'] == true) {
          final List<NotificationModel> notifications =
              (response['data'] as List<NotificationModel>);
          final pagination =
              response['pagination'] as Map<String, dynamic>? ?? {};
          emit(
            NotificationsLoaded(
              notifications: notifications,
              pagination: pagination,
            ),
          );
        }
      } catch (e) {
        // Silent fail; we already marked as read
      }
    } catch (e) {
      // Log error but do not change state
      print('Error marking notification as read: ${e.toString()}');
    }
  }
}
