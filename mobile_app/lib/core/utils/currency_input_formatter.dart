import 'package:flutter/services.dart';

/// A TextInputFormatter for currency input that maintains currency symbols
/// and formats numeric input appropriately
class CurrencyInputFormatter extends TextInputFormatter {
  String _currencySymbol = '';

  /// Set the currency symbol that should always be preserved
  void setCurrencySymbol(String symbol) {
    _currencySymbol = symbol;
  }

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Always ensure currency symbol is present
    if (_currencySymbol.isNotEmpty &&
        !newValue.text.startsWith(_currencySymbol)) {
      // If user tries to delete currency symbol, restore it
      if (newValue.text.isEmpty) {
        return TextEditingValue(
          text: _currencySymbol,
          selection: TextSelection.collapsed(offset: _currencySymbol.length),
        );
      }
      // If user is typing without currency symbol, add it back
      return TextEditingValue(
        text: '$_currencySymbol${newValue.text}',
        selection: TextSelection.collapsed(
          offset: _currencySymbol.length + newValue.text.length,
        ),
      );
    }

    if (newValue.text.isEmpty) {
      return newValue;
    }

    // Extract currency symbol from the beginning of the text
    String currencySymbol = '';
    String numberPart = newValue.text;

    // Find currency symbols at the beginning (₵, $, €, £, ₦, etc.)
    final currencyMatch = RegExp(r'^([₵$€£₦¥¢])\s*').firstMatch(newValue.text);
    if (currencyMatch != null) {
      currencySymbol = currencyMatch.group(1)!;
      numberPart = newValue.text.substring(currencyMatch.end);
    }

    // Convert all commas to dots immediately for consistency
    String cleaned = numberPart.replaceAll(',', '.');

    // Remove all non-digit characters except dot
    cleaned = cleaned.replaceAll(RegExp(r'[^\d.]'), '');

    // Find the last dot (decimal separator)
    int decimalIndex = cleaned.lastIndexOf('.');

    String result;
    if (decimalIndex == -1) {
      // No decimal separator, just return the number as is
      result = _formatNumber(cleaned);
    } else {
      // Has decimal separator
      String integerPart = cleaned.substring(0, decimalIndex);
      String decimalPart = cleaned.substring(decimalIndex + 1);

      // Remove all dots from integer part (in case of multiple dots)
      integerPart = integerPart.replaceAll('.', '');

      // Limit decimal part to 2 digits
      if (decimalPart.length > 2) {
        decimalPart = decimalPart.substring(0, 2);
      }

      // Format integer part and add decimal (no comma formatting)
      String formattedInteger = _formatNumber(integerPart);
      result = '$formattedInteger.$decimalPart';
    }

    // Always preserve the currency symbol at the beginning
    String finalResult =
        currencySymbol.isNotEmpty ? '$currencySymbol$result' : result;
    return TextEditingValue(
      text: finalResult,
      selection: TextSelection.collapsed(offset: finalResult.length),
    );
  }

  String _formatNumber(String number) {
    if (number.isEmpty) return '';

    // Just return the number as is, no comma formatting
    return number;
  }

  /// Extract numeric value from formatted text (without currency symbol)
  double getNumericValue(String formattedText) {
    if (_currencySymbol.isNotEmpty &&
        formattedText.startsWith(_currencySymbol)) {
      final numericPart = formattedText.substring(_currencySymbol.length);
      return double.tryParse(numericPart) ?? 0.0;
    }
    return double.tryParse(formattedText) ?? 0.0;
  }
}
