import 'package:dio/dio.dart';

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
}
