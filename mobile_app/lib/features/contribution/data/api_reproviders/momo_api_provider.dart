import 'package:dio/dio.dart';
import 'package:Hoga/core/config/backend_config.dart';
import 'package:Hoga/core/services/base_api_provider.dart';
import 'package:Hoga/core/services/user_storage_service.dart';

/// API Provider for mobile money charge operations
class MomoApiProvider extends BaseApiProvider {
  MomoApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);

  /// Initiate mobile money charge for a contribution
  /// Calls the charge-momo endpoint with contribution ID
  Future<Map<String, dynamic>> chargeMomo({
    required String contributionId,
  }) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Validate required fields
      if (contributionId.isEmpty) {
        return {
          'success': false,
          'message': 'Contribution ID is required',
          'statusCode': 400,
        };
      }

      // Make request to charge-momo endpoint
      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/contributions/charge-momo',
        data: {'contributionId': contributionId},
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'initiating mobile money charge');
    }
  }

  /// Submit OTP for mobile money verification (Vodafone)
  /// Calls the send-otp endpoint with reference and OTP code
  Future<Map<String, dynamic>> submitOtp({
    required String reference,
    required String otp,
  }) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Validate required fields
      if (reference.isEmpty || otp.isEmpty) {
        return {
          'success': false,
          'message': 'Reference and OTP are required',
          'statusCode': 400,
        };
      }

      // Make request to send-otp endpoint
      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/contributions/send-otp',
        data: {'reference': reference, 'otp': otp},
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'submitting OTP verification');
    }
  }

  /// Verify payment status using transaction reference
  /// Calls the verify-payment endpoint with payment reference
  Future<Map<String, dynamic>> verifyPayment({
    required String reference,
  }) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Validate required fields
      if (reference.isEmpty) {
        return {
          'success': false,
          'message': 'Payment reference is required',
          'statusCode': 400,
        };
      }

      // Make request to verify-payment endpoint
      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/contributions/verify-payment',
        data: {'reference': reference},
        options: Options(headers: headers),
      );

      return response.data;
    } catch (e) {
      return handleApiError(e, 'verifying payment status');
    }
  }
}
