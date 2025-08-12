// integration_test/login_flow_test.dart
import 'package:dio/dio.dart';
import 'package:konto/core/config/backend_config.dart';

typedef MockResponseBuilder = Response Function(RequestOptions options);

class MockInterceptor extends Interceptor {
  // Map to store endpoint overrides
  static final Map<String, MockResponseBuilder> _endpointOverrides = {};
  
  /// Override a specific endpoint with custom response
  static void overrideEndpoint(String endpoint, MockResponseBuilder responseBuilder) {
    _endpointOverrides[endpoint] = responseBuilder;
    print('🔧 MockInterceptor: Override set for endpoint: $endpoint');
  }
  
  /// Clear all endpoint overrides
  static void clearOverrides() {
    _endpointOverrides.clear();
    print('🧹 MockInterceptor: All overrides cleared');
  }
  
  /// Clear specific endpoint override
  static void clearEndpointOverride(String endpoint) {
    _endpointOverrides.remove(endpoint);
    print('🧹 MockInterceptor: Override cleared for endpoint: $endpoint');
  }

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('MockInterceptor: Intercepting ${options.method} ${options.uri}');
    print('MockInterceptor: Path = ${options.path}');
    print('MockInterceptor: Data = ${options.data}');
    
    // Check for endpoint overrides first
    final matchingEndpoint = _endpointOverrides.keys.firstWhere(
      (endpoint) => options.path.contains(endpoint) || options.uri.toString().contains(endpoint),
      orElse: () => '',
    );
    
    if (matchingEndpoint.isNotEmpty) {
      print('🎯 MockInterceptor: Using override for endpoint: $matchingEndpoint');
      final response = _endpointOverrides[matchingEndpoint]!(options);
      handler.resolve(response);
      return;
    }
    
    // Default mock responses (fallback)
    
    // Mock the checkPhoneNumberAvailability endpoint
    if (options.path.contains(BackendConfig.checkPhoneExistenceEndpoint) && 
        options.method == 'POST') {
      
      final response = Response(
        requestOptions: options,
        data: {
          'success': true,
          'exists': true,
          'shouldLogin': true,
          'shouldRegister': false,
          'message': 'Phone number exists',
        },
        statusCode: 200,
      );
      
      handler.resolve(response);
      return;
    }
    
    // Mock the Mnotify SMS API endpoint
    if (options.uri.toString().contains('api.mnotify.com') && 
        options.method == 'POST') {
      
      print('MockInterceptor: ✅ Mocking SMS API response');
      final response = Response(
        requestOptions: options,
        data: {
          'status': 'success',
          'code': '2000',
          'message': 'SMS sent successfully',
          'data': {
            'status': 'success',
            'code': '2000',
            'message': 'Message sent successfully',
          }
        },
        statusCode: 200,
      );
      
      handler.resolve(response);
      return;
    }
    
    // Mock the loginWithPhoneEndpoint
    if (options.path.contains(BackendConfig.loginWithPhoneEndpoint) && 
        options.method == 'POST') {
      
      print('MockInterceptor: ✅ Mocking Login API response');
      final now = DateTime.now();
      final response = Response(
        requestOptions: options,
        data: {
          'success': true,
          'message': 'Login successful',
          'user': {
            'id': 'test-user-id',
            'email': 'test@example.com',
            'fullName': 'Test User',
            'phoneNumber': '+1234567890',
            'countryCode': '+1',
            'country': 'US',
            'isKYCVerified': true,
            'createdAt': now.toIso8601String(),
            'updatedAt': now.toIso8601String(),
            'sessions': [
              {
                'id': 'test-session-id',
                'createdAt': now.toIso8601String(),
                'expiresAt': now.add(Duration(days: 30)).toIso8601String(),
              }
            ],
            'appSettings': {
              'language': 'en',
              'darkMode': false,
              'biometricAuthEnabled': false,
              'notificationsSettings': {
                'pushNotificationsEnabled': true,
                'emailNotificationsEnabled': true,
                'smsNotificationsEnabled': false,
              }
            }
          },
          'token': 'test-jwt-token-123456',
          'exp': now.add(Duration(days: 30)).millisecondsSinceEpoch ~/ 1000,
        },
        statusCode: 200,
      );
      
      handler.resolve(response);
      return;
    }
    
    // For all other requests, continue normally
    handler.next(options);
  }
}
