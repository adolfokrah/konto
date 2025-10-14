import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';
import 'package:Hoga/core/services/user_storage_service.dart';

/// API Provider for jar-related operations
class JarApiProvider extends BaseApiProvider {
  JarApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);

  /// Get jar summary with contributions
  Future<Map<String, dynamic>> getJarSummary({required String jarId}) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/$jarId/summary',
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'fetching jar summary');
    }
  }

  /// Get user's jars grouped by jar groups
  Future<Map<String, dynamic>> getUserJars() async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/user-jars',
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'fetching user jars');
    }
  }

  /// Create a new jar
  Future<Map<String, dynamic>> createJar({
    required String name,
    String? description,
    required String jarGroup,
    String? imageId,
    bool isActive = true,
    bool isFixedContribution = false,
    double? acceptedContributionAmount,
    double? goalAmount,
    DateTime? deadline,
    required String currency,
    List<Map<String, dynamic>>? invitedCollectors,
  }) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Get the current user to set as creator
      final user = await userStorageService.getUserData();

      if (user == null) {
        return {
          'success': false,
          'message': 'User not authenticated',
          'statusCode': 401,
        };
      }

      // Prepare jar data based on the collection schema
      final jarData = <String, dynamic>{
        'name': name.trim(),
        'jarGroup': jarGroup,
        'isActive': isActive,
        'isFixedContribution': isFixedContribution,
        'acceptedContributionAmount': acceptedContributionAmount,
        'goalAmount': goalAmount ?? 0.0,
        'deadline':
            deadline != null
                ? '${deadline.year.toString().padLeft(4, '0')}-${deadline.month.toString().padLeft(2, '0')}-${deadline.day.toString().padLeft(2, '0')}'
                : null,
        'currency': currency.trim(),
        'creator': user.id,
        'invitedCollectors': invitedCollectors,
      };

      // Only add optional fields if they have valid values
      if (description != null && description.isNotEmpty) {
        jarData['description'] = description.trim();
      }

      // CRITICAL FIX: Only add image if it's not null AND not empty
      if (imageId != null && imageId.isNotEmpty) {
        jarData['image'] = imageId;
      }

      // Remove null values and empty strings to avoid sending problematic data
      jarData.removeWhere(
        (key, value) => value == null || (value is String && value.isEmpty),
      );

      // Log jarData structure to Sentry for investigation
      logDataStructureToSentry(
        operation: 'createJar',
        data: jarData,
        additionalContext: {
          'jarName': name,
          'jarGroup': jarGroup,
          'currency': currency,
          'hasInvitedCollectors': invitedCollectors?.isNotEmpty ?? false,
        },
      );

      // Force explicit Content-Type to avoid device-specific defaults
      final enhancedHeaders = {
        ...headers,
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
      };

      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}',
        data: jarData,
        options: Options(
          headers: enhancedHeaders,
          contentType: 'application/json',
          responseType: ResponseType.json,
        ),
      );

      return response.data;
    } catch (e) {
      // Enhanced error handling for jar creation with additional context
      return handleApiError(
        e,
        'creating jar',
        context: 'JarApiProvider.createJar',
        additionalData: {
          'jarName': name,
          'jarGroup': jarGroup,
          'currency': currency,
          'hasInvitedCollectors': invitedCollectors?.isNotEmpty ?? false,
          'invitedCollectorsCount': invitedCollectors?.length ?? 0,
          'requestUrl':
              '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}',
        },
      );
    }
  }

  /// Update an existing jar
  Future<Map<String, dynamic>> updateJar({
    required String jarId,
    String? name,
    String? description,
    String? jarGroup,
    String? imageId,
    bool? isActive,
    bool? isFixedContribution,
    double? acceptedContributionAmount,
    double? goalAmount,
    DateTime? deadline,
    String? currency,
    String? status,
    List<String>? acceptedPaymentMethods,
    List<Map<String, dynamic>>? invitedCollectors,
    String? thankYouMessage,
    bool? showGoal,
    bool? showRecentContributions,
    bool? allowAnonymousContributions,
    String? whoPaysPlatformFees,
  }) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Process and validate invitedCollectors data if provided
      List<Map<String, dynamic>>? processedInvitedCollectors;
      if (invitedCollectors != null) {
        processedInvitedCollectors = [];
        for (int i = 0; i < invitedCollectors.length; i++) {
          final collector = invitedCollectors[i];

          // Validate and clean collector data
          final processedCollector = <String, dynamic>{};

          // Extract collector ID - handle both String ID and Contact object
          // Extract collector ID - should always be a string now
          final collectorField = collector['collector'];

          if (collectorField is String && collectorField.isNotEmpty) {
            processedCollector['collector'] = collectorField;
          } else {
            continue; // Skip invalid collectors
          }

          // Extract status safely
          final status = collector['status'] ?? 'pending';
          if (status is String) {
            processedCollector['status'] = status;
          }

          processedInvitedCollectors.add(processedCollector);
        }
      }

      // Prepare jar data with only the fields that are being updated
      final jarData = <String, dynamic>{};

      if (name != null) jarData['name'] = name;
      if (description != null) jarData['description'] = description;
      if (jarGroup != null) jarData['jarGroup'] = jarGroup;
      if (imageId != null) jarData['image'] = imageId;
      if (isActive != null) jarData['isActive'] = isActive;
      if (isFixedContribution != null) {
        jarData['isFixedContribution'] = isFixedContribution;
      }
      if (acceptedContributionAmount != null) {
        jarData['acceptedContributionAmount'] = acceptedContributionAmount;
      }
      if (goalAmount != null) jarData['goalAmount'] = goalAmount;
      if (deadline != null) {
        // Format date as YYYY-MM-DD to avoid timezone issues
        jarData['deadline'] =
            '${deadline.year.toString().padLeft(4, '0')}-${deadline.month.toString().padLeft(2, '0')}-${deadline.day.toString().padLeft(2, '0')}';
      }
      if (currency != null) jarData['currency'] = currency;
      if (status != null) jarData['status'] = status;
      if (processedInvitedCollectors != null) {
        jarData['invitedCollectors'] = processedInvitedCollectors;
      }
      if (thankYouMessage != null) {
        jarData['thankYouMessage'] = thankYouMessage;
      }
      if (allowAnonymousContributions != null) {
        jarData['allowAnonymousContributions'] = allowAnonymousContributions;
      }

      // Handle paymentPage fields together to avoid overwriting
      final paymentPageData = <String, dynamic>{};
      if (showGoal != null) {
        paymentPageData['showGoal'] = showGoal;
      }
      if (showRecentContributions != null) {
        paymentPageData['showRecentContributions'] = showRecentContributions;
      }
      if (paymentPageData.isNotEmpty) {
        jarData['paymentPage'] = paymentPageData;
      }
      if (whoPaysPlatformFees != null) {
        jarData['whoPaysPlatformFees'] = whoPaysPlatformFees;
      }
      final response = await dio.patch(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/$jarId',
        data: jarData,
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'updating jar');
    }
  }
}
