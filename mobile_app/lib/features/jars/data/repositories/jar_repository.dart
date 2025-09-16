import 'package:Hoga/features/jars/data/api_providers/jar_api_provider.dart';

/// Repository for jar operations
/// Orchestrates business logic between UI and API calls
class JarRepository {
  final JarApiProvider _jarApiProvider;

  JarRepository({required JarApiProvider jarApiProvider})
    : _jarApiProvider = jarApiProvider;

  /// Get jar summary with contributions
  /// Returns JarSummaryModel if successful, null if failed
  Future<Map<String, dynamic>> getJarSummary({required String jarId}) async {
    try {
      final apiResponse = await _jarApiProvider.getJarSummary(jarId: jarId);

      if (apiResponse['success'] == true) {
        try {
          // Parse the API response data into the model

          if (apiResponse['data'] == null) {
            return {'success': true, 'data': null, 'message': 'No jar found'};
          }

          final jarData = apiResponse['data'];

          return {
            'success': true,
            'data': jarData,
            'message': 'Jar summary retrieved successfully',
          };
        } catch (modelError) {
          // Handle JSON parsing errors
          return {'success': true, 'data': null, 'message': 'No jar found'};
        }
      } else {
        // Handle API errors
        return {
          'success': false,
          'message': apiResponse['message'] ?? 'Failed to retrieve jar summary',
          'error': apiResponse['error'],
          'statusCode': apiResponse['statusCode'],
        };
      }
    } catch (e) {
      // Handle unexpected errors
      return {
        'success': false,
        'message': 'An unexpected error occurred while retrieving jar summary',
        'error': e.toString(),
      };
    }
  }

  Future<Map<String, dynamic>> getUserJars() async {
    try {
      final response = await _jarApiProvider.getUserJars();

      if (response['success'] == true) {
        // Parse the response data into a list of JarGroup

        return {
          'success': true,
          'data': response['data'],
          'message': 'User jars retrieved successfully',
        };
      } else {
        return {
          'success': false,
          'message': response['message'] ?? 'Failed to retrieve user jars',
          'error': response['error'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An unexpected error occurred while retrieving user jars',
        'error': e.toString(),
      };
    }
  }

  /// Create a new jar
  /// Returns success response with jar data if successful
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
      final apiResponse = await _jarApiProvider.createJar(
        name: name,
        description: description,
        jarGroup: jarGroup,
        imageId: imageId,
        isActive: isActive,
        isFixedContribution: isFixedContribution,
        acceptedContributionAmount: acceptedContributionAmount,
        goalAmount: goalAmount,
        deadline: deadline,
        currency: currency,
        acceptAnonymousContributions: acceptAnonymousContributions,
        invitedCollectors: invitedCollectors,
      );

      if (apiResponse['doc'] != null) {
        return {
          'success': true,
          'data': apiResponse['doc'],
          'message': 'Jar created successfully',
        };
      } else {
        // Handle API errors
        return {
          'success': false,
          'message': apiResponse['message'] ?? 'Failed to create jar',
          'error': apiResponse['error'],
          'statusCode': apiResponse['statusCode'],
        };
      }
    } catch (e) {
      // Handle unexpected errors
      return {
        'success': false,
        'message': 'An unexpected error occurred while creating jar',
        'error': e.toString(),
      };
    }
  }

  /// Update an existing jar
  /// Returns success response with updated jar data if successful
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
    bool? showGoal,
    bool? showRecentContributions,
  }) async {
    try {
      final apiResponse = await _jarApiProvider.updateJar(
        jarId: jarId,
        name: name,
        description: description,
        jarGroup: jarGroup,
        imageId: imageId,
        isActive: isActive,
        isFixedContribution: isFixedContribution,
        acceptedContributionAmount: acceptedContributionAmount,
        goalAmount: goalAmount,
        deadline: deadline,
        currency: currency,
        status: status,
        acceptAnonymousContributions: acceptAnonymousContributions,
        acceptedPaymentMethods: acceptedPaymentMethods,
        invitedCollectors: invitedCollectors,
        thankYouMessage: thankYouMessage,
        showGoal: showGoal,
        showRecentContributions: showRecentContributions,
      );

      if (apiResponse['doc'] != null) {
        return {
          'success': true,
          'data': apiResponse['data'],
          'message': 'Jar updated successfully',
        };
      } else {
        // Handle API errors
        return {
          'success': false,
          'message': apiResponse['message'] ?? 'Failed to update jar',
          'error': apiResponse['error'],
          'statusCode': apiResponse['statusCode'],
        };
      }
    } catch (e) {
      // Handle unexpected errors
      return {
        'success': false,
        'message': 'An unexpected error occurred while updating jar',
        'error': e.toString(),
      };
    }
  }
}
