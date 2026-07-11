import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';

/// API Provider for the `withdrawal-accounts` collection and its helpers
/// (bank list + name verification).
class WithdrawalAccountsApiProvider extends BaseApiProvider {
  WithdrawalAccountsApiProvider({
    required super.dio,
    required super.userStorageService,
  });

  /// List the current user's withdrawal accounts.
  Future<Map<String, dynamic>> listAccounts() async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) return getUnauthenticatedError();

      final user = await userStorageService.getUserData();
      if (user == null) {
        return {'success': false, 'message': 'User not authenticated'};
      }

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/withdrawal-accounts',
        queryParameters: {
          'where[user][equals]': user.id,
          'depth': 0,
          'limit': 100,
        },
        options: Options(headers: headers),
      );

      // Payload list endpoints return { docs: [...] }
      final docs = response.data['docs'] ?? response.data['data'] ?? [];
      return {'success': true, 'data': docs};
    } catch (e) {
      return handleApiError(e, 'fetching withdrawal accounts');
    }
  }

  /// Create a new withdrawal account. `user` is auto-set server-side.
  Future<Map<String, dynamic>> createAccount({
    required String type,
    required String provider,
    required String accountNumber,
    required String accountHolder,
    String? label,
    bool? isDefault,
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) return getUnauthenticatedError();

      final data = <String, dynamic>{
        'type': type,
        'provider': provider,
        'accountNumber': accountNumber,
        'accountHolder': accountHolder,
      };
      if (label != null && label.isNotEmpty) data['label'] = label;
      if (isDefault != null) data['isDefault'] = isDefault;

      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/withdrawal-accounts',
        data: data,
        options: Options(headers: headers),
      );

      final doc = response.data['doc'] ?? response.data;
      return {'success': true, 'data': doc};
    } catch (e) {
      return handleApiError(e, 'creating withdrawal account');
    }
  }

  /// Set an account as default.
  Future<Map<String, dynamic>> setDefault({required String id}) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) return getUnauthenticatedError();

      final response = await dio.patch(
        '${BackendConfig.apiBaseUrl}/withdrawal-accounts/$id',
        data: {'isDefault': true},
        options: Options(headers: headers),
      );

      final doc = response.data['doc'] ?? response.data;
      return {'success': true, 'data': doc};
    } catch (e) {
      return handleApiError(e, 'updating withdrawal account');
    }
  }

  /// Delete an account.
  Future<Map<String, dynamic>> deleteAccount({required String id}) async {
    try {
      final headers = await getAuthenticatedHeaders();
      if (headers == null) return getUnauthenticatedError();

      await dio.delete(
        '${BackendConfig.apiBaseUrl}/withdrawal-accounts/$id',
        options: Options(headers: headers),
      );

      return {'success': true};
    } catch (e) {
      return handleApiError(e, 'deleting withdrawal account');
    }
  }

  /// Fetch the list of supported banks.
  Future<Map<String, dynamic>> fetchBanks() async {
    try {
      final headers = await getAuthenticatedHeaders();
      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/transactions/banks',
        options: Options(headers: headers ?? BackendConfig.defaultHeaders),
      );

      if (response.data['success'] == true) {
        return {'success': true, 'data': response.data['data'] ?? []};
      }
      return {
        'success': false,
        'message': response.data['message'] ?? 'Failed to load banks',
      };
    } catch (e) {
      return handleApiError(e, 'fetching banks');
    }
  }

  /// Verify account holder name.
  ///
  /// For mobile money: pass [type] = 'mobile-money', [bank] = 'mtn'|'telecel',
  /// [accountNumber] = phone number.
  /// For bank: pass [type] = 'bank', [bank] = bank code, [accountNumber].
  Future<Map<String, dynamic>> verifyAccount({
    required String type,
    required String bank,
    required String accountNumber,
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();

      final data = <String, dynamic>{'type': type, 'bank': bank};
      if (type == 'mobile-money') {
        data['phoneNumber'] = accountNumber;
      } else {
        data['accountNumber'] = accountNumber;
      }

      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/users/verify-account-details',
        data: data,
        options: Options(headers: headers ?? BackendConfig.defaultHeaders),
      );

      if (response.data['success'] == true) {
        return {
          'success': true,
          'data': response.data['data'],
        };
      }
      return {
        'success': false,
        'message': response.data['message'] ?? 'Could not verify account',
      };
    } catch (e) {
      if (e is DioException) {
        return {
          'success': false,
          'message':
              e.response?.data?['message'] ?? 'Could not verify account',
        };
      }
      return {'success': false, 'message': 'Could not verify account'};
    }
  }
}
