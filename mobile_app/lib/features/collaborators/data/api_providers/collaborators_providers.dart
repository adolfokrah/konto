import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:Hoga/core/services/base_api_provider.dart';

class CollaboratorsProvider extends BaseApiProvider {
  CollaboratorsProvider()
    : super(
        dio: ServiceRegistry().dio,
        userStorageService: ServiceRegistry().userStorageService,
      );

  /// Search users by email, phone number, or full name
  Future<List<Map<String, dynamic>>> searchUsers(String query) async {
    if (query.trim().isEmpty) {
      return [];
    }

    try {
      // Get current user to exclude from results
      final currentUser = await userStorageService.getUserData();
      final currentUserId = currentUser?.id;

      final queryParams = {
        'limit': '5', // Get more users to filter on client side
        'depth': '1', // Populate photo object to get thumbnailURL
      };

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/users',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final users =
            (data['docs'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();

        // Filter results to also match combined phone number format and exclude current user
        final filteredUsers =
            users.where((user) {
              // Exclude current user
              final userId = user['id']?.toString();
              if (userId != null && userId == currentUserId) {
                return false;
              }

              final email = user['email']?.toString().toLowerCase() ?? '';
              final fullName = user['fullName']?.toString().toLowerCase() ?? '';
              final phoneNumber = user['phoneNumber']?.toString() ?? '';
              final countryCode = user['countryCode']?.toString() ?? '';
              final combinedPhone = '$countryCode$phoneNumber'.replaceAll(
                '+',
                '',
              );

              final searchQuery = query
                  .toLowerCase()
                  .replaceAll('+', '')
                  .replaceAll(' ', '');

              return email.contains(searchQuery) ||
                  fullName.contains(searchQuery) ||
                  phoneNumber.contains(searchQuery) ||
                  combinedPhone.contains(searchQuery);
            }).toList();

        print('✅ Filtered users: ${filteredUsers.length} found');
        for (var user in filteredUsers) {
          print('  - ${user['fullName']} (${user['email']})');
        }

        return filteredUsers;
      } else {
        throw Exception('Failed to search users: ${response.statusCode}');
      }
    } catch (e) {
      print('Error searching users: $e');
      // For search operations, we can return empty list or throw exception
      // Let's throw for consistency with existing behavior
      throw Exception('Failed to search users: $e');
    }
  }

  /// Send reminder to a collector for a jar
  Future<Map<String, dynamic>> sendReminderToCollector({
    required String jarId,
    required String collectorId,
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) {
        return getUnauthenticatedError();
      }
      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.sendReminderEndpoint}',
        data: {'jarId': jarId, 'collectorId': collectorId},
        options: Options(headers: headers),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        return {
          'success': true,
          'message': data['message'] ?? 'Reminder sent successfully',
          'data': data['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              response.data['message'] ??
              'Failed to send reminder: ${response.statusCode}',
          'error': response.data['error'] ?? 'Unknown error',
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      return handleApiError(e, 'Send reminder to collector');
    }
  }
}
