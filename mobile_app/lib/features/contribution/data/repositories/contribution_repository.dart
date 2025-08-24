import 'package:konto/features/contribution/data/api_reproviders/contribution_api_provider.dart';

/// Repository for contribution operations
/// Orchestrates business logic between UI and API calls
class ContributionRepository {
  final ContributionApiProvider _contributionApiProvider;

  ContributionRepository({
    required ContributionApiProvider contributionApiProvider,
  }) : _contributionApiProvider = contributionApiProvider;

  /// Add a contribution to a jar collection in the CMS
  /// Returns success response with contribution data if successful
  Future<Map<String, dynamic>> addContribution({
    required String jarId,
    String? contributor,
    String? contributorPhoneNumber,
    required String paymentMethod,
    String? accountNumber,
    required double amountContributed,
    bool viaPaymentLink = false,
  }) async {
    try {
      final apiResponse = await _contributionApiProvider.addContribution(
        jarId: jarId,
        contributor: contributor,
        contributorPhoneNumber: contributorPhoneNumber,
        paymentMethod: paymentMethod,
        accountNumber: accountNumber,
        amountContributed: amountContributed,
        viaPaymentLink: viaPaymentLink,
      );

      if (apiResponse['doc'] != null) {
        return {
          'success': true,
          'data': apiResponse['doc'],
          'message': 'Contribution added successfully',
        };
      } else {
        // Handle API errors
        return {
          'success': false,
          'message': apiResponse['message'] ?? 'Failed to add contribution',
          'error': apiResponse['error'],
          'statusCode': apiResponse['statusCode'],
        };
      }
    } catch (e) {
      // Handle unexpected errors
      return {
        'success': false,
        'message': 'An unexpected error occurred while adding contribution',
        'error': e.toString(),
      };
    }
  }

  /// Get a specific contribution by its ID
  /// Returns success response with contribution data if found
  Future<Map<String, dynamic>> getContributionById({
    required String contributionId,
  }) async {
    try {
      final apiResponse = await _contributionApiProvider.getContributionById(
        contributionId: contributionId,
      );

      if (apiResponse['createdAt'] != null) {
        return {
          'success': true,
          'data': apiResponse,
          'message': 'Contribution retrieved successfully',
        };
      } else {
        // Handle API errors
        return {
          'success': false,
          'message':
              apiResponse['message'] ?? 'Failed to retrieve contribution',
          'error': apiResponse['error'],
          'statusCode': apiResponse['statusCode'],
        };
      }
    } catch (e) {
      // Handle unexpected errors
      return {
        'success': false,
        'message': 'An unexpected error occurred while retrieving contribution',
        'error': e.toString(),
      };
    }
  }
}
