import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';

class ReferralApiProvider extends BaseApiProvider {
  ReferralApiProvider({required super.dio, required super.userStorageService});

  Future<Map<String, dynamic>> fetchMyBonuses() async {
    final headers = await getAuthenticatedHeaders();
    if (headers == null) return getUnauthenticatedError();

    try {
      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}${BackendConfig.referralBonusesMyBonuses}',
        options: Options(headers: headers),
      );
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      return handleApiError(e, 'fetching referral bonuses');
    }
  }

  Future<Map<String, dynamic>> requestWithdrawal() async {
    final headers = await getAuthenticatedHeaders();
    if (headers == null) return getUnauthenticatedError();

    try {
      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}${BackendConfig.referralBonusesRequestWithdrawal}',
        options: Options(headers: headers),
      );
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      return handleApiError(e, 'requesting referral bonus withdrawal');
    }
  }
}
