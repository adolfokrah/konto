import 'package:Hoga/features/business_kyb/data/api_providers/business_kyb_provider.dart';

/// Repository for handling business KYB (Know Your Business) operations
class BusinessKybRepository {
  final BusinessKybProvider _businessKybProvider;

  BusinessKybRepository({required BusinessKybProvider businessKybProvider})
    : _businessKybProvider = businessKybProvider;

  /// Submit the business verification (KYB).
  Future<Map<String, dynamic>> submitKyb({
    required String businessName,
    required String companyRegistrationDocId,
    required String proofOfAddressId,
    required List<Map<String, dynamic>> directors,
  }) async {
    try {
      final result = await _businessKybProvider.submitKyb(
        businessName: businessName,
        companyRegistrationDocId: companyRegistrationDocId,
        proofOfAddressId: proofOfAddressId,
        directors: directors,
      );
      return result;
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to submit business verification: ${e.toString()}',
      };
    }
  }

  /// Fetch the authenticated user's business verification status.
  Future<Map<String, dynamic>> getMyKyb() async {
    try {
      final result = await _businessKybProvider.getMyKyb();
      return result;
    } catch (e) {
      return {
        'success': false,
        'message':
            'Failed to fetch business verification status: ${e.toString()}',
      };
    }
  }
}
