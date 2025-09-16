import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';
import 'package:Hoga/core/services/user_storage_service.dart';

/// API Provider for contribution-related operations
class ContributionApiProvider extends BaseApiProvider {
  ContributionApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);

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
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Get the current user to set as collector
      final user = await userStorageService.getUserData();

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
        'type': 'contribution',
        // paymentStatus defaults to 'pending' as set in the CMS schema
      };

      // Add account number if payment method is bank transfer
      if (paymentMethod == 'bank-transfer' && accountNumber != null) {
        contributionData['accountNumber'] = accountNumber;
      }

      // Remove null values to avoid sending unnecessary data
      contributionData.removeWhere((key, value) => value == null);

      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/contributions',
        data: contributionData,
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'adding contribution');
    }
  }

  /// Get a specific contribution by its ID
  /// Returns the contribution details if found
  Future<Map<String, dynamic>> getContributionById({
    required String contributionId,
  }) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Validate required fields
      if (contributionId.isEmpty) {
        return {
          'success': false,
          'message': 'Contribution ID is required',
          'statusCode': 400,
        };
      }

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/contributions/$contributionId',
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'fetching contribution');
    }
  }

  /// Fetch list of contributions with optional filtering
  /// Returns paginated contributions based on query parameters
  Future<Map<String, dynamic>> getContributions({
    String? jarId, // Filter contributions by jar ID
    List<String>? paymentMethods, // ['mobile-money', 'cash', 'bank-transfer']
    List<String>? statuses, // ['pending', 'failed', 'transferred', 'completed]
    List<String>? collectors, // List of collector user IDs
    DateTime? startDate, // Filter contributions from this date onwards
    DateTime? endDate, // Filter contributions up to this date
    int? limit, // Number of results per page (default: 10)
    int? page, // Page number (default: 1)
    String? contributor,
  }) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
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

      // Add date range filter
      if (startDate != null) {
        queryParams['where[createdAt][greater_than_equal]'] =
            startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['where[createdAt][less_than_equal]'] =
            endDate.toIso8601String();
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

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/contributions',
        queryParameters: queryParams,
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'fetching contributions list');
    }
  }
}
