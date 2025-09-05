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
    required String jarGroup,
    String? imageId,
    bool isActive = true,
    bool isFixedContribution = false,
    double? acceptedContributionAmount,
    double? goalAmount,
    DateTime? deadline,
    required String currency,
    bool acceptAnonymousContributions = false,
    List<Map<String, dynamic>>? invitedCollectors,
  }) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      // Get the current user to set as creator
      final user = await _userStorageService.getUserData();

      if (user == null) {
        return {
          'success': false,
          'message': 'User not authenticated',
          'statusCode': 401,
        };
      }

      // Process and validate invitedCollectors data
      List<Map<String, dynamic>> processedInvitedCollectors = [];
      if (invitedCollectors != null) {
        for (int i = 0; i < invitedCollectors.length; i++) {
          final collector = invitedCollectors[i];

          // Validate and clean collector data
          final processedCollector = <String, dynamic>{};

          // Extract name safely
          final name = collector['name'];
          if (name is String && name.isNotEmpty) {
            processedCollector['name'] = name;
          }

          // Extract phoneNumber safely
          final phoneNumber = collector['phoneNumber'];
          if (phoneNumber is String && phoneNumber.isNotEmpty) {
            processedCollector['phoneNumber'] = phoneNumber;
          }

          // Extract status safely
          final status = collector['status'] ?? 'pending';
          if (status is String) {
            processedCollector['status'] = status;
          }

          // Explicitly set collector to null to avoid hook confusion
          processedCollector['collector'] = null;

          processedInvitedCollectors.add(processedCollector);
        }
      }

      // Prepare jar data based on the collection schema
      final jarData = {
        'name': name,
        'description': description,
        'jarGroup': jarGroup,
        'image': imageId,
        'isActive': isActive,
        'isFixedContribution': isFixedContribution,
        'acceptedContributionAmount': acceptedContributionAmount,
        'goalAmount': goalAmount ?? 0,
        'deadline':
            deadline != null
                ? '${deadline.year.toString().padLeft(4, '0')}-${deadline.month.toString().padLeft(2, '0')}-${deadline.day.toString().padLeft(2, '0')}'
                : null,
        'currency': currency, // Now a text field
        'creator': user.id, // Set the authenticated user as creator
        'acceptAnonymousContributions': acceptAnonymousContributions,
        'invitedCollectors': processedInvitedCollectors,
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
    bool? acceptAnonymousContributions,
    List<String>? acceptedPaymentMethods,
    List<Map<String, dynamic>>? invitedCollectors,
    String? thankYouMessage,
  }) async {
    try {
      // Get authenticated headers
      final headers = await _getAuthenticatedHeaders();

      if (headers == null) {
        return _getUnauthenticatedError();
      }

      // Process and validate invitedCollectors data if provided
      List<Map<String, dynamic>>? processedInvitedCollectors;
      if (invitedCollectors != null) {
        processedInvitedCollectors = [];
        for (int i = 0; i < invitedCollectors.length; i++) {
          final collector = invitedCollectors[i];

          // Validate and clean collector data
          final processedCollector = <String, dynamic>{};

          // Extract name safely
          final name = collector['name'];
          if (name is String && name.isNotEmpty) {
            processedCollector['name'] = name;
          }

          // Extract phoneNumber safely
          final phoneNumber = collector['phoneNumber'];
          if (phoneNumber is String && phoneNumber.isNotEmpty) {
            processedCollector['phoneNumber'] = phoneNumber;
          }

          // Extract status safely
          final status = collector['status'] ?? 'pending';
          if (status is String) {
            processedCollector['status'] = status;
          }

          // Extract thankYouMessage safely
          final thankYouMessage = collector['thankYouMessage'];
          if (thankYouMessage is String && thankYouMessage.isNotEmpty) {
            processedCollector['thankYouMessage'] = thankYouMessage;
          }

          // Explicitly set collector to null to avoid hook confusion
          processedCollector['collector'] = null;

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
      if (acceptAnonymousContributions != null) {
        jarData['acceptAnonymousContributions'] = acceptAnonymousContributions;
      }
      if (processedInvitedCollectors != null) {
        jarData['invitedCollectors'] = processedInvitedCollectors;
      }
      if (thankYouMessage != null) {
        jarData['thankYouMessage'] = thankYouMessage;
      }

      final response = await _dio.patch(
        '${BackendConfig.apiBaseUrl}${BackendConfig.jarsEndpoint}/$jarId',
        data: jarData,
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return _handleApiError(e, 'updating jar');
    }
  }
}
