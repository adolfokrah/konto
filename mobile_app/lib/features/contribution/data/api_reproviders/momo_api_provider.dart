import 'package:dio/dio.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/services/user_storage_service.dart';

/// API Provider for mobile money charge operations
class MomoApiProvider {
  final Dio _dio;
  final UserStorageService _userStorageService;

  MomoApiProvider({
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
      'statusCode': 401,
    };
  }

  /// Standard error handling for API responses
  /// Returns a consistent error response with operation context
  Map<String, dynamic> _handleApiError(dynamic error, String operation) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return {
            'success': false,
            'message': 'Request timeout while $operation',
            'error': 'Connection timeout',
            'statusCode': 408,
          };
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode ?? 500;
          final errorData = error.response?.data;

          return {
            'success': false,
            'message': errorData?['message'] ?? 'Server error while $operation',
            'error': errorData?['error'] ?? 'Bad response',
            'statusCode': statusCode,
          };
        case DioExceptionType.cancel:
          return {
            'success': false,
            'message': 'Request cancelled while $operation',
            'error': 'Request cancelled',
            'statusCode': 499,
          };
        case DioExceptionType.connectionError:
        case DioExceptionType.unknown:
        default:
          return {
            'success': false,
            'message':
                'Network error while $operation. Please check your connection.',
            'error': error.message ?? 'Unknown error',
            'statusCode': 500,
          };
      }
    } else {
      return {
        'success': false,
        'message': 'Unexpected error while $operation',
        'error': error.toString(),
        'statusCode': 500,
      };
    }
  }

  /// Initiate mobile money charge for a contribution
  /// Calls the charge-momo endpoint with contribution ID
  Future<Map<String, dynamic>> chargeMomo({
    required String contributionId,
  }) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      // Validate required fields
      if (contributionId.isEmpty) {
        return {
          'success': false,
          'message': 'Contribution ID is required',
          'statusCode': 400,
        };
      }

      // Make request to charge-momo endpoint
      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}/contributions/charge-momo',
        data: {'contributionId': contributionId},
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'initiating mobile money charge');
    }
  }

  /// Submit OTP for mobile money verification (Vodafone)
  /// Calls the send-otp endpoint with reference and OTP code
  Future<Map<String, dynamic>> submitOtp({
    required String reference,
    required String otp,
  }) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      // Validate required fields
      if (reference.isEmpty || otp.isEmpty) {
        return {
          'success': false,
          'message': 'Reference and OTP are required',
          'statusCode': 400,
        };
      }

      // Make request to send-otp endpoint
      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}/contributions/send-otp',
        data: {'reference': reference, 'otp': otp},
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'submitting OTP verification');
    }
  }

  /// Verify payment status using transaction reference
  /// Calls the verify-payment endpoint with payment reference
  Future<Map<String, dynamic>> verifyPayment({
    required String reference,
  }) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      // Validate required fields
      if (reference.isEmpty) {
        return {
          'success': false,
          'message': 'Payment reference is required',
          'statusCode': 400,
        };
      }

      // Make request to verify-payment endpoint
      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}/contributions/verify-payment',
        data: {'reference': reference},
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'verifying payment status');
    }
  }
}
