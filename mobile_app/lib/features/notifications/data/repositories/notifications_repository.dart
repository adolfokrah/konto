import 'package:Hoga/features/notifications/data/api_proivders/notifications_provider.dart';
import 'package:Hoga/features/notifications/data/models/notification_model.dart';

/// Repository for notification operations
/// Acts as a boundary between UI/business logic and the API provider
class NotificationsRepository {
  final NotificationsApiProvider _apiProvider;

  NotificationsRepository({required NotificationsApiProvider apiProvider})
    : _apiProvider = apiProvider;

  /// Fetch notifications for the authenticated user.
  /// Returns a standardized map:
  /// { success: bool, data: List<NotificationModel>, pagination: {...}, message: String }
  Future<Map<String, dynamic>> fetchUserNotifications({
    int? limit,
    int? page,
  }) async {
    try {
      final response = await _apiProvider.getUserNotifications(
        limit: limit,
        page: page,
      );

      if (response['success'] != true) {
        return {
          'success': false,
          'message': response['message'] ?? 'Failed to fetch notifications',
          'error': response['error'],
          'statusCode': response['statusCode'],
        };
      }

      final data = response['data'] ?? {};
      final rawDocs = data['docs'] as List<dynamic>? ?? [];
      final models = <NotificationModel>[];
      for (final doc in rawDocs) {
        if (doc is Map<String, dynamic>) {
          try {
            models.add(NotificationModel.fromJson(doc));
          } catch (_) {
            // Skip malformed document
          }
        }
      }

      return {
        'success': true,
        'data': models,
        'pagination': {
          'totalDocs': data['totalDocs'],
          'limit': data['limit'],
          'totalPages': data['totalPages'],
          'page': data['page'],
          'hasNextPage': data['hasNextPage'],
          'hasPrevPage': data['hasPrevPage'],
        },
        'message': response['message'] ?? 'Notifications fetched successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Unexpected error while fetching notifications',
        'error': e.toString(),
      };
    }
  }

  /// Accept or decline a jar invite
  /// Returns standardized map:
  /// { success: bool, data: {...}, message: String }
  Future<Map<String, dynamic>> acceptDeclineInvite({
    required String jarId,
    required bool accept,
  }) async {
    try {
      final response = await _apiProvider.acceptDeclineInvite(
        jarId: jarId,
        accept: accept,
      );

      if (response['success'] != true) {
        return {
          'success': false,
          'message': response['message'] ?? 'Failed to process invite',
          'error': response['error'],
          'statusCode': response['statusCode'],
        };
      }

      return {
        'success': true,
        'data': response['data'],
        'message': response['message'] ?? 'Invite processed successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Unexpected error while processing invite',
        'error': e.toString(),
      };
    }
  }

  /// Mark a notification as read
  Future<Map<String, dynamic>> markNotificationAsRead({
    required String notificationId,
  }) async {
    try {
      final response = await _apiProvider.markNotificationAsRead(
        notificationId: notificationId,
      );
      if (response['success'] != true) {
        return {
          'success': false,
          'message':
              response['message'] ?? 'Failed to mark notification as read',
          'error': response['error'],
          'statusCode': response['statusCode'],
        };
      }
      return {
        'success': true,
        'data': response['data'],
        'message': response['message'] ?? 'Notification marked as read',
      };
    } catch (e) {
      // Log error but do not throw
      print('Error marking notification as read: ${e.toString()}');
      return {
        'success': false,
        'message': 'Unexpected error while marking notification as read',
        'error': e.toString(),
      };
    }
  }
}
