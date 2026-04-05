import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';

class PayoutMinimumApiProvider extends BaseApiProvider {
  PayoutMinimumApiProvider({
    required super.dio,
    required super.userStorageService,
  });

  Future<double> getMinimumPayoutAmount() async {
    final headers = await getAuthenticatedHeaders();
    final response = await dio.get(
      '${BackendConfig.apiBaseUrl}/transactions/get-payout-minimum',
      options: Options(headers: headers),
    );
    final data = response.data as Map<String, dynamic>;
    return (data['minimumPayoutAmount'] as num?)?.toDouble() ?? 0;
  }
}
