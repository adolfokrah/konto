// Simple test to verify currency utils functionality
import 'package:flutter_test/flutter_test.dart';
import 'package:konto/core/utils/currency_utils.dart';

void main() {
  group('CurrencyUtils', () {
    test('should return correct currency symbols', () {
      expect(CurrencyUtils.getCurrencySymbol('ghc'), '₵');
      expect(CurrencyUtils.getCurrencySymbol('ngn'), '₦');
      expect(CurrencyUtils.getCurrencySymbol('usd'), '\$');
      expect(CurrencyUtils.getCurrencySymbol('eur'), '€');
      expect(CurrencyUtils.getCurrencySymbol('gbp'), '£');
    });

    test('should return default symbol for unknown currency', () {
      expect(CurrencyUtils.getCurrencySymbol('unknown'), '₵');
    });

    test('should format amount correctly', () {
      expect(CurrencyUtils.formatAmount(1000.50, 'ghc'), '₵ 1000.50');
      expect(CurrencyUtils.formatAmount(500.0, 'ngn'), '₦ 500.00');
      expect(CurrencyUtils.formatAmountWhole(1000.99, 'usd'), '\$ 1001');
    });

    test('should format compact amounts correctly', () {
      expect(CurrencyUtils.formatAmountCompact(1500000, 'ghc'), '₵ 1.5M');
      expect(CurrencyUtils.formatAmountCompact(1500, 'ngn'), '₦ 1.5K');
      expect(CurrencyUtils.formatAmountCompact(500, 'usd'), '\$ 500');
    });

    test('should check currency support correctly', () {
      expect(CurrencyUtils.isCurrencySupported('ghc'), true);
      expect(CurrencyUtils.isCurrencySupported('unknown'), false);
    });

    test('should return correct currency names', () {
      expect(CurrencyUtils.getCurrencyName('ghc'), 'Ghanaian Cedi');
      expect(CurrencyUtils.getCurrencyName('ngn'), 'Nigerian Naira');
      expect(CurrencyUtils.getCurrencyName('usd'), 'US Dollar');
    });
  });
}
