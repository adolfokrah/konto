/// Currency formatting utilities for jar currencies used throughout the app
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:Hoga/core/constants/currencies.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class CurrencyUtils {
  /// Get currency symbol based on currency code with Android fallback
  ///
  /// Supports: GHS (₵), NGN (₦), USD ($), EUR (€), GBP (£)
  /// Returns GHS symbol (₵) as fallback for unsupported currencies
  /// On Android, uses androidFallbackSymbol (GHS for Cedi) if ₵ doesn't render well
  static String getCurrencySymbol(String currency) {
    try {
      final currencyObj = Currencies.all.firstWhere(
        (c) => c.code.toLowerCase() == currency.toLowerCase(),
      );

      // For Android, use fallback symbol if available
      if (!kIsWeb &&
          Platform.isAndroid &&
          currencyObj.androidFallbackSymbol.isNotEmpty) {
        return currencyObj.androidFallbackSymbol;
      }

      return currencyObj.symbol;
    } catch (e) {
      // Default fallback
      if (!kIsWeb && Platform.isAndroid) {
        return 'GHS'; // Use GHS as fallback on Android
      }
      return '₵';
    }
  }

  /// Format amount with currency symbol
  ///
  /// Example: formatAmount(1000.50, 'GHS') returns "₵ 1000.50"
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
  /// Example: formatAmountWhole(1000.50, 'GHS') returns "₵ 1001"
  static String formatAmountWhole(double amount, String currency) {
    return formatAmount(amount, currency, decimalPlaces: 0);
  }

  /// Format amount with currency symbol and compact notation for large numbers
  ///
  /// Example: formatAmountCompact(1500000, 'GHS') returns "₵ 1.5M"
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
      case 'GHS':
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

  /// Get localized currency name from code
  static String getLocalizedCurrencyName(
    String currency,
    AppLocalizations localizations,
  ) {
    switch (currency.toLowerCase()) {
      case 'GHS':
        return localizations.currencyGHS;
      case 'ngn':
        return localizations.currencyNGN;
      case 'usd':
        return localizations.currencyUSD;
      case 'eur':
        return localizations.currencyEUR;
      case 'gbp':
        return localizations.currencyGBP;
      default:
        return localizations.currencyGHS; // Default fallback
    }
  }
}
