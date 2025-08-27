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
  }) async {
    try {
      final result = await _apiProvider.updateUserDetails(
        fullName: fullName,
        phoneNumber: phoneNumber,
        countryCode: countryCode,
        country: country,
        email: email,
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

  /// Update user app settings
  // Future<({bool success, String message, User? user})> updateAppSettings({
  //   String? language,
  //   bool? darkMode,
  //   bool? biometricAuthEnabled,
  //   bool? pushNotificationsEnabled,
  //   bool? emailNotificationsEnabled,
  //   bool? smsNotificationsEnabled,
  // }) async {
  //   try {
  //     final result = await _apiProvider.updateAppSettings(
  //       language: language,
  //       darkMode: darkMode,
  //       biometricAuthEnabled: biometricAuthEnabled,
  //       pushNotificationsEnabled: pushNotificationsEnabled,
  //       emailNotificationsEnabled: emailNotificationsEnabled,
  //       smsNotificationsEnabled: smsNotificationsEnabled,
  //     );

  //     if (result['success'] == true) {
  //       // Parse the updated user data
  //       final userData = result['data'];
  //       if (userData != null) {
  //         final updatedUser = User.fromJson(userData);

  //         // Update local storage with new user data
  //         final token = await _userStorageService.getAuthToken();
  //         final tokenExpiry = await _userStorageService.getTokenExpiry();

  //         if (token != null && tokenExpiry != null) {
  //           await _userStorageService.saveUserData(
  //             user: updatedUser,
  //             token: token,
  //             tokenExpiry: tokenExpiry,
  //           );
  //         }

  //         return (
  //           success: true,
  //           message:
  //               (result['message'] as String?) ??
  //               'App settings updated successfully',
  //           user: updatedUser,
  //         );
  //       }
  //     }

  //     return (
  //       success: false,
  //       message:
  //           (result['message'] as String?) ?? 'Failed to update app settings',
  //       user: null,
  //     );
  //   } catch (e) {
  //     return (
  //       success: false,
  //       message: 'Error updating app settings: ${e.toString()}',
  //       user: null,
  //     );
  //   }
  // }

  // /// Update user phone number
  // Future<({bool success, String message, User? user})> updatePhoneNumber({
  //   required String newPhoneNumber,
  //   required String countryCode,
  // }) async {
  //   try {
  //     final result = await _apiProvider.updatePhoneNumber(
  //       newPhoneNumber: newPhoneNumber,
  //       countryCode: countryCode,
  //     );

  //     if (result['success'] == true) {
  //       // Parse the updated user data
  //       final userData = result['data'];
  //       if (userData != null) {
  //         final updatedUser = User.fromJson(userData);

  //         // Update local storage with new user data
  //         final token = await _userStorageService.getAuthToken();
  //         final tokenExpiry = await _userStorageService.getTokenExpiry();

  //         if (token != null && tokenExpiry != null) {
  //           await _userStorageService.saveUserData(
  //             user: updatedUser,
  //             token: token,
  //             tokenExpiry: tokenExpiry,
  //           );
  //         }

  //         return (
  //           success: true,
  //           message:
  //               (result['message'] as String?) ??
  //               'Phone number updated successfully',
  //           user: updatedUser,
  //         );
  //       }
  //     }

  //     return (
  //       success: false,
  //       message:
  //           (result['message'] as String?) ?? 'Failed to update phone number',
  //       user: null,
  //     );
  //   } catch (e) {
  //     return (
  //       success: false,
  //       message: 'Error updating phone number: ${e.toString()}',
  //       user: null,
  //     );
  //   }
  // }

  // /// Get fresh user profile data from server
  // Future<({bool success, String message, User? user})>
  // refreshUserProfile() async {
  //   try {
  //     final result = await _apiProvider.getCurrentUserProfile();

  //     if (result['success'] == true) {
  //       // Parse the updated user data
  //       final userData = result['data'];
  //       if (userData != null) {
  //         final updatedUser = User.fromJson(userData);

  //         // Update local storage with fresh user data
  //         final token = await _userStorageService.getAuthToken();
  //         final tokenExpiry = await _userStorageService.getTokenExpiry();

  //         if (token != null && tokenExpiry != null) {
  //           await _userStorageService.saveUserData(
  //             user: updatedUser,
  //             token: token,
  //             tokenExpiry: tokenExpiry,
  //           );
  //         }

  //         return (
  //           success: true,
  //           message:
  //               (result['message'] as String?) ??
  //               'Profile refreshed successfully',
  //           user: updatedUser,
  //         );
  //       }
  //     }

  //     return (
  //       success: false,
  //       message:
  //           (result['message'] as String?) ?? 'Failed to refresh user profile',
  //       user: null,
  //     );
  //   } catch (e) {
  //     return (
  //       success: false,
  //       message: 'Error refreshing user profile: ${e.toString()}',
  //       user: null,
  //     );
  //   }
  // }

  // /// Delete user account
  // Future<({bool success, String message})> deleteAccount() async {
  //   try {
  //     final result = await _apiProvider.deleteUserAccount();

  //     if (result['success'] == true) {
  //       // Clear local storage
  //       await _userStorageService.clearUserData();

  //       return (
  //         success: true,
  //         message:
  //             (result['message'] as String?) ?? 'Account deleted successfully',
  //       );
  //     }

  //     return (
  //       success: false,
  //       message: (result['message'] as String?) ?? 'Failed to delete account',
  //     );
  //   } catch (e) {
  //     return (
  //       success: false,
  //       message: 'Error deleting account: ${e.toString()}',
  //     );
  //   }
  // }
}
