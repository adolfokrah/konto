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
    required String paymentMethod, // 'mobile-money' | 'bank' | 'cash'
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
      if (paymentMethod == 'bank' && accountNumber != null) {
        contributionData['accountNumber'] = accountNumber;
      }

      // Remove null values to avoid sending unnecessary data
      contributionData.removeWhere((key, value) => value == null);

      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/transactions',
        data: contributionData,
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 400) {
        // Handle validation errors (like missing withdrawal account)
        final errorMessage =
            e.response?.data?['message'] ?? 'Validation error occurred';
        return {'success': false, 'message': errorMessage, 'data': null};
      }
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
        '${BackendConfig.apiBaseUrl}/transactions/$contributionId',
        queryParameters: {
          'depth': '2', // Include related data (collector, jar, etc.)
        },
        options: Options(headers: headers),
      );

      if (response.data != null && response.data is Map) {
        final collector = response.data['collector'];
        print('🔍 DEBUG API: Collector field in response: $collector');
        print('🔍 DEBUG API: Collector type: ${collector.runtimeType}');

        // If collector is just an ID string, try to populate from jar's invitedCollectors
        if (collector is String) {
          print(
            '🔍 DEBUG API: Collector is string ID, looking in invitedCollectors...',
          );
          final jar = response.data['jar'];
          if (jar != null && jar is Map && jar['invitedCollectors'] != null) {
            final invitedCollectors = jar['invitedCollectors'] as List;

            // Find the matching collector in invitedCollectors
            for (final invitedCollector in invitedCollectors) {
              if (invitedCollector is Map &&
                  invitedCollector['collector'] == collector) {
                print(
                  '🔍 DEBUG API: Found collector in invitedCollectors: $invitedCollector',
                );

                // Create a user object from the invited collector data
                final collectorName =
                    invitedCollector['name'] as String? ?? 'Unknown User';
                final collectorPhone =
                    invitedCollector['phoneNumber'] as String? ?? '';

                // Create a minimal user object with the available data
                final userObject = {
                  'id': collector,
                  'fullName': collectorName,
                  'phoneNumber': collectorPhone,
                  'email': '',
                  'countryCode': '',
                  'country': '',
                  'isKYCVerified': false,
                  'role': 'user',
                  'createdAt': DateTime.now().toIso8601String(),
                  'updatedAt': DateTime.now().toIso8601String(),
                  'sessions': [],
                  'appSettings': {
                    'language': 'en',
                    'theme': 'light',
                    'biometricAuthEnabled': false,
                    'notificationsSettings': {
                      'pushNotificationsEnabled': true,
                      'emailNotificationsEnabled': true,
                      'smsNotificationsEnabled': false,
                    },
                  },
                };

                print(
                  '🔍 DEBUG API: Created user object with name: $collectorName',
                );
                response.data['collector'] = userObject;
                break;
              }
            }
          }
        }
      }

      return response.data;
    } catch (e) {
      return handleApiError(e, 'fetching contribution');
    }
  }

  /// Fetch list of contributions with optional filtering
  /// Returns paginated contributions based on query parameters
  /// Automatically filters contributions based on user role:
  /// - Jar creators see all contributions for their jars
  /// - Regular users only see their own contributions
  Future<Map<String, dynamic>> getContributions({
    String? jarId, // Filter contributions by jar ID
    List<String>? paymentMethods, // ['mobile-money', 'cash', 'bank']
    List<String>? statuses, // ['pending', 'failed', 'completed']
    List<String>? collectors, // List of collector user IDs
    DateTime? startDate, // Filter contributions from this date onwards
    DateTime? endDate, // Filter contributions up to this date
    int? limit, // Number of results per page (default: 10)
    int? page, // Page number (default: 1)
    String? contributor,
    bool? isCurrentUserJarCreator, // Whether current user created the jar
    bool? hasAnyFilters, // Whether any filters are applied
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
                    'bank',
                    'card',
                    'apple-pay',
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
                    'completed',
                  ].contains(status),
                )
                .toList();
        if (validStatuses.isNotEmpty) {
          queryParams['where[paymentStatus][in]'] = validStatuses.join(',');
        }
      }

      // Get current user
      final user = await userStorageService.getUserData();
      if (user == null) {
        return {
          'success': false,
          'message': 'User not authenticated',
          'statusCode': 401,
        };
      }

      // Apply collector filtering logic
      if (isCurrentUserJarCreator == true) {
        // User IS the jar creator
        if (collectors != null && collectors.isNotEmpty) {
          // Collector filter is explicitly applied - use it
          queryParams['where[collector][in]'] = collectors.join(',');
        }
        // If no collector filter, show all contributions for this jar (no collector filter applied)
      } else {
        // User is NOT the jar creator - always filter to their own contributions
        queryParams['where[collector][equals]'] = user.id;
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
        '${BackendConfig.apiBaseUrl}/transactions',
        queryParameters: queryParams,
        options: Options(headers: headers),
      );

      // Ensure response.data is a Map<String, dynamic>
      if (response.data is Map<String, dynamic>) {
        return response.data as Map<String, dynamic>;
      } else {
        // Handle unexpected response format
        return {
          'success': false,
          'message': 'Unexpected response format: ${response.data.runtimeType}',
          'statusCode': response.statusCode ?? 500,
          'data': response.data,
        };
      }
    } catch (e) {
      return handleApiError(e, 'fetching contributions list');
    }
  }

  /// Trigger backend export-to-email for contributions PDF
  /// Accepts same filter signature as list plus optional email override
  Future<Map<String, dynamic>> exportContributionsToEmail({
    required String jarId,
    List<String>? paymentMethods,
    List<String>? statuses,
    List<String>? collectors,
    DateTime? startDate,
    DateTime? endDate,
    String? contributor,
    String? email,
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) return getUnauthenticatedError();

      final queryParams = <String, dynamic>{'jarId': jarId};

      if (paymentMethods != null && paymentMethods.isNotEmpty) {
        queryParams['paymentMethods'] = paymentMethods.join(',');
      }
      if (statuses != null && statuses.isNotEmpty) {
        queryParams['statuses'] = statuses.join(',');
      }
      if (collectors != null && collectors.isNotEmpty) {
        queryParams['collectors'] = collectors.join(',');
      }
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      if (contributor != null && contributor.isNotEmpty) {
        queryParams['contributor'] = contributor;
      }
      if (email != null && email.isNotEmpty) {
        queryParams['email'] = email;
      }

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/transactions/export-contributions',
        queryParameters: queryParams,
        options: Options(headers: headers),
      );
      if (response.data is Map<String, dynamic>) {
        return response.data as Map<String, dynamic>;
      }
      return {
        'success': false,
        'message': 'Unexpected response format',
        'data': response.data,
      };
    } catch (e) {
      return handleApiError(e, 'exporting contributions');
    }
  }
}
