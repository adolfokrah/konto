import 'package:dio/dio.dart';
import 'package:konto/core/config/sms_config.dart';

/// HTTP client service using Dio for better error handling and interceptors
class HttpClientService {
  late final Dio _dio;

  HttpClientService() {
    _dio = Dio(
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

    // Add interceptors for logging and error handling
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
        logPrint: (object) {
          print('🌐 HTTP: $object');
        },
      ),
    );

    // Add error handling interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) {
          print('❌ HTTP Error: ${error.message}');
          if (error.response != null) {
            print('❌ Response: ${error.response?.data}');
          }
          handler.next(error);
        },
      ),
    );
  }

  /// Get Dio instance
  Dio get dio => _dio;

  /// Send SMS via Mnotify API using Dio
  Future<Map<String, dynamic>> sendSmsViaMnotify({
    required String phoneNumber,
    required String message,
  }) async {
    try {
      // Prepare request body
      final requestData = {
        'recipient[]': [phoneNumber],
        'sender': SmsConfig.senderId,
        'message': message,
        'is_schedule': 'false',
        'schedule_date': '',
      };

      print('📱 Sending SMS to $phoneNumber via Mnotify...');

      // Make API request to Mnotify
      final response = await _dio.post(
        SmsConfig.apiBaseUrl,
        data: requestData,
        options: Options(
          headers: {'Authorization': 'Bearer ${SmsConfig.mnotifyApiKey}'},
        ),
      );

      print('✅ Mnotify Response: ${response.statusCode} - ${response.data}');

      return {
        'success': true,
        'data': response.data,
        'statusCode': response.statusCode,
      };
    } on DioException catch (e) {
      print('❌ Dio Error: ${e.type} - ${e.message}');

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
}
