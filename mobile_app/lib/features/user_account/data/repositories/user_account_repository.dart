import 'package:Hoga/core/enums/app_theme.dart' show AppTheme;
import 'package:Hoga/core/enums/app_language.dart' show AppLanguage;
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/features/user_account/data/api_providers/user_account_api_provider.dart';

/// Repository for user account operations
/// Implements the repository pattern to abstract API calls
class UserAccountRepository {
  final UserAccountApiProvider _apiProvider;
  final UserStorageService _userStorageService;

  UserAccountRepository({
    required UserAccountApiProvider apiProvider,
    required UserStorageService userStorageService,
  }) : _apiProvider = apiProvider,
       _userStorageService = userStorageService;

  /// Update user personal details
  Future<({bool success, String message, User? user, String? token})>
  updatePersonalDetails({
    String? firstName,
    String? lastName,
    String? username,
    String? phoneNumber,
    String? countryCode,
    String? country,
    String? email,
    String? accountNumber,
    String? bank,
    String? accountHolder,
    AppTheme? appTheme,
    AppLanguage? appLanguage,
    String? photoId,
    String? fcmToken,
  }) async {
    try {
      final result = await _apiProvider.updateUserDetails(
        firstName: firstName,
        lastName: lastName,
        username: username,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        country: country,
        email: email,
        accountNumber: accountNumber,
        bank: bank,
        accountHolder: accountHolder,
        appTheme: appTheme,
        appLanguage: appLanguage,
        photoId: photoId,
        fcmToken: fcmToken,
      );

      if (result['success'] == true) {
        // Parse the updated user data
        final userData = result['data'];
        if (userData != null) {
          final updatedUser = User.fromJson(userData);

          // Update local storage with new user data
          final token = await _userStorageService.getAuthToken();
          final tokenExpiry = await _userStorageService.getTokenExpiry();

          if (token != null && tokenExpiry != null) {
            await _userStorageService.saveUserData(
              user: updatedUser,
              token: token,
              tokenExpiry: tokenExpiry,
            );
          }

          return (
            success: true,
            message:
                (result['message'] as String?) ??
                'Personal details updated successfully',
            user: updatedUser,
            token: token,
          );
        }
      }

      return (
        success: false,
        message:
            (result['message'] as String?) ??
            'Failed to update personal details',
        user: null,
        token: null,
      );
    } catch (e) {
      return (
        success: false,
        message: 'Error updating personal details: ${e.toString()}',
        user: null,
        token: null,
      );
    }
  }

  /// Verify account details using Paystack
  /// Returns a record with success status, message, and validity
  Future verifyAccountDetails({
    required String phoneNumber,
    required String bank,
  }) async {
    try {
      final result = await _apiProvider.verifyAccountDetails(
        phoneNumber: phoneNumber,
        bank: bank,
      );
      return (success: true, message: result['message'], data: result['data']);
    } catch (e) {
      return (
        success: false,
        message: 'Error verifying account details: ${e.toString()}',
        data: null,
      );
    }
  }

  /// Delete user account
  Future deleteAccount({required String reason}) async {
    try {
      final result = await _apiProvider.deleteUserAccount(reason: reason);

      return (success: result['success'] == true, message: result['message']);
    } catch (e) {
      return (
        success: false,
        message: 'Error deleting account: ${e.toString()}',
      );
    }
  }
}
