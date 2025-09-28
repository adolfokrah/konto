import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';
import 'package:Hoga/core/services/user_storage_service.dart';

/// API Provider for notification-related operations
/// Uses Payload CMS collection: `notifications`
/// Collection schema (reference): type (select), message (text), data (json), user (relationship)
class NotificationsApiProvider extends BaseApiProvider {
  NotificationsApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);

  /// Fetch notifications for a specific user (all types).
  /// You can optionally control pagination via limit & page.
  /// Returns a map consistent with other API providers:
  /// { success: bool, message: String, data: dynamic, ... }
  Future<Map<String, dynamic>> getUserNotifications({
    int? limit,
    int? page, // for pagination if needed
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Resolve userId from storage if not supplied
      final user = await userStorageService.getUserData();
      String? resolvedUserId = user?.id;

      if (resolvedUserId == null || resolvedUserId.isEmpty) {
        return {
          'success': false,
          'message':
              'User ID not provided and could not be resolved from storage',
          'error': 'missing_user_id',
        };
      }

      // Build query parameters for Payload CMS collection endpoint
      // We only filter by user; no type filtering per request
      final queryParams = <String, dynamic>{
        'where[user][equals]': resolvedUserId,
        'depth': 0, // To populate user relationship
      };
      if (limit != null) queryParams['limit'] = limit;
      if (page != null) queryParams['page'] = page;

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}${BackendConfig.notificationsEndpoint}',
        queryParameters: queryParams,
        options: Options(headers: headers),
      );

      // Normalize response structure (Payload returns docs, totalDocs, etc.)
      final data = response.data;
      return {
        'success': true,
        'message': 'Notifications fetched successfully',
        'data': data,
      };
    } catch (e) {
      return handleApiError(
        e,
        'fetching user notifications',
        additionalData: {
          'endpoint': BackendConfig.notificationsEndpoint,
          'operation': 'getUserNotifications',
        },
      );
    }
  }

  Future<Map<String, dynamic>> acceptDeclineInvite({
    required String jarId,
    required bool accept,
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) {
        return getUnauthenticatedError();
      }

      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/accept-decline-invite',
        data: {'jarId': jarId, 'action': accept ? 'accept' : 'decline'},
        options: Options(headers: headers),
      );

      final data = response.data;
      return {
        'success': true,
        'message': data['message'] ?? 'Invite response processed successfully',
        'data': data['data'],
      };
    } catch (e) {
      return handleApiError(
        e,
        'accepting/declining jar invite',
        additionalData: {
          'endpoint': '${BackendConfig.jarsEndpoint}/accept-decline-invite',
          'operation': 'acceptDeclineInvite',
        },
      );
    }
  }
}
