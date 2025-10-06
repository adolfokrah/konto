import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:Hoga/core/config/sms_config.dart';
import 'package:Hoga/core/config/backend_config.dart';

/// API Provider for SMS operations using Deywuro API service with Dio
class SmsApiProvider {
  late final Dio _dio;

  // Test mode flag - can be set during testing
  static bool isTestMode = false;

  /// Helper method to detect if we're running in Flutter test environment
  bool _isFlutterTest() {
    return const bool.fromEnvironment('flutter.testing', defaultValue: false);
  }

  SmsApiProvider({Dio? dio}) {
    _dio =
        dio ??
        Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        );

    // Add Dio interceptors for better logging
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
        logPrint: (object) {
          print('🌐 Deywuro SMS: $object');
        },
      ),
    );
  }

  /// Send SMS via Deywuro API using Dio directly
  Future<Map<String, dynamic>> sendSms({
    required String phoneNumber,
    required String message,
  }) async {
    // Automatically detect test environment or use manual test mode
    final isInTestMode = isTestMode || kDebugMode && _isFlutterTest();

    // Mock SMS sending in test mode
    if (isInTestMode) {
      print('🧪 TEST MODE: Mocking SMS send to $phoneNumber');
      await Future.delayed(
        const Duration(milliseconds: 500),
      ); // Simulate network delay
      return {
        'success': true,
        'data': {
          'status': 'success',
          'code': '200',
          'message': 'SMS sent successfully (mocked)',
          'messageId': 'mock_message_${DateTime.now().millisecondsSinceEpoch}',
        },
        'statusCode': 200,
      };
    }

    try {
      // Prepare request data for Deywuro API
      final requestData = {
        'username': SmsConfig.username,
        'password': SmsConfig.password,
        'source': SmsConfig.source,
        'destination': phoneNumber,
        'message': message,
      };

      print('📱 Sending SMS to $phoneNumber via Deywuro API...');
      print(
        '🔧 Request data: ${requestData.toString().replaceAll(SmsConfig.password, '***')}',
      );

      // Make Dio POST request to Deywuro
      final response = await _dio.post(SmsConfig.apiBaseUrl, data: requestData);

      print('✅ Deywuro Response: ${response.statusCode} - ${response.data}');

      // Check if the response indicates success
      bool isSuccess = false;
      String? errorMessage;
      final responseData = response.data;

      if (response.statusCode == 200) {
        // Deywuro API response format: {"code":0,"message":"2 sms sent!"}
        if (responseData is Map) {
          // For Deywuro API, code 0 means successful
          final code = responseData['code'];
          isSuccess = code == 0;

          // Log the response for debugging
          print(
            '📊 Deywuro API Response - Code: $code, Message: ${responseData['message']}',
          );

          // Handle Deywuro-specific error codes when not successful
          if (!isSuccess) {
            final message = responseData['message'];

            switch (code) {
              case 401:
                errorMessage = 'Invalid Credentials';
                break;
              case 403:
                errorMessage = 'Insufficient balance';
                break;
              case 404:
                errorMessage = 'Not routable';
                break;
              case 402:
                errorMessage = 'Missing required fields';
                break;
              case 500:
                errorMessage = 'Server error';
                break;
              default:
                errorMessage = message?.toString() ?? 'SMS sending failed';
            }
          }
        } else if (responseData is String) {
          // If response is a string, check for success indicators
          isSuccess =
              responseData.toLowerCase().contains('success') ||
              responseData.toLowerCase().contains('sent');
        } else {
          // Default to success if we got a 200 response
          isSuccess = true;
        }
      }

      return {
        'success': isSuccess,
        'data': response.data,
        'statusCode': response.statusCode,
        'error': errorMessage,
      };
    } on DioException catch (e) {
      print('❌ Deywuro SMS Error: ${e.type} - ${e.message}');

      String errorMessage;
      int statusCode = 0;

      switch (e.type) {
        case DioExceptionType.connectionTimeout:
          errorMessage =
              'Connection timeout. Please check your internet connection.';
          break;
        case DioExceptionType.sendTimeout:
          errorMessage = 'Send timeout. Please try again.';
          break;
        case DioExceptionType.receiveTimeout:
          errorMessage = 'Receive timeout. Please try again.';
          break;
        case DioExceptionType.badResponse:
          statusCode = e.response?.statusCode ?? 0;
          errorMessage =
              'Server error: ${e.response?.statusMessage ?? 'Unknown error'}';
          break;
        case DioExceptionType.cancel:
          errorMessage = 'Request was cancelled.';
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
      print('❌ Unexpected Error: $e');
      return {
        'success': false,
        'error': 'Unexpected error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  /// Check SMS delivery status (if Mnotify supports it)
  Future<Map<String, dynamic>> checkDeliveryStatus(String messageId) async {
    try {
      // TODO: Implement if Mnotify has delivery status endpoint
      return {
        'success': false,
        'error': 'Delivery status check not implemented',
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Failed to check delivery status: ${e.toString()}',
      };
    }
  }

  /// Send OTP via WhatsApp using the backend endpoint
  Future<Map<String, dynamic>> sendWhatsAppOtp({
    required String phoneNumber,
    required String otpCode,
  }) async {
    // Automatically detect test environment or use manual test mode
    final isInTestMode = isTestMode || kDebugMode && _isFlutterTest();

    // Mock WhatsApp OTP sending in test mode
    if (isInTestMode) {
      print(
        '🧪 TEST MODE: Mocking WhatsApp OTP send to $phoneNumber with code: $otpCode',
      );
      await Future.delayed(
        const Duration(milliseconds: 800),
      ); // Simulate network delay
      return {
        'success': true,
        'message': 'WhatsApp OTP sent successfully (mocked)',
        'data': {
          'messageId': 'wamid.mock_${DateTime.now().millisecondsSinceEpoch}',
          'phoneNumber': phoneNumber,
          'status': 'sent',
        },
        'messageId': 'wamid.mock_${DateTime.now().millisecondsSinceEpoch}',
        'phoneNumber': phoneNumber,
      };
    }

    try {
      // Create a new Dio instance with JSON content type for API calls
      final apiDio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 30),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      // Add logging for WhatsApp API calls
      apiDio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          error: true,
          logPrint: (object) {
            print('📱 WhatsApp API: $object');
          },
        ),
      );

      // Prepare request data
      final requestData = {'phoneNumber': phoneNumber, 'code': otpCode};

      print('📱 Sending WhatsApp OTP to: $phoneNumber with code: $otpCode');

      // Make API call to your backend endpoint
      final response = await apiDio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.sendWhatsAppOtpEndpoint}',
        data: requestData,
      );

      print(
        '📱 WhatsApp API Response: ${response.statusCode} - ${response.data}',
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return {
          'success': true,
          'message':
              response.data['message'] ?? 'WhatsApp OTP sent successfully',
          'data': response.data['data'],
          'messageId': response.data['data']?['messageId'],
          'phoneNumber': response.data['data']?['phoneNumber'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['message'] ?? 'Failed to send WhatsApp OTP',
          'statusCode': response.statusCode,
          'details': response.data,
        };
      }
    } on DioException catch (e) {
      print('❌ WhatsApp OTP Dio Error: ${e.type} - ${e.message}');

      String errorMessage = 'Failed to send WhatsApp OTP';
      int statusCode = e.response?.statusCode ?? 0;

      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          errorMessage = 'WhatsApp service timeout. Please try again.';
          break;
        case DioExceptionType.badResponse:
          final responseData = e.response?.data;
          if (responseData is Map && responseData['message'] != null) {
            errorMessage = responseData['message'];
          } else {
            errorMessage = 'WhatsApp service error (${statusCode})';
          }
          break;
        case DioExceptionType.cancel:
          errorMessage = 'WhatsApp request was cancelled';
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
      print('❌ Unexpected WhatsApp Error: $e');
      return {
        'success': false,
        'error': 'Unexpected error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }
}
