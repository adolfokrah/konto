import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/user_storage_service.dart';

class VerificationProvider {
  final Dio _dio;
  final UserStorageService _userStorageService;

  // Test mode flag - can be set during testing
  static bool isTestMode = false;

  VerificationProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : _dio = dio,
       _userStorageService = userStorageService;

  /// Helper method to detect if we're running in Flutter test environment
  bool _isFlutterTest() {
    return const bool.fromEnvironment('flutter.testing', defaultValue: false);
  }

  /// Send OTP via SMS and WhatsApp using the backend endpoint
  /// [isRegistering] - If true, will also send email OTP
  Future<Map<String, dynamic>> sendOTP({
    required String phoneNumber,
    required String countryCode,
    required String otpCode,
    required String email,
  }) async {
    // Automatically detect test environment or use manual test mode
    final isInTestMode = isTestMode || kDebugMode && _isFlutterTest();

    // Mock OTP sending in test mode
    if (isInTestMode) {
      print(
        '🧪 TEST MODE: Mocking OTP send to $phoneNumber with code: $otpCode',
      );
      await Future.delayed(
        const Duration(milliseconds: 800),
      ); // Simulate network delay
      return {
        'success': true,
        'message': 'OTP sent successfully (mocked)',
        'data': {
          'messageId': 'mock_${DateTime.now().millisecondsSinceEpoch}',
          'phoneNumber': phoneNumber,
          'status': 'sent',
        },
        'messageId': 'mock_${DateTime.now().millisecondsSinceEpoch}',
        'phoneNumber': phoneNumber,
      };
    }

    try {
      // Prepare request data - only include email if user is registering
      final requestData = {
        'phoneNumber': phoneNumber,
        'code': otpCode,
        'countryCode': countryCode,
        'email': email,
      };
      // Make API call to backend endpoint
      final response = await _dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.sendOTP}',
        data: requestData,
        options: Options(headers: {'Content-Type': 'application/json'}),
      );

      print('📱 OTP API Response: ${response.statusCode} - ${response.data}');

      if (response.statusCode == 200 && response.data['success'] == true) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'OTP sent successfully',
          'data': response.data['data'],
          'messageId': response.data['data']?['messageId'],
          'phoneNumber': response.data['data']?['phoneNumber'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['message'] ?? 'Failed to send OTP',
          'statusCode': response.statusCode,
          'details': response.data,
        };
      }
    } on DioException catch (e) {
      print('❌ OTP Dio Error: ${e.type} - ${e.message}');

      String errorMessage = 'Failed to send OTP';
      int statusCode = e.response?.statusCode ?? 0;

      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          errorMessage = 'OTP service timeout. Please try again.';
          break;
        case DioExceptionType.badResponse:
          final responseData = e.response?.data;
          if (responseData is Map && responseData['message'] != null) {
            errorMessage = responseData['message'];
          } else {
            errorMessage = 'OTP service error ($statusCode)';
          }
          break;
        case DioExceptionType.cancel:
          errorMessage = 'OTP request was cancelled';
          break;
        case DioExceptionType.connectionError:
          errorMessage = 'No internet connection. Please check your network.';
          break;
        case DioExceptionType.badCertificate:
          errorMessage = 'Certificate error. Please try again.';
          break;
        case DioExceptionType.unknown:
          errorMessage = 'Network error: ${e.message}';
          break;
      }

      return {
        'success': false,
        'error': errorMessage,
        'statusCode': statusCode,
        'dioErrorType': e.type.toString(),
      };
    } catch (e) {
      print('❌ Unexpected OTP Error: $e');
      return {
        'success': false,
        'error': 'Unexpected error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

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
