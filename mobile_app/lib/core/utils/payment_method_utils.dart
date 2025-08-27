import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/core/widgets/select_input.dart';

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

  /// Get mobile money operator mapping for use in dropdowns/selectors
  static Map<String, String> getMobileMoneyOperatorMap(
    AppLocalizations localizations,
  ) {
    return {
      'mtn': 'MTN Mobile Money',
      'vodafone': 'Vodafone Cash',
      'airteltigo': 'AirtelTigo Money',
    };
  }

  /// Get mobile money operator options as SelectOption list
  static List<SelectOption<String>> getMobileMoneyOperatorOptions(
    AppLocalizations localizations,
  ) {
    final operatorMap = getMobileMoneyOperatorMap(localizations);
    return operatorMap.entries
        .map((entry) => SelectOption(value: entry.key, label: entry.value))
        .toList();
  }
}
