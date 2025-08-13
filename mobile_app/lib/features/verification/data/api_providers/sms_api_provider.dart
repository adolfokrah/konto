import 'package:dio/dio.dart';
import 'package:konto/core/config/sms_config.dart';

/// API Provider for SMS operations using Mnotify service with Dio
class SmsApiProvider {
  late final Dio _dio;

  SmsApiProvider({Dio? dio}) {
    _dio =
        dio ??
        Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
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
          print('🌐 Dio SMS: $object');
        },
      ),
    );
  }

  /// Send SMS via Mnotify API using Dio directly
  Future<Map<String, dynamic>> sendSms({
    required String phoneNumber,
    required String message,
  }) async {
    try {
      // Prepare request data
      final requestData = {
        'recipient[]': [phoneNumber],
        'sender': SmsConfig.senderId,
        'message': message,
        'is_schedule': 'false',
        'schedule_date': '',
      };

      print('📱 Sending SMS to $phoneNumber via Mnotify with Dio...');

      // Make Dio POST request to Mnotify
      final response = await _dio.post(
        "${SmsConfig.apiBaseUrl}?key=${SmsConfig.mnotifyApiKey}",
        data: requestData,
      );

      print('✅ Dio Response: ${response.statusCode} - ${response.data}');

      return {
        'success': true,
        'data': response.data,
        'statusCode': response.statusCode,
      };
    } on DioException catch (e) {
      print('❌ Dio SMS Error: ${e.type} - ${e.message}');

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
}
