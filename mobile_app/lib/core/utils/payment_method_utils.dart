import 'package:konto/l10n/app_localizations.dart';

/// Utility class for payment method related operations
class PaymentMethodUtils {
  /// Convert payment method API value to localized display label
  ///
  /// Maps API values like 'mobile-money', 'cash', 'bank-transfer'
  /// to their localized display names
  static String getPaymentMethodLabel(
    String? paymentMethod,
    AppLocalizations localizations,
  ) {
    if (paymentMethod == null) return 'Unknown';

    switch (paymentMethod.toLowerCase()) {
      case 'mobile-money':
        return localizations.paymentMethodMobileMoney;
      case 'cash':
        return localizations.paymentMethodCash;
      case 'bank-transfer':
        return localizations.paymentMethodBankTransfer;
      default:
        // Return the original value with proper formatting if not found
        return paymentMethod
            .split('-')
            .map(
              (word) =>
                  word.isEmpty ? '' : word[0].toUpperCase() + word.substring(1),
            )
            .join(' ');
    }
  }

  /// Get payment method mapping for use in dropdowns/selectors
  static Map<String, String> getPaymentMethodMap(
    AppLocalizations localizations,
  ) {
    return {
      'mobile-money': localizations.paymentMethodMobileMoney,
      'cash': localizations.paymentMethodCash,
      'bank-transfer': localizations.paymentMethodBankTransfer,
    };
  }
}
