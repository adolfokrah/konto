import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';

/// API Provider for business KYB (Know Your Business) operations
class BusinessKybProvider extends BaseApiProvider {
  BusinessKybProvider({required super.dio, required super.userStorageService});

  /// Submit the business verification (KYB) with previously uploaded doc ids.
  ///
  /// [directors] is a list of maps shaped like:
  /// `{ 'fullName': String, 'idDocument': String, 'idDocumentBack': String? }`.
  /// When `idDocumentBack` is null it is omitted from the payload.
  Future<Map<String, dynamic>> submitKyb({
    required String businessName,
    required String companyRegistrationDocId,
    required String proofOfAddressId,
    required List<Map<String, dynamic>> directors,
  }) async {
    try {
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      final requestData = {
        'businessName': businessName,
        'companyRegistrationDoc': companyRegistrationDocId,
        'proofOfBusinessAddress': proofOfAddressId,
        'directors':
            directors.map((director) {
              final entry = <String, dynamic>{
                'fullName': director['fullName'],
                'idDocument': director['idDocument'],
              };
              if (director['idDocumentBack'] != null) {
                entry['idDocumentBack'] = director['idDocumentBack'];
              }
              return entry;
            }).toList(),
      };

      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/business-verifications/submit',
        data: requestData,
        options: Options(headers: headers),
      );

      return {
        'success': true,
        'data': response.data['data'],
        'message': 'Business verification submitted successfully',
      };
    } catch (e) {
      return handleApiError(e, 'submitting business verification');
    }
  }

  /// Get the authenticated user's business verification (KYB) status.
  Future<Map<String, dynamic>> getMyKyb() async {
    try {
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      final response = await dio.get(
        '${BackendConfig.apiBaseUrl}/business-verifications/mine',
        options: Options(headers: headers),
      );

      return {
        'success': true,
        'data': response.data['data'],
        'message': 'Business verification status fetched successfully',
      };
    } catch (e) {
      return handleApiError(e, 'fetching business verification status');
    }
  }
}
