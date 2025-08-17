import 'package:konto/features/jars/data/api_providers/jar_api_provider.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';

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
          final jarData = apiResponse['data'];
          final jarSummary = JarSummaryModel.fromJson(jarData);

          return {
            'success': true,
            'data': jarSummary,
            'message': 'Jar summary retrieved successfully',
          };
        } catch (modelError) {
          // Handle JSON parsing errors
          return {
            'success': false,
            'message': 'Failed to parse jar data',
            'error': 'Model parsing error: ${modelError.toString()}',
          };
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
}
