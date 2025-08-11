import 'package:konto/core/services/sms_otp_service.dart';
import 'package:konto/core/services/user_storage_service.dart';
import 'package:konto/core/services/service_registry.dart';
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
      
      // Send SMS via SMS API provider using the full international number
      print('🚀 Starting phone verification for: $formattedForSms (SMS)');
      print('🎯 Local number for API: $phoneNumber | Country code: $countryCode');
      
      // Use SMS API provider for SMS sending
      final smsApiProvider = ServiceRegistry().smsApiProvider;
      final smsResponse = await smsApiProvider.sendSms(
        phoneNumber: formattedForSms,  // Use full international format for SMS
        message: message,
      );
      
      print('📡 SMS Response received: $smsResponse');
      
      if (smsResponse['success'] == true) {
        // Check Mnotify specific response
        final mnotifyData = smsResponse['data'];
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
        print('💥 SMS API Error: ${smsResponse['message']}');
        return {
          'success': false,
          'message': 'Network error: ${smsResponse['error']}',
          'errorType': smsResponse['dioErrorType'] ?? 'unknown',
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

  /// Register new user
  Future<Map<String, dynamic>> registerUser({
    required String phoneNumber,
    required String countryCode,
    required String country,
    required String fullName,
    required String email,
  }) async {
    try {
      print('📝 Registering new user: $fullName');
      
      final apiResponse = await _authApiProvider.registerUser(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        country: country,
        fullName: fullName,
        email: email,
      );
      
      print('📋 Registration response: $apiResponse');
      
      if (apiResponse['success'] == true || apiResponse['doc'] != null) {
        // Payload CMS returns the created user in 'doc' field
        final userData = apiResponse['doc'] ?? apiResponse['user'];
        final token = apiResponse['token'];
        
        if (userData != null) {
          // Create User model from response
          final user = User.fromJson(userData);
          
          // Save user data and token to local storage
          if (token != null) {
            // Calculate token expiry (24 hours from now)
            final tokenExpiry = DateTime.now().add(const Duration(hours: 24)).millisecondsSinceEpoch;
            
            await _userStorageService.saveUserData(
              user: user, 
              token: token,
              tokenExpiry: tokenExpiry,
            );
            print('✅ User registered and logged in successfully');
            
            return {
              'success': true,
              'message': 'Registration successful',
              'user': user,
              'token': token,
            };
          } else {
            print('⚠️ Registration successful but no token received');
            return {
              'success': true,
              'message': 'Registration successful',
              'user': user,
              'requiresLogin': true,
            };
          }
        } else {
          print('❌ Registration response missing user data');
          return {
            'success': false,
            'message': 'Registration failed: Invalid response format',
          };
        }
      } else {
        print('💥 Registration API Error: ${apiResponse['message']}');
        return {
          'success': false,
          'message': apiResponse['message'] ?? 'Registration failed',
          'errors': apiResponse['errors'],
        };
      }
    } catch (e) {
      print('💥 Registration Repository Exception: $e');
      return {
        'success': false,
        'message': 'Error during registration: ${e.toString()}'
      };
    }
  }

  /// Register user after OTP verification
  Future<Map<String, dynamic>> registerUserAfterOtpVerification({
    required String enteredOtp,
    required String sentOtp,
    required String phoneNumber,
    required String countryCode,
    required String country,
    required String fullName,
    required String email,
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

      print('✅ OTP verification successful, proceeding to registration');

      // If OTP is correct, register the user
      return await registerUser(
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        country: country,
        fullName: fullName,
        email: email,
      );
    } catch (e) {
      print('💥 Registration with OTP Exception: $e');
      return {
        'success': false,
        'message': 'Error during registration: ${e.toString()}'
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
