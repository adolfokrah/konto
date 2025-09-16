# API Provider Standardization Migration Guide

## Overview
This guide explains how to migrate your existing API providers to use the new standardized `BaseApiProvider` class.

## What's Standardized
The following methods are now standardized across all API providers:
- `getAuthenticatedHeaders()` - Get Bearer token headers
- `getUnauthenticatedError()` - Standard auth error response
- `handleApiError()` - Consistent error handling with Sentry logging
- `logDataStructureToSentry()` - Utility for debugging data structures

## Migration Steps

### 1. Update Imports
Add the base class import:
```dart
import 'package:Hoga/core/services/base_api_provider.dart';
```

### 2. Extend BaseApiProvider
Change your class declaration:
```dart
// Before
class YourApiProvider {
  final Dio _dio;
  final UserStorageService _userStorageService;

  YourApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : _dio = dio, _userStorageService = userStorageService;

// After
class YourApiProvider extends BaseApiProvider {
  YourApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);
```

### 3. Remove Duplicate Methods
Delete these methods from your API provider:
- `_getAuthenticatedHeaders()`
- `_getUnauthenticatedError()`
- `_handleApiError()`

### 4. Update Method Calls
Replace private method calls with public ones:
```dart
// Before
final headers = await _getAuthenticatedHeaders();
if (headers == null) return _getUnauthenticatedError();
final response = await _dio.get(url, options: Options(headers: headers));
return _handleApiError(e, 'operation name');

// After
final headers = await getAuthenticatedHeaders();
if (headers == null) return getUnauthenticatedError();
final response = await dio.get(url, options: Options(headers: headers));
return handleApiError(e, 'operation name');
```

### 5. Update Field References
Change private field references to public ones:
```dart
// Before
_dio.get()
_userStorageService.getAuthToken()

// After  
dio.get()
userStorageService.getAuthToken()
```

## Benefits

### Enhanced Error Handling
- Comprehensive DioException type handling
- Automatic Sentry logging with rich context
- Consistent error response format
- Better timeout and connection error handling

### Standardized Logging
- Use `logDataStructureToSentry()` for debugging data structures
- Rich context including operation, platform, and custom data
- Consistent breadcrumb format across all providers

### Reduced Code Duplication
- ~50 lines removed per API provider
- Single source of truth for common functionality
- Easier maintenance and updates

## Example: Complete Migration

### Before (ContributionApiProvider)
```dart
class ContributionApiProvider {
  final Dio _dio;
  final UserStorageService _userStorageService;

  // Constructor...
  
  Map<String, dynamic> _handleApiError(dynamic error, String operation) {
    // ~40 lines of error handling
  }
  
  Future<Map<String, String>?> _getAuthenticatedHeaders() async {
    // ~10 lines of auth logic
  }
  
  Map<String, dynamic> _getUnauthenticatedError() {
    // ~5 lines of error response
  }
}
```

### After (ContributionApiProvider)
```dart
class ContributionApiProvider extends BaseApiProvider {
  ContributionApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);
  
  // All standardized methods inherited from BaseApiProvider
  // Just implement your specific API methods
}
```

## Files to Migrate
Based on the file search, update these API providers:
- `/features/media/data/api_provider/media_api_provider.dart`
- `/features/authentication/data/api_providers/auth_api_provider.dart`
- `/features/contribution/data/api_reproviders/contribution_api_provider.dart`
- `/features/contribution/data/api_reproviders/momo_api_provider.dart`
- `/features/verification/data/api_providers/sms_api_provider.dart`
- `/features/user_account/data/api_providers/user_account_api_provider.dart`

## Testing
After migration:
1. Ensure all API calls still work
2. Verify error handling maintains same behavior
3. Check Sentry logs for enhanced error reporting
4. Test authentication flows
