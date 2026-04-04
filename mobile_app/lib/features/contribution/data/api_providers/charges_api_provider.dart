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
    required String jarId,
    String? paymentMethod,
  }) async {
    final response = await dio.get(
      '${BackendConfig.apiBaseUrl}/transactions/get-charges',
      queryParameters: {
        'amount': amount,
        'jarId': jarId,
        if (paymentMethod != null) 'paymentMethod': paymentMethod,
      },
    );

    return ChargesModel.fromJson(response.data as Map<String, dynamic>);
  }
}
