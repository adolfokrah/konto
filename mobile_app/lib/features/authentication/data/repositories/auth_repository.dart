import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/features/authentication/data/api_providers/auth_api_provider.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';

/// Repository for authentication operations
/// Orchestrates business logic between UI and API calls
class AuthRepository {
  final AuthApiProvider _authApiProvider;
  final UserStorageService _userStorageService;

  AuthRepository({
    required AuthApiProvider authApiProvider,
    required UserStorageService userStorageService,
  }) : _authApiProvider = authApiProvider,
       _userStorageService = userStorageService;

  /// Check if user exists in the system
  /// Returns true if user exists (user should login)
  /// Returns false if user doesn't exist (user should register)
  Future<Map<String, dynamic>> checkUserExistence({
    required String phoneNumber,
    required String countryCode,
    String? email,
    String? username,
  }) async {
    try {
      final apiResponse = await _authApiProvider.checkUserExistence(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        email: email,
        username: username,
      );

      if (apiResponse['success'] == true) {
        final exists = apiResponse['exists'] ?? false;
        final userData = apiResponse['data'] ?? {};
        final conflictField = apiResponse['conflictField'];
        return {
          'success': true,
          'exists': exists,
          'conflictField': conflictField,
          'email': userData['email'],
          'message': apiResponse['message'] ?? (exists
                  ? 'User already exists'
                  : 'Available for registration'),
        };
      } else {
        return {
          'success': false,
          'message':
              'Error checking phone availability: ${apiResponse['message']}',
          'error': apiResponse['error'],
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: ${e.toString()}'};
    }
  }

  /// Verify OTP and login user
  Future<Map<String, dynamic>> loginWithPhoneNumber({
    required String phoneNumber,
    required String countryCode,
  }) async {
    try {
      // If OTP is correct, login the user
      final loginResponse = await _authApiProvider.loginWithPhoneNumber(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
      );

      if (loginResponse['success'] == true) {
        // Parse the login response - the response should contain user, token, and exp directly
        final userData = loginResponse['user'];
        final token = loginResponse['token'] ?? '';
        final exp = loginResponse['exp'] ?? 0;

        if (userData == null) {
          return {
            'success': false,
            'message': 'Invalid response format: missing user data',
          };
        }

        // Create User object from response
        final user = User.fromJson(userData);

        // Save user data and token to local storage
        await _userStorageService.saveUserData(
          user: user,
          token: token,
          tokenExpiry: exp,
        );

        return {
          'success': true,
          'message': 'Login successful',
          'user': user,
          'token': token,
          'phoneNumber': phoneNumber,
        };
      } else {
        return {
          'success': false,
          'message': 'Login failed: ${loginResponse['message']}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during verification and login: ${e.toString()}',
      };
    }
  }

  /// Register user after OTP verification
  Future<Map<String, dynamic>> registerUser({
    required String phoneNumber,
    required String countryCode,
    required String country,
    required String fullName,
    required String username,
    required String email,
  }) async {
    try {
      final apiResponse = await _authApiProvider.registerUser(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        country: country,
        fullName: fullName,
        username: username,
        email: email,
      );

      if (apiResponse['success'] == true) {
        print(phoneNumber);
        print(countryCode);
        final loginResponse = await loginWithPhoneNumber(
          phoneNumber: phoneNumber,
          countryCode: countryCode,
        );

        return loginResponse;
      } else {
        return {
          'success': false,
          'message': 'Registration failed: ${apiResponse['message']}',
        };
      }
    } catch (e) {
      print('💥 Registration with OTP Exception: $e');
      return {
        'success': false,
        'message': 'Error during registration: ${e.toString()}',
      };
    }
  }

  /// Auto login using stored user data - simply calls login endpoint
  Future<Map<String, dynamic>> autoLogin() async {
    try {
      // Get stored user data
      final user = await _userStorageService.getUserData();

      if (user == null) {
        return {'success': false, 'message': 'No user data found in storage'};
      }

      // Use the existing login endpoint with stored phone number and country code
      final loginResponse = await loginWithPhoneNumber(
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
      );

      return loginResponse;
    } catch (e) {
      print('💥 Auto-login Exception: $e');
      return {'success': false, 'message': 'Auto-login error: ${e.toString()}'};
    }
  }

  Future<bool> isUserLoggedIn() async {
    return await _userStorageService.isUserLoggedIn();
  }

  /// Get current user data from storage
  Future<User?> getCurrentUser() async {
    return await _userStorageService.getUserData();
  }

  /// Get authentication token
  Future<String?> getAuthToken() async {
    return await _userStorageService.getAuthToken();
  }

  /// Verify OTP
  Future<Map<String, dynamic>> verifyOTP({
    required String enteredOtp,
    required String sentOtp,
    required String phoneNumber,
  }) async {
    try {
      if (enteredOtp == sentOtp) {
        print('✅ OTP verification successful for: $phoneNumber');
        return {
          'success': true,
          'message': 'Phone number verified successfully',
          'phoneNumber': phoneNumber,
        };
      } else {
        print('❌ OTP verification failed - codes do not match');
        return {
          'success': false,
          'message': 'Invalid OTP code. Please check and try again.',
        };
      }
    } catch (e) {
      print('💥 OTP Verification Exception: $e');
      return {
        'success': false,
        'message': 'Error verifying OTP: ${e.toString()}',
      };
    }
  }

  /// Sign out user
  Future<void> signOut() async {
    try {
      // Clear ALL data from local storage (complete clean slate)
      await _userStorageService.clearAllData();
      print('🚪 User signed out and ALL local storage cleared');
    } catch (e) {
      print('💥 Error during sign out: $e');
    }
  }
}
