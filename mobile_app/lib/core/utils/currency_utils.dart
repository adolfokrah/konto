/// Currency formatting utilities for jar currencies used throughout the app
import 'package:konto/core/constants/currencies.dart';

class CurrencyUtils {
  /// Get currency symbol based on currency code
  ///
  /// Supports: GHC (₵), NGN (₦), USD ($), EUR (€), GBP (£)
  /// Returns GHC symbol (₵) as fallback for unsupported currencies
  static String getCurrencySymbol(String currency) {
    try {
      return Currencies.all
          .firstWhere((c) => c.code.toLowerCase() == currency.toLowerCase())
          .symbol;
    } catch (e) {
      return '₵'; // Default fallback
    }
  }

  /// Format amount with currency symbol
  ///
  /// Example: formatAmount(1000.50, 'ghc') returns "₵ 1000.50"
  static String formatAmount(
    double amount,
    String currency, {
    int decimalPlaces = 2,
  }) {
    final symbol = getCurrencySymbol(currency);
    return '$symbol ${amount.toStringAsFixed(decimalPlaces)}';
  }

  /// Format amount with currency symbol and no decimal places
  ///
  /// Example: formatAmountWhole(1000.50, 'ghc') returns "₵ 1001"
  static String formatAmountWhole(double amount, String currency) {
    return formatAmount(amount, currency, decimalPlaces: 0);
  }

  /// Format amount with currency symbol and compact notation for large numbers
  ///
  /// Example: formatAmountCompact(1500000, 'ghc') returns "₵ 1.5M"
  static String formatAmountCompact(double amount, String currency) {
    final symbol = getCurrencySymbol(currency);

    if (amount >= 1000000) {
      return '$symbol ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '$symbol ${(amount / 1000).toStringAsFixed(1)}K';
    } else {
      return '$symbol ${amount.toStringAsFixed(0)}';
    }
  }

  /// Get all supported currency codes
  static List<String> get supportedCurrencies =>
      Currencies.all.map((c) => c.code.toLowerCase()).toList();

  /// Check if a currency code is supported
  static bool isCurrencySupported(String currency) {
    return Currencies.all.any(
      (c) => c.code.toLowerCase() == currency.toLowerCase(),
    );
  }

  /// Get currency name from code
  static String getCurrencyName(String currency) {
    switch (currency.toLowerCase()) {
      case 'ghc':
        return 'Ghanaian Cedi';
      case 'ngn':
        return 'Nigerian Naira';
      case 'usd':
        return 'US Dollar';
      case 'eur':
        return 'Euro';
      case 'gbp':
        return 'British Pound';
      default:
        return 'Ghanaian Cedi'; // Default fallback
    }
  }
}
