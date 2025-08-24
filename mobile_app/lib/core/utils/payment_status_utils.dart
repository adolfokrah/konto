import 'package:konto/l10n/app_localizations.dart';

/// Utility class for payment status related operations
class PaymentStatusUtils {
  /// Get localized payment status label
  static String getPaymentStatusLabel(
    String? paymentStatus,
    AppLocalizations localizations,
  ) {
    if (paymentStatus == null) return localizations.unknown;

    switch (paymentStatus.toLowerCase()) {
      case 'pending':
        return localizations.paymentStatusPending;
      case 'completed':
        return localizations.paymentStatusCompleted;
      case 'failed':
        return localizations.paymentStatusFailed;
      case 'transferred':
        return localizations.paymentStatusTransferred;
      default:
        return localizations.unknown;
    }
  }

  /// Get payment status color based on status
  static String getPaymentStatusColorClass(String? paymentStatus) {
    if (paymentStatus == null) return 'default';

    switch (paymentStatus.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'transferred':
        return 'info';
      default:
        return 'default';
    }
  }

  /// Check if payment status is successful
  static bool isSuccessfulStatus(String? paymentStatus) {
    return paymentStatus?.toLowerCase() == 'completed' ||
        paymentStatus?.toLowerCase() == 'transferred';
  }

  /// Check if payment status is in progress
  static bool isInProgressStatus(String? paymentStatus) {
    return paymentStatus?.toLowerCase() == 'pending';
  }

  /// Check if payment status is failed
  static bool isFailedStatus(String? paymentStatus) {
    return paymentStatus?.toLowerCase() == 'failed';
  }
}
