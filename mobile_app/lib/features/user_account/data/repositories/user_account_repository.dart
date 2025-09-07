import 'package:konto/core/enums/app_theme.dart' show AppTheme;
import 'package:konto/core/services/user_storage_service.dart';
import 'package:konto/features/authentication/data/models/user.dart';
import 'package:konto/features/user_account/data/api_providers/user_account_api_provider.dart';

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
    String? fullName,
    String? phoneNumber,
    String? countryCode,
    String? country,
    String? email,
    String? accountNumber,
    String? bank,
    String? accountHolder,
    AppTheme? appTheme,
  }) async {
    try {
      final result = await _apiProvider.updateUserDetails(
        fullName: fullName,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        country: country,
        email: email,
        accountNumber: accountNumber,
        bank: bank,
        accountHolder: accountHolder,
        appTheme: appTheme,
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
  Future<({bool success, String message, bool valid})> verifyAccountDetails({
    required String phoneNumber,
    required String bank,
    required String name,
  }) async {
    try {
      final result = await _apiProvider.verifyAccountDetails(
        phoneNumber: phoneNumber,
        bank: bank,
        name: name,
      );
      return (
        success: result['success'] == true,
        message:
            result['success'] == true
                ? 'Account verification completed'
                : 'Account verification failed',
        valid: result['valid'] == true,
      );
    } catch (e) {
      return (
        success: false,
        message: 'Error verifying account details: ${e.toString()}',
        valid: false,
      );
    }
  }
}
