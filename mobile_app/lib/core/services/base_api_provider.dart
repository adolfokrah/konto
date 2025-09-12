import 'package:dio/dio.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/services/user_storage_service.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

/// Base API Provider with standardized error handling and authentication
/// All API providers should extend this class to maintain consistency
abstract class BaseApiProvider {
  final Dio dio;
  final UserStorageService userStorageService;

  BaseApiProvider({required this.dio, required this.userStorageService});

  /// Get authenticated headers with Bearer token
  /// Returns null if user is not authenticated
  Future<Map<String, String>?> getAuthenticatedHeaders() async {
    final authToken = await userStorageService.getAuthToken();

    if (authToken == null) {
      return null;
    }

    return {
      ...BackendConfig.defaultHeaders,
      'Authorization': 'Bearer $authToken',
    };
  }

  /// Standard authentication error response
  Map<String, dynamic> getUnauthenticatedError() {
    return {
      'success': false,
      'message': 'User not authenticated. Please log in again.',
      'error': 'No auth token found',
    };
  }

  /// Handle standard API errors with consistent error responses
  /// Includes Sentry logging for monitoring and debugging
  Map<String, dynamic> handleApiError(
    dynamic error,
    String operation, {
    String? context,
    Map<String, dynamic>? additionalData,
  }) {
    final providerContext = context ?? runtimeType.toString();

    // Log error to Sentry for monitoring
    if (error is DioException) {
      final sentryData = <String, dynamic>{
        'operation': operation,
        'context': providerContext,
        'statusCode': error.response?.statusCode,
        'requestPath': error.requestOptions.path,
        'requestMethod': error.requestOptions.method,
        'responseData': error.response?.data?.toString(),
      };

      // Add any additional data if provided
      if (additionalData != null) {
        additionalData.forEach((key, value) {
          sentryData[key] = value;
        });
      }

      Sentry.captureException(error, hint: Hint.withMap(sentryData));
    } else {
      final sentryData = <String, dynamic>{
        'operation': operation,
        'context': providerContext,
      };

      // Add any additional data if provided
      if (additionalData != null) {
        additionalData.forEach((key, value) {
          sentryData[key] = value;
        });
      }

      Sentry.captureException(error, hint: Hint.withMap(sentryData));
    }

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

      // Handle different DioException types
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return {
            'success': false,
            'message': 'Request timeout while $operation',
            'error': 'Connection timeout',
            'dioErrorType': error.type.toString(),
            'statusCode': 408,
          };
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode ?? 500;
          final errorData = error.response?.data;

          return {
            'success': false,
            'message': errorData?['message'] ?? 'Server error while $operation',
            'error': errorData?['error'] ?? error.message ?? 'Bad response',
            'dioErrorType': error.type.toString(),
            'statusCode': statusCode,
          };
        case DioExceptionType.cancel:
          return {
            'success': false,
            'message': 'Request cancelled while $operation',
            'error': 'Request cancelled',
            'dioErrorType': error.type.toString(),
            'statusCode': 499,
          };
        case DioExceptionType.connectionError:
        case DioExceptionType.unknown:
        default:
          return {
            'success': false,
            'message': 'Network error: ${error.message}',
            'error': error.toString(),
            'dioErrorType': error.type.toString(),
          };
      }
    }

    return {
      'success': false,
      'message': 'Error $operation: ${error.toString()}',
      'error': error.toString(),
    };
  }

  /// Log data structure to Sentry for investigation (useful for debugging)
  /// Use this to investigate data structures on different platforms
  void logDataStructureToSentry({
    required String operation,
    required Map<String, dynamic> data,
    Map<String, dynamic>? additionalContext,
  }) {
    // Create attributes map
    final attributes = <String, SentryLogAttribute>{
      'operation': SentryLogAttribute.string(operation),
      'context': SentryLogAttribute.string(runtimeType.toString()),
      'platform': SentryLogAttribute.string('mobile'),
    };

    // Add data fields as attributes
    data.forEach((key, value) {
      attributes[key] = SentryLogAttribute.string(value.toString());
    });

    // Add additional context if provided
    if (additionalContext != null) {
      additionalContext.forEach((key, value) {
        attributes[key] = SentryLogAttribute.string(value.toString());
      });
    }

    Sentry.logger.info(
      'Data structure for $operation: ${data.toString()}',
      attributes: attributes,
    );
  }
}
