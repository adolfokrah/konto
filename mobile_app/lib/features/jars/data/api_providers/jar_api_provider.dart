import 'package:dio/dio.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/services/user_storage_service.dart';

/// API Provider for jar-related operations
class JarApiProvider {
  final Dio _dio;
  final UserStorageService _userStorageService;

  JarApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : _dio = dio,
       _userStorageService = userStorageService;

  /// Get jar summary with contributions
  Future<Map<String, dynamic>> getJarSummary({required String jarId}) async {
    try {
      // Get auth token from storage
      final authToken = await _userStorageService.getAuthToken();

      if (authToken == null) {
        return {
          'success': false,
          'message': 'User not authenticated. Please log in again.',
          'error': 'No auth token found',
        };
      }

      // Prepare headers with authorization
      final headers = {
        ...BackendConfig.defaultHeaders,
        'Authorization': 'Bearer $authToken',
      };

      final response = await _dio.get(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/$jarId/summary',
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      if (e is DioException) {
        // Handle 401 Unauthorized specifically
        if (e.response?.statusCode == 401) {
          return {
            'success': false,
            'message': 'Your session has expired. Please log in again.',
            'error': 'Unauthorized',
            'dioErrorType': e.type.toString(),
            'statusCode': 401,
          };
        }

        return {
          'success': false,
          'message': 'Network error: ${e.message}',
          'error': e.toString(),
          'dioErrorType': e.type.toString(),
        };
      }
      return {
        'success': false,
        'message': 'Error fetching jar summary: ${e.toString()}',
        'error': e.toString(),
      };
    }
  }
}
