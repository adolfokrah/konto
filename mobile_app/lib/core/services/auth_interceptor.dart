import 'package:dio/dio.dart';
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/features/authentication/data/api_providers/auth_api_provider.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';

/// Dio interceptor that handles 401 responses by attempting token refresh.
/// If refresh succeeds, the original request is retried with the new token.
/// If refresh fails, the 401 propagates normally.
class AuthInterceptor extends Interceptor {
  final UserStorageService _userStorageService;
  final AuthApiProvider _authApiProvider;
  final Dio _dio;

  bool _isRefreshing = false;

  AuthInterceptor({
    required UserStorageService userStorageService,
    required AuthApiProvider authApiProvider,
    required Dio dio,
  })  : _userStorageService = userStorageService,
        _authApiProvider = authApiProvider,
        _dio = dio;

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Only handle 401 Unauthorized
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    // Skip if this request was marked to skip auth retry (e.g. refresh-token call itself)
    if (err.requestOptions.extra['skipAuthRetry'] == true) {
      return handler.next(err);
    }

    // Skip if this request was already retried after a refresh
    if (err.requestOptions.extra['authRetried'] == true) {
      return handler.next(err);
    }

    // Skip if already refreshing to avoid concurrent refresh calls
    if (_isRefreshing) {
      return handler.next(err);
    }

    _isRefreshing = true;

    try {
      final currentToken = await _userStorageService.getAuthToken();
      if (currentToken == null) {
        _isRefreshing = false;
        return handler.next(err);
      }

      final refreshResult = await _authApiProvider.refreshToken(
        currentToken: currentToken,
      );

      // Payload CMS returns refreshedToken, exp, and user
      final newToken = refreshResult['refreshedToken'] as String?;
      final exp = refreshResult['exp'];
      final userData = refreshResult['user'];

      if (newToken == null || userData == null) {
        _isRefreshing = false;
        return handler.next(err);
      }

      // Save new token and user data
      final user = User.fromJson(userData as Map<String, dynamic>);
      await _userStorageService.saveUserData(
        user: user,
        token: newToken,
        tokenExpiry: exp ?? 0,
      );

      _isRefreshing = false;

      // Retry the original request with the new token
      final opts = err.requestOptions;
      opts.headers['Authorization'] = 'Bearer $newToken';
      opts.extra['authRetried'] = true;

      final response = await _dio.fetch(opts);
      return handler.resolve(response);
    } catch (e) {
      _isRefreshing = false;
      return handler.next(err);
    }
  }
}
