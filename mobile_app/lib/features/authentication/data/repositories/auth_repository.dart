import 'package:konto/core/services/sms_otp_service.dart';
import 'package:konto/core/services/user_storage_service.dart';
import 'package:konto/features/authentication/data/api_providers/auth_api_provider.dart';
import 'package:konto/features/authentication/data/models/user.dart';

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
  })  : _smsOtpService = smsOtpService,
        _authApiProvider = authApiProvider,
        _userStorageService = userStorageService;

  /// Check if phone number is available (exists in system)
  /// Returns true if phone number exists (user should login)
  /// Returns false if phone number doesn't exist (user should register)
  Future<Map<String, dynamic>> checkPhoneNumberAvailability({
    required String phoneNumber,
    required String countryCode,
  }) async {
    try {
      print('🔍 Checking phone number availability for: $phoneNumber');
      
      final apiResponse = await _authApiProvider.checkPhoneNumberAvailability(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
      );
      
      print('📋 Availability check response: $apiResponse');
      
      if (apiResponse['success'] == true) {
        final exists = apiResponse['exists'] ?? false;
        return {
          'success': true,
          'exists': exists,
          'shouldLogin': exists, // If phone exists, user should login
          'shouldRegister': !exists, // If phone doesn't exist, user should register
          'message': exists 
            ? 'Phone number found. Proceed to login.'
            : 'Phone number not found. Please register first.',
        };
      } else {
        print('💥 API Error: ${apiResponse['message']}');
        return {
          'success': false,
          'message': 'Error checking phone availability: ${apiResponse['message']}',
          'error': apiResponse['error'],
        };
      }
    } catch (e) {
      print('💥 Repository Exception: $e');
      return {
        'success': false,
        'message': 'Error: ${e.toString()}'
      };
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
      String formattedForSms = _smsOtpService.formatPhoneNumber(phoneNumber, countryCode);
      
      // Generate message
      String message = _smsOtpService.generateOtpMessage(otp);
      
      // Send SMS via API provider using the full international number
      print('🚀 Starting phone verification for: $formattedForSms (SMS)');
      print('🎯 Local number for API: $phoneNumber | Country code: $countryCode');
      final apiResponse = await _authApiProvider.sendAuthOtp(
        phoneNumber: formattedForSms,  // Use full international format for SMS
        message: message,
      );
      
      print('📡 API Response received: $apiResponse');
      
      if (apiResponse['success'] == true) {
        // Check Mnotify specific response
        final mnotifyData = apiResponse['data'];
        print('📋 Mnotify Data: $mnotifyData');
        
        final isSuccess = mnotifyData['status'] == 'success' || 
                         mnotifyData['code'] == '2000';
        
        if (isSuccess) {
          print('✅ SMS sent successfully to $formattedForSms');
          return {
            'success': true,
            'message': 'OTP sent successfully',
            'otp': otp,
            'phoneNumber': phoneNumber,  // Return the clean local number for API calls
          };
        } else {
          print('❌ SMS sending failed: ${mnotifyData['message'] ?? 'Unknown error'}');
          return {
            'success': false,
            'message': 'Failed to send OTP: ${mnotifyData['message'] ?? 'Unknown error'}',
          };
        }
      } else {
        print('💥 API Error: ${apiResponse['message']}');
        return {
          'success': false,
          'message': 'Network error: ${apiResponse['error']}',
          'errorType': apiResponse['dioErrorType'] ?? 'unknown',
        };
      }
    } catch (e) {
      print('💥 Repository Exception: $e');
      return {
        'success': false,
        'message': 'Error: ${e.toString()}'
      };
    }
  }

  /// Verify OTP and login user
  Future<Map<String, dynamic>> verifyOTPAndLogin({
    required String enteredOtp,
    required String sentOtp,
    required String phoneNumber,
    required String countryCode,
  }) async {
    try {
      // First verify the OTP
      if (enteredOtp != sentOtp) {
        print('❌ OTP verification failed - codes do not match');
        return {
          'success': false,
          'message': 'Invalid OTP code. Please check and try again.',
        };
      }

      print('✅ OTP verification successful, proceeding to login');

      // If OTP is correct, login the user
      final loginResponse = await _authApiProvider.loginWithPhoneNumber(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
      );

      if (loginResponse['success'] == true) {
        // Parse the login response
        final loginData = LoginResponse.fromJson(loginResponse);
        
        // Save user data and token to local storage
        final saveResult = await _userStorageService.saveUserData(
          user: loginData.user,
          token: loginData.token,
          tokenExpiry: loginData.exp,
        );

        if (saveResult) {
          print('🎉 User logged in and data saved successfully');
          return {
            'success': true,
            'message': 'Login successful',
            'user': loginData.user,
            'token': loginData.token,
            'phoneNumber': phoneNumber,
          };
        } else {
          print('⚠️ Login successful but failed to save data locally');
          return {
            'success': true,
            'message': 'Login successful',
            'user': loginData.user,
            'token': loginData.token,
            'phoneNumber': phoneNumber,
            'warning': 'Failed to save data locally',
          };
        }
      } else {
        print('💥 Login failed: ${loginResponse['message']}');
        return {
          'success': false,
          'message': 'Login failed: ${loginResponse['message']}',
        };
      }
    } catch (e) {
      print('💥 OTP Verification and Login Exception: $e');
      return {
        'success': false,
        'message': 'Error during verification and login: ${e.toString()}'
      };
    }
  }

  /// Check if user is already logged in
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
        'message': 'Error verifying OTP: ${e.toString()}'
      };
    }
  }

  /// Format phone number with country code
  String formatPhoneNumber(String phoneNumber, String countryCode) {
    return _smsOtpService.formatPhoneNumber(phoneNumber, countryCode);
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
