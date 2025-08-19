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

  /// Get authenticated headers with Bearer token
  /// Returns null if user is not authenticated
  Future<Map<String, String>?> _getAuthenticatedHeaders() async {
    final authToken = await _userStorageService.getAuthToken();

    if (authToken == null) {
      return null;
    }

    return {
      ...BackendConfig.defaultHeaders,
      'Authorization': 'Bearer $authToken',
    };
  }

  /// Standard authentication error response
  Map<String, dynamic> _getUnauthenticatedError() {
    return {
      'success': false,
      'message': 'User not authenticated. Please log in again.',
      'error': 'No auth token found',
    };
  }

  /// Handle standard API errors with consistent error responses
  Map<String, dynamic> _handleApiError(dynamic error, String operation) {
    if (error is DioException) {
      // Handle 401 Unauthorized specifically
      if (error.response?.statusCode == 401) {
        return {
          'success': false,
          'message': 'Your session has expired. Please log in again.',
          'error': 'Unauthorized',
          'dioErrorType': error.type.toString(),
          'statusCode': 401,
        };
      }

      return {
        'success': false,
        'message': 'Network error: ${error.message}',
        'error': error.toString(),
        'dioErrorType': error.type.toString(),
      };
    }

    return {
      'success': false,
      'message': 'Error $operation: ${error.toString()}',
      'error': error.toString(),
    };
  }

  /// Get jar summary with contributions
  Future<Map<String, dynamic>> getJarSummary({required String jarId}) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      final response = await _dio.get(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/$jarId/summary',
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'fetching jar summary');
    }
  }

  /// Get user's jars grouped by jar groups
  Future<Map<String, dynamic>> getUserJars() async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      final response = await _dio.get(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/user-jars',
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'fetching user jars');
    }
  }

  /// Create a new jar
  Future<Map<String, dynamic>> createJar({
    required String name,
    String? description,
    required String jarGroupId,
    String? imageId,
    bool isActive = true,
    bool isFixedContribution = false,
    double? acceptedContributionAmount,
    double? goalAmount,
    DateTime? deadline,
    required String currency,
    bool acceptAnonymousContributions = false,
    required List<String> acceptedPaymentMethods,
    List<Map<String, dynamic>>? invitedCollectors,
  }) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      // Prepare jar data based on the collection schema
      final jarData = {
        'name': name,
        'description': description,
        'jarGroup': jarGroupId,
        'image': imageId,
        'isActive': isActive,
        'isFixedContribution': isFixedContribution,
        'acceptedContributionAmount': acceptedContributionAmount,
        'goalAmount': goalAmount ?? 0,
        'deadline': deadline?.toIso8601String(),
        'currency': currency,
        'acceptAnonymousContributions': acceptAnonymousContributions,
        'acceptedPaymentMethods': acceptedPaymentMethods,
        'invitedCollectors': invitedCollectors,
      };

      // Remove null values to avoid sending unnecessary data
      jarData.removeWhere((key, value) => value == null);

      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}',
        data: jarData,
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'creating jar');
    }
  }
}
