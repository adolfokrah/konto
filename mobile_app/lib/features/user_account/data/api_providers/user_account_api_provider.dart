import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/enums/app_theme.dart';
import 'package:Hoga/core/enums/app_language.dart';

import 'package:Hoga/core/services/base_api_provider.dart';

/// API Provider for updating user details
class UserAccountApiProvider extends BaseApiProvider {
  UserAccountApiProvider({
    required super.dio,
    required super.userStorageService,
  });

  /// Update user details (personal information)
  Future<Map<String, dynamic>> updateUserDetails({
    String? fullName,
    String? username,
    String? phoneNumber,
    String? countryCode,
    String? country,
    String? email,
    String? accountNumber,
    String? bank,
    String? accountHolder,
    AppTheme? appTheme,
    AppLanguage? appLanguage,
    String? photoId,
    String? fcmToken,
  }) async {
    try {
      final user = await userStorageService.getUserData();
      if (user == null) {
        return {'success': false, 'message': 'User not authenticated'};
      }

      final headers = await getAuthenticatedHeaders();
      if (headers == null) {
        return getUnauthenticatedError();
      }

      final updateData = <String, dynamic>{};
      if (fullName != null) updateData['fullName'] = fullName;
      if (username != null) updateData['username'] = username;
      if (phoneNumber != null) updateData['phoneNumber'] = phoneNumber;
      if (countryCode != null) updateData['countryCode'] = countryCode;
      if (country != null) updateData['country'] = country;
      if (email != null) updateData['email'] = email;
      if (accountNumber != null) updateData['accountNumber'] = accountNumber;
      if (bank != null) updateData['bank'] = bank;
      if (accountHolder != null) updateData['accountHolder'] = accountHolder;
      if (photoId != null)
        updateData['photo'] = photoId; // attach media document id
      if (appTheme != null || appLanguage != null) {
        final settings = <String, dynamic>{};
        if (appTheme != null) settings['theme'] = appTheme.name;
        if (appLanguage != null) settings['language'] = appLanguage.value;
        updateData['appSettings'] = settings;
      }
      if (fcmToken != null) {
        updateData['fcmToken'] = fcmToken;
      }

      if (updateData.isEmpty) {
        return {'success': false, 'message': 'No data provided for update'};
      }

      final response = await dio.patch(
        '${BackendConfig.apiBaseUrl}${BackendConfig.usersEndpoint}/${user.id}',
        data: updateData,
        options: Options(headers: headers),
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
        final responseData = e.response?.data;
        final statusCode = e.response?.statusCode;

        // Handle validation errors (400, 409, 422) and server errors (500) with validation info
        if (statusCode == 400 ||
            statusCode == 409 ||
            statusCode == 422 ||
            statusCode == 500) {
          if (responseData is Map<String, dynamic>) {
            // Check for Payload validation error format
            if (responseData.containsKey('errors') &&
                responseData['errors'] is List) {
              final errors = responseData['errors'] as List;
              if (errors.isNotEmpty && errors.first is Map) {
                final firstError = errors.first as Map<String, dynamic>;
                final errorMessage =
                    firstError['message'] ?? 'Validation error occurred';

                print('🔍 Error Debug - Full Response Data: $responseData');
                print('🔍 Error Debug - Error Message: $errorMessage');
                print('🔍 Error Debug - Status Code: $statusCode');

                // Check if it's the generic error and look for more specific info
                if (errorMessage == 'Something went wrong.' &&
                    errors.length > 1) {
                  // Try to find a more specific error message
                  for (final error in errors) {
                    if (error is Map<String, dynamic> &&
                        error['message'] != null &&
                        error['message'] != 'Something went wrong.') {
                      return {
                        'success': false,
                        'message': error['message'],
                        'statusCode': statusCode,
                      };
                    }
                  }
                }

                return {
                  'success': false,
                  'message': errorMessage,
                  'statusCode': statusCode,
                };
              }
            }

            // Check for custom validation format
            if (responseData.containsKey('status') ||
                responseData.containsKey('message')) {
              return {
                'success': false,
                'status': responseData['status'] ?? false,
                'message':
                    responseData['message'] ?? 'Validation error occurred',
                'exists': responseData['exists'] ?? false,
                'statusCode': statusCode,
              };
            }
          }
        }
      }

      // Use the base provider's error handling for all other cases
      return handleApiError(e, 'updating user details');
    }
  }

  /// Verify account details using Paystack
  Future<Map<String, dynamic>> verifyAccountDetails({
    required String phoneNumber,
    required String bank,
  }) async {
    try {
      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/users/verify-account-details',
        data: {'phoneNumber': phoneNumber, 'bank': bank},
        options: Options(headers: BackendConfig.defaultHeaders),
      );

      if (response.data['success'] == true) {
        return {
          'success': true,
          'message': response.data['message'],
          'data': response.data['data'],
        };
      } else {
        return {
          'success': false,
          'message':
              response.data['message'] ?? 'Account details verification failed',
          'data': null,
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      if (e is DioException) {
        return {
          'success': false,
          'message':
              e.response?.data?['message'] ??
              'Network error during account verification',
          'valid': false,
          'error': e.toString(),
          'statusCode': e.response?.statusCode,
        };
      }
      return {
        'success': false,
        'message': 'Error verifying account details: ${e.toString()}',
        'valid': false,
        'error': e.toString(),
      };
    }
  }

  /// Delete user account
  Future<Map<String, dynamic>> deleteUserAccount({
    required String reason,
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) {
        return getUnauthenticatedError();
      }

      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/users/delete-account',
        data: {'reason': reason},
        options: Options(headers: headers),
      );

      if (response.data['success'] == true) {
        return {
          'success': true,
          'message': response.data['message'],
          'data': response.data['data'],
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'User account deletion failed',
          'data': null,
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      if (e is DioException) {
        return {
          'success': false,
          'message':
              e.response?.data?['message'] ??
              'Network error during user account deletion',
          'valid': false,
          'error': e.toString(),
          'statusCode': e.response?.statusCode,
        };
      }
      return {
        'success': false,
        'message': 'Error deleting user account: ${e.toString()}',
        'valid': false,
        'error': e.toString(),
      };
    }
  }
}
