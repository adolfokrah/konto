import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';

/// API provider for jar insights (`GET /api/jars/:id/insights`).
class InsightsApiProvider extends BaseApiProvider {
  InsightsApiProvider({required super.dio, required super.userStorageService});

  /// [period] is 'week', 'month' or 'all'.
  Future<Map<String, dynamic>> getJarInsights({
    required String jarId,
    required String period,
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) return getUnauthenticatedError();

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/$jarId/insights',
        queryParameters: {'period': period},
        options: Options(headers: headers),
      );
      return response.data;
    } catch (e) {
      return handleApiError(e, 'fetching jar insights');
    }
  }
}
