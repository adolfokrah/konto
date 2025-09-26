import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/user_storage_service.dart';

class VerificationProvider {
  final Dio _dio;
  final UserStorageService _userStorageService;

  VerificationProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : _dio = dio,
       _userStorageService = userStorageService;

  /// Request KYC verification session for the authenticated user
  ///
  /// This function calls the backend endpoint to create a Didit KYC session
  /// and returns the session details including the verification URL
  ///
  /// Returns a Map containing:
  /// - sessionId: The KYC session ID
  /// - sessionUrl: URL to redirect user for verification
  /// - status: Current session status
  Future<Map<String, dynamic>> requestKyc() async {
    try {
      final user = await _userStorageService.getUserData();
      if (user == null) {
        return {'success': false, 'message': 'User not authenticated'};
      }

      final token = await _userStorageService.getAuthToken();
      if (token == null) {
        return {'success': false, 'message': 'Authentication token not found'};
      }

      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}/users/request-kyc',
        options: Options(
          headers: {
            ...BackendConfig.defaultHeaders,
            'Authorization': 'Bearer $token',
          },
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;

        if (data['success'] == true) {
          return {
            'success': true,
            'sessionId': data['data']['sessionId'],
            'sessionUrl': data['data']['sessionUrl'],
            'status': data['data']['status'],
            'message': data['message'],
          };
        } else {
          throw Exception(data['message'] ?? 'Failed to create KYC session');
        }
      } else {
        throw Exception('Failed to request KYC verification');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Authentication required');
      } else if (e.response?.statusCode == 500) {
        final errorData = e.response?.data;
        throw Exception(
          errorData?['message'] ??
              'Server error occurred while creating KYC session',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      throw Exception('Unexpected error: ${e.toString()}');
    }
  }

  /// Update user KYC status (usually called from webhook or admin)
  ///
  /// [status] - The new KYC status ('pending', 'verified', 'failed')
  /// [sessionId] - Optional session ID to associate with the status update
  Future<Map<String, dynamic>> updateKycStatus({
    required String status,
    String? sessionId,
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

      final requestData = {
        'status': status,
        if (sessionId != null) 'sessionId': sessionId,
      };

      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}/users/update-kyc',
        data: requestData,
        options: Options(
          headers: {
            ...BackendConfig.defaultHeaders,
            'Authorization': 'Bearer $token',
          },
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;

        if (data['success'] == true) {
          return {
            'success': true,
            'message': data['message'],
            'kycStatus': data['data']?['kycStatus'],
            'isKycVerified': data['data']?['isKycVerified'],
          };
        } else {
          throw Exception(data['message'] ?? 'Failed to update KYC status');
        }
      } else {
        throw Exception('Failed to update KYC status');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Authentication required');
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      throw Exception('Unexpected error: ${e.toString()}');
    }
  }
}
