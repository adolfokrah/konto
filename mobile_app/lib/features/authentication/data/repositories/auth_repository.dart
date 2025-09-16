import 'package:Hoga/core/services/sms_otp_service.dart';
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:Hoga/features/authentication/data/api_providers/auth_api_provider.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';

/// Repository for authentication operations
/// Orchestrates business logic between UI and API calls
class AuthRepository {
  final SmsOtpService _smsOtpService;
  final AuthApiProvider _authApiProvider;
  final UserStorageService _userStorageService;

  AuthRepository({
    required SmsOtpService smsOtpService,
    required AuthApiProvider authApiProvider,
    required UserStorageService userStorageService,
  }) : _smsOtpService = smsOtpService,
       _authApiProvider = authApiProvider,
       _userStorageService = userStorageService;

  /// Check if user exists in the system
  /// Returns true if user exists (user should login)
  /// Returns false if user doesn't exist (user should register)
  Future<Map<String, dynamic>> checkUserExistence({
    required String phoneNumber,
    required String countryCode,
    String? email,
  }) async {
    try {
      final apiResponse = await _authApiProvider.checkUserExistence(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        email: email,
      );

      if (apiResponse['success'] == true) {
        final exists = apiResponse['exists'] ?? false;
        return {
          'success': true,
          'exists': exists,
          'message':
              exists
                  ? 'Phone number found. Proceed to login.'
                  : 'Phone number not found. Please register first.',
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

  /// Start phone number verification process
  Future<Map<String, dynamic>> verifyPhoneNumber({
    required String phoneNumber,
    required String countryCode,
  }) async {
    try {
      // Generate OTP
      String otp = _smsOtpService.generateOTP();

      // For SMS sending, we need the full international format
      // But for API calls, we use the clean local number
      String formattedForSms = _smsOtpService.formatPhoneNumber(
        phoneNumber,
        countryCode,
      );

      // Generate message
      String message = _smsOtpService.generateOtpMessage(otp);

      // Send SMS via SMS API provider using the full international number
      print('🚀 Starting phone verification for: $formattedForSms (SMS)');
      print(
        '🎯 Local number for API: $phoneNumber | Country code: $countryCode',
      );

      // Use SMS API provider for SMS sending
      final smsApiProvider = ServiceRegistry().smsApiProvider;
      final smsResponse = await smsApiProvider.sendSms(
        phoneNumber: formattedForSms, // Use full international format for SMS
        message: message,
      );

      print('📡 SMS Response received: $smsResponse');

      if (smsResponse['success'] == true) {
        // Check Mnotify specific response
        final mnotifyData = smsResponse['data'];
        print('📋 Mnotify Data: $mnotifyData');

        final isSuccess =
            mnotifyData['status'] == 'success' || mnotifyData['code'] == '2000';

        if (isSuccess) {
          print('✅ SMS sent successfully to $formattedForSms');
          return {
            'success': true,
            'message': 'OTP sent successfully',
            'otp': otp,
            'phoneNumber':
                phoneNumber, // Return the clean local number for API calls
          };
        } else {
          print(
            '❌ SMS sending failed: ${mnotifyData['message'] ?? 'Unknown error'}',
          );
          return {
            'success': false,
            'message':
                'Failed to send OTP: ${mnotifyData['message'] ?? 'Unknown error'}',
          };
        }
      } else {
        print('💥 SMS API Error: ${smsResponse['message']}');
        return {
          'success': false,
          'message': 'Network error: ${smsResponse['error']}',
          'errorType': smsResponse['dioErrorType'] ?? 'unknown',
        };
      }
    } catch (e) {
      print('💥 Repository Exception: $e');
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
        // Parse the login response
        final loginData = LoginResponse.fromJson(loginResponse);

        // Save user data and token to local storage
        await _userStorageService.saveUserData(
          user: loginData.user,
          token: loginData.token,
          tokenExpiry: loginData.exp,
        );

        return {
          'success': true,
          'message': 'Login successful',
          'user': loginData.user,
          'token': loginData.token,
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
    required String email,
  }) async {
    try {
      final apiResponse = await _authApiProvider.registerUser(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        country: country,
        fullName: fullName,
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
      // Clear user data from local storage
      await _userStorageService.clearUserData();
      print('🚪 User signed out and data cleared');
    } catch (e) {
      print('� Error during sign out: $e');
    }
  }
}
