import 'package:dio/dio.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/services/user_storage_service.dart';

/// API Provider for updating user details
class UserAccountApiProvider {
  final Dio _dio;
  final UserStorageService _userStorageService;

  UserAccountApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : _dio = dio,
       _userStorageService = userStorageService;

  /// Update user details (personal information)
  Future<Map<String, dynamic>> updateUserDetails({
    String? fullName,
    String? phoneNumber,
    String? countryCode,
    String? country,
    String? email,
  }) async {
    try {
      final user = await _userStorageService.getUserData();
      if (user == null) {
        return {'success': false, 'message': 'User not authenticated'};
      }

      final token = await _userStorageService.getAuthToken();
      if (token == null) {
        return {'success': false, 'message': 'Authentication token not found'};
      }

      final updateData = <String, dynamic>{};
      if (fullName != null) updateData['fullName'] = fullName;
      if (phoneNumber != null) updateData['phoneNumber'] = phoneNumber;
      if (countryCode != null) updateData['countryCode'] = countryCode;
      if (country != null) updateData['country'] = country;
      if (email != null) updateData['email'] = email;

      if (updateData.isEmpty) {
        return {'success': false, 'message': 'No data provided for update'};
      }

      final response = await _dio.patch(
        '${BackendConfig.apiBaseUrl}${BackendConfig.usersEndpoint}/${user.id}',
        data: updateData,
        options: Options(
          headers: {
            ...BackendConfig.defaultHeaders,
            'Authorization': 'Bearer $token',
          },
        ),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message':
              response.data['message'] ?? 'User details updated successfully',
          'data':
              response
                  .data['doc'], // The actual user data is in the 'doc' field
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to update user details',
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      if (e is DioException) {
        return {
          'success': false,
          'message':
              'Network error: ${e.response?.data?['message'] ?? e.message}',
          'error': e.toString(),
          'statusCode': e.response?.statusCode,
        };
      }
      return {
        'success': false,
        'message': 'Error updating user details: ${e.toString()}',
        'error': e.toString(),
      };
    }
  }
}
