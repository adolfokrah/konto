import 'package:Hoga/features/notifications/data/models/notification_model.dart';
import 'package:Hoga/features/notifications/data/repositories/notifications_repository.dart';
import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'notifications_event.dart';
part 'notifications_state.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  final NotificationsRepository _notificationsRepository;

  NotificationsBloc({
    required NotificationsRepository notificationsRepository,
  }) : _notificationsRepository = notificationsRepository,
       super(NotificationsInitial()) {
    on<FetchNotifications>(_fetchNotifications);
    on<MarkjarInviteAsRead>(_markJarInviteAsRead);
    on<MarkAllNotificationsRead>(_markAllAsRead);
  }

  Future<void> _markAllAsRead(
    MarkAllNotificationsRead event,
    Emitter<NotificationsState> emit,
  ) async {
    final current = state;
    if (current is! NotificationsLoaded) return;
    final unread =
        current.notifications
            .where((n) => n.status == NotificationStatus.unread)
            .toList();
    if (unread.isEmpty) return;

    try {
      await Future.wait(
        unread.map(
          (n) => _notificationsRepository.markNotificationAsRead(
            notificationId: n.id,
          ),
        ),
      );
    } catch (_) {
      // ignore individual failures; refetch reflects what actually changed
    }

    try {
      final response = await _notificationsRepository.fetchUserNotifications(
        limit: 20,
        page: 1,
      );
      if (response['success'] == true) {
        emit(
          NotificationsLoaded(
            notifications: response['data'] as List<NotificationModel>,
            pagination: response['pagination'] as Map<String, dynamic>? ?? {},
          ),
        );
      }
    } catch (_) {
      // silent; marks already applied
    }
  }

  Future<void> _fetchNotifications(
    FetchNotifications event,
    Emitter<NotificationsState> emit,
  ) async {
    emit(NotificationsLoading());
    try {
      final response = await _notificationsRepository.fetchUserNotifications(
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
      await _notificationsRepository.markNotificationAsRead(notificationId: event.notificationId);
      // After marking as read, refetch the latest notifications without flashing loading state.
      try {
        final response = await _notificationsRepository.fetchUserNotifications(limit: 20, page: 1);
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
