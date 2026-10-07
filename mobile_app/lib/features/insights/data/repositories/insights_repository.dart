import 'package:Hoga/features/insights/data/api_providers/insights_api_provider.dart';
import 'package:Hoga/features/insights/data/models/jar_insights_model.dart';

/// Outcome of an insights request.
sealed class InsightsResult {
  const InsightsResult();
}

final class InsightsSuccess extends InsightsResult {
  final JarInsights insights;
  const InsightsSuccess(this.insights);
}

/// The user collects for the jar but isn't one of its organizers (403).
final class InsightsForbidden extends InsightsResult {
  const InsightsForbidden();
}

final class InsightsFailure extends InsightsResult {
  final String message;
  final int? statusCode;
  const InsightsFailure(this.message, {this.statusCode});
}

class InsightsRepository {
  final InsightsApiProvider _apiProvider;

  InsightsRepository({required InsightsApiProvider apiProvider})
    : _apiProvider = apiProvider;

  Future<InsightsResult> getJarInsights({
    required String jarId,
    required InsightsPeriod period,
  }) async {
    try {
      final response = await _apiProvider.getJarInsights(
        jarId: jarId,
        period: period.apiValue,
      );
      if (response['success'] == true && response['data'] is Map) {
        return InsightsSuccess(
          JarInsights.fromJson(Map<String, dynamic>.from(response['data'])),
        );
      }
      final status = response['statusCode'] as int?;
      if (status == 403) return const InsightsForbidden();
      return InsightsFailure(
        response['message']?.toString() ?? 'Couldn\'t load insights',
        statusCode: status,
      );
    } catch (e) {
      return const InsightsFailure('Couldn\'t load insights');
    }
  }
}
