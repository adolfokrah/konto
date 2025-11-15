import 'package:Hoga/features/contribution/data/api_reproviders/momo_api_provider.dart';
import 'package:Hoga/features/contribution/data/models/momo_charge_model.dart';

/// Repository for mobile money charge operations
/// Orchestrates business logic between UI and API calls
class MomoRepository {
  final MomoApiProvider _momoApiProvider;

  MomoRepository({required MomoApiProvider momoApiProvider})
    : _momoApiProvider = momoApiProvider;

  /// Initiate mobile money charge for a contribution
  /// Returns MomoChargeModel with charge data if successful
  Future<MomoChargeModel> chargeMomo({required String contributionId}) async {
    try {
      final apiResponse = await _momoApiProvider.chargeMomo(
        contributionId: contributionId,
      );

      if (apiResponse['success'] == true) {
        // Parse the Paystack charge response data into MomoChargeModel
        final chargeData = apiResponse['data'] as Map<String, dynamic>;
        return MomoChargeModel.fromJson({
          ...chargeData,
          'reference':
              chargeData['reference'] ?? chargeData['data']?['reference'],
        });
      } else {
        // Handle API errors - throw exception to be caught by BLoC
        throw Exception(
          apiResponse['message'] ?? 'Failed to initiate mobile money charge',
        );
      }
    } catch (e) {
      // Re-throw or wrap in more specific exception
      if (e is Exception) {
        rethrow;
      }
      throw Exception(
        'An unexpected error occurred while initiating mobile money charge: ${e.toString()}',
      );
    }
  }

  /// Submit OTP for Telecel mobile money verification
  /// Returns success response if OTP is valid
  Future<MomoChargeModel> submitOtp({
    required String reference,
    required String otp,
  }) async {
    try {
      final apiResponse = await _momoApiProvider.submitOtp(
        reference: reference,
        otp: otp,
      );

      if (apiResponse['success'] == true) {
        final chargeData = apiResponse['data'] as Map<String, dynamic>;
        return MomoChargeModel.fromJson({
          ...chargeData,
          'reference':
              chargeData['reference'] ?? chargeData['data']?['reference'],
        });
      } else {
        // Handle API errors - throw exception to be caught by BLoC
        throw Exception(apiResponse['message'] ?? 'Failed to verify OTP');
      }
    } catch (e) {
      // Re-throw or wrap in more specific exception
      if (e is Exception) {
        rethrow;
      }
      throw Exception(
        'An unexpected error occurred while verifying OTP: ${e.toString()}',
      );
    }
  }

  /// Verify payment status using transaction reference
  /// Returns MomoChargeModel with updated payment status if successful
  Future<MomoChargeModel> verifyPayment({required String reference}) async {
    try {
      final apiResponse = await _momoApiProvider.verifyPayment(
        reference: reference,
      );

      if (apiResponse['success'] == true) {
        final transactionData = apiResponse['data'] as Map<String, dynamic>;
        return MomoChargeModel.fromJson({
          ...transactionData,
          'reference': reference, // Ensure reference is included
        });
      } else {
        // Handle API errors - throw exception to be caught by BLoC
        throw Exception(
          apiResponse['message'] ?? 'Failed to verify payment status',
        );
      }
    } catch (e) {
      // Re-throw or wrap in more specific exception
      if (e is Exception) {
        rethrow;
      }
      throw Exception(
        'An unexpected error occurred while verifying payment: ${e.toString()}',
      );
    }
  }
}
