import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';
import 'package:Hoga/features/contribution/data/models/charges_model.dart';

/// Fetches the full charge breakdown (including discount) from the server.
/// Endpoint: GET /api/transactions/get-charges?amount=xxx&jarId=xxx
class ChargesApiProvider extends BaseApiProvider {
  ChargesApiProvider({
    required super.dio,
    required super.userStorageService,
  });

  /// Returns the charge breakdown for [amount] for the given [jarId].
  /// Throws if the request fails — callers should handle errors.
  Future<ChargesModel> getCharges({
    required double amount,
    String? jarId,
    String? paymentMethod,
    String? type,
    String? country,
  }) async {
    final response = await dio.get(
      '${BackendConfig.apiBaseUrl}/transactions/get-charges',
      queryParameters: {
        'amount': amount,
        if (jarId != null) 'jarId': jarId,
        if (paymentMethod != null) 'paymentMethod': paymentMethod,
        if (type != null) 'type': type,
        if (country != null) 'country': country,
      },
    );

    return ChargesModel.fromJson(response.data as Map<String, dynamic>);
  }
}
