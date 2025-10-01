import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/collaborators/data/api_providers/collaborators_providers.dart';

/// Repository for collaborator search and management operations
/// Orchestrates business logic between UI and API calls
class CollaboratorsRepository {
  final CollaboratorsProvider _collaboratorsProvider;

  CollaboratorsRepository({
    required CollaboratorsProvider collaboratorsProvider,
  }) : _collaboratorsProvider = collaboratorsProvider;

  /// Search users by email, phone number, or full name
  /// Returns a Map with success status and user data
  Future<Map<String, dynamic>> searchUsers(String query) async {
    try {
      if (query.trim().isEmpty) {
        return {
          'success': true,
          'data': <User>[],
          'message': 'Empty query provided',
        };
      }

      final apiResponse = await _collaboratorsProvider.searchUsers(query);

      // Convert API response to User models
      final users =
          apiResponse.map((userData) => User.fromJson(userData)).toList();

      return {
        'success': true,
        'data': users,
        'message': 'Users found successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to search users: ${e.toString()}',
        'error': e.toString(),
      };
    }
  }

  /// Send reminder to a collector for a jar
  /// Returns a Map with success status and response message
  Future<Map<String, dynamic>> sendReminderToCollector({
    required String jarId,
    required String collectorId,
  }) async {
    try {
      final apiResponse = await _collaboratorsProvider.sendReminderToCollector(
        jarId: jarId,
        collectorId: collectorId,
      );

      return apiResponse;
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to send reminder: ${e.toString()}',
        'error': e.toString(),
      };
    }
  }
}
