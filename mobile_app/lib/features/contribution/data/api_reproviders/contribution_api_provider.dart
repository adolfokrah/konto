import 'package:dio/dio.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/services/user_storage_service.dart';

/// API Provider for contribution-related operations
class ContributionApiProvider {
  final Dio _dio;
  final UserStorageService _userStorageService;

  ContributionApiProvider({
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

  /// Add a contribution to a jar collection in the CMS
  /// Creates a new contribution with payment method details
  Future<Map<String, dynamic>> addContribution({
    required String jarId,
    String? contributor,
    String? contributorPhoneNumber,
    required String paymentMethod, // 'mobile-money' | 'bank-transfer' | 'cash'
    String? accountNumber, // Required for bank transfers
    required double amountContributed,
    bool viaPaymentLink = false,
    required String mobileMoneyProvider, // Required for mobile money
  }) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      // Get the current user to set as collector
      final user = await _userStorageService.getUserData();

      if (user == null) {
        return {
          'success': false,
          'message': 'User not authenticated',
          'statusCode': 401,
        };
      }

      // Validate required fields
      if (jarId.isEmpty) {
        return {
          'success': false,
          'message': 'Jar ID is required',
          'statusCode': 400,
        };
      }

      if (user.id.isEmpty) {
        return {
          'success': false,
          'message': 'Invalid user ID',
          'statusCode': 400,
        };
      }

      // Prepare contribution data based on the collection schema
      final contributionData = {
        'jar': jarId,
        'contributor': contributor,
        'contributorPhoneNumber': contributorPhoneNumber,
        'paymentMethod': paymentMethod,
        'amountContributed': amountContributed,
        'collector': user.id, // Set the authenticated user as collector
        'viaPaymentLink': viaPaymentLink,
        'mobileMoneyProvider': mobileMoneyProvider,
        // paymentStatus defaults to 'pending' as set in the CMS schema
      };

      // Add account number if payment method is bank transfer
      if (paymentMethod == 'bank-transfer' && accountNumber != null) {
        contributionData['accountNumber'] = accountNumber;
      }

      // Remove null values to avoid sending unnecessary data
      contributionData.removeWhere((key, value) => value == null);

      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}/contributions',
        data: contributionData,
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'adding contribution');
    }
  }

  /// Get a specific contribution by its ID
  /// Returns the contribution details if found
  Future<Map<String, dynamic>> getContributionById({
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

      final response = await _dio.get(
        '${BackendConfig.apiBaseUrl}/contributions/$contributionId',
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'fetching contribution');
    }
  }

  /// Fetch list of contributions with optional filtering
  /// Returns paginated contributions based on query parameters
  Future<Map<String, dynamic>> getContributions({
    String? jarId, // Filter contributions by jar ID
    List<String>? paymentMethods, // ['mobile-money', 'cash', 'bank-transfer']
    List<String>? statuses, // ['pending', 'failed', 'transferred', 'completed]
    List<String>? collectors, // List of collector user IDs
    DateTime? date, // Filter contributions from this date onwards
    int? limit, // Number of results per page (default: 10)
    int? page, // Page number (default: 1)
    String? contributor,
  }) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      // Build query parameters
      final Map<String, dynamic> queryParams = {};

      // Add jar filter
      if (jarId != null && jarId.isNotEmpty) {
        queryParams['where[jar][equals]'] = jarId;
      }

      // Add payment method filter
      if (paymentMethods != null && paymentMethods.isNotEmpty) {
        final validPaymentMethods =
            paymentMethods
                .where(
                  (method) => [
                    'mobile-money',
                    'cash',
                    'bank-transfer',
                  ].contains(method),
                )
                .toList();
        if (validPaymentMethods.isNotEmpty) {
          queryParams['where[paymentMethod][in]'] = validPaymentMethods.join(
            ',',
          );
        }
      }

      // Add status filter (using paymentStatus field from CMS)
      if (statuses != null && statuses.isNotEmpty) {
        final validStatuses =
            statuses
                .where(
                  (status) => [
                    'pending',
                    'failed',
                    'transferred',
                    'completed',
                  ].contains(status),
                )
                .toList();
        if (validStatuses.isNotEmpty) {
          queryParams['where[paymentStatus][in]'] = validStatuses.join(',');
        }
      }

      // Add collectors filter
      if (collectors != null && collectors.isNotEmpty) {
        queryParams['where[collector][in]'] = collectors.join(',');
      }

      // Add date filter (contributions created on or after the specified date)
      if (date != null) {
        queryParams['where[createdAt][greater_than_equal]'] =
            date.toIso8601String();
      }

      // Add pagination parameters
      if (limit != null) {
        queryParams['limit'] = limit.toString();
      }
      if (page != null) {
        queryParams['page'] = page.toString();
      }

      //Add contributor name search
      if (contributor != null && contributor.isNotEmpty) {
        queryParams['where[contributor][contains]'] = contributor;
      }

      // Add sorting and depth
      queryParams['sort'] = '-createdAt'; // Sort by newest first
      queryParams['depth'] = '2'; // Include related data

      final response = await _dio.get(
        '${BackendConfig.apiBaseUrl}/contributions',
        queryParameters: queryParams,
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'fetching contributions list');
    }
  }
}
