import 'dart:convert';
import 'package:konto/core/constants/local_storage_tokens.dart';
import 'package:konto/core/services/local_storage_service.dart';
import 'package:konto/features/authentication/data/models/user.dart';

/// Service for handling user data storage and retrieval
class UserStorageService {
  final LocalStorageService _localStorageService;

  UserStorageService({required LocalStorageService localStorageService})
      : _localStorageService = localStorageService;

  /// Save user data and authentication token to local storage
  Future<bool> saveUserData({
    required User user,
    required String token,
    required int tokenExpiry,
  }) async {
    try {
      // Save user data
      final userJson = json.encode(user.toJson());
      await _localStorageService.saveToken(LocalStorageTokens.userData, userJson);
      
      // Save authentication token
      await _localStorageService.saveToken(LocalStorageTokens.authToken, token);
      
      // Save token expiry timestamp
      await _localStorageService.saveToken(LocalStorageTokens.tokenExpiry, tokenExpiry.toString());
      
      print('✅ User data saved to local storage');
      return true;
    } catch (e) {
      print('💥 Error saving user data: $e');
      return false;
    }
  }

  /// Retrieve user data from local storage
  Future<User?> getUserData() async {
    try {
      final userJson = await _localStorageService.getToken(LocalStorageTokens.userData);
      
      if (userJson != null) {
        final userMap = json.decode(userJson) as Map<String, dynamic>;
        return User.fromJson(userMap);
      }
      
      return null;
    } catch (e) {
      print('💥 Error retrieving user data: $e');
      return null;
    }
  }

  /// Get authentication token
  Future<String?> getAuthToken() async {
    try {
      return await _localStorageService.getToken(LocalStorageTokens.authToken);
    } catch (e) {
      print('💥 Error retrieving auth token: $e');
      return null;
    }
  }

  /// Get token expiry timestamp
  Future<int?> getTokenExpiry() async {
    try {
      final expiryString = await _localStorageService.getToken(LocalStorageTokens.tokenExpiry);
      if (expiryString != null) {
        return int.tryParse(expiryString);
      }
      return null;
    } catch (e) {
      print('💥 Error retrieving token expiry: $e');
      return null;
    }
  }

  /// Check if user is logged in and token is valid
  Future<bool> isUserLoggedIn() async {
    try {
      final user = await getUserData();
      final token = await getAuthToken();
      final expiry = await getTokenExpiry();
      
      if (user == null || token == null || expiry == null) {
        return false;
      }
      
      // Check if token is expired
      final currentTimestamp = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      if (currentTimestamp >= expiry) {
        print('🔒 Token expired, user needs to login again');
        await clearUserData();
        return false;
      }
      
      return true;
    } catch (e) {
      print('💥 Error checking login status: $e');
      return false;
    }
  }

  /// Clear all user data from storage (logout)
  Future<bool> clearUserData() async {
    try {
      await _localStorageService.deleteToken(LocalStorageTokens.userData);
      await _localStorageService.deleteToken(LocalStorageTokens.authToken);
      await _localStorageService.deleteToken(LocalStorageTokens.tokenExpiry);
      
      print('🧹 User data cleared from local storage');
      return true;
    } catch (e) {
      print('💥 Error clearing user data: $e');
      return false;
    }
  }

  /// Update user data (for profile updates)
  Future<bool> updateUserData(User updatedUser) async {
    try {
      final userJson = json.encode(updatedUser.toJson());
      await _localStorageService.saveToken(LocalStorageTokens.userData, userJson);
      
      print('🔄 User data updated in local storage');
      return true;
    } catch (e) {
      print('💥 Error updating user data: $e');
      return false;
    }
  }

  /// Get complete authentication data
  Future<Map<String, dynamic>?> getAuthData() async {
    try {
      final user = await getUserData();
      final token = await getAuthToken();
      final expiry = await getTokenExpiry();
      
      if (user == null || token == null || expiry == null) {
        return null;
      }
      
      return {
        'user': user,
        'token': token,
        'expiry': expiry,
        'isValid': await isUserLoggedIn(),
      };
    } catch (e) {
      print('💥 Error retrieving auth data: $e');
      return null;
    }
  }
}
