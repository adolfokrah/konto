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
    // If no symbol configured, just pass through
    if (_currencySymbol.isEmpty) {
      return newValue;
    }
    // Desired immutable prefix (symbol + space)
    final String requiredPrefix = '$_currencySymbol ';
    String incoming = newValue.text;

    // If user cleared everything -> restore prefix
    if (incoming.isEmpty) {
      return TextEditingValue(
        text: requiredPrefix,
        selection: TextSelection.collapsed(offset: requiredPrefix.length),
      );
    }

    final lowerIncoming = incoming.toLowerCase();
    final lowerSymbolWithSpace = (_currencySymbol.toLowerCase() + ' ');

    // Ensure prefix
    if (!lowerIncoming.startsWith(lowerSymbolWithSpace)) {
      // Strip any partial leading fragment of the symbol
      incoming = incoming.replaceFirst(
        RegExp(
          '^' + _currencySymbol.toLowerCase() + '\\s*',
          caseSensitive: false,
        ),
        '',
      );
      incoming = requiredPrefix + incoming;
    }

    // Remove accidental duplicate prefixes
    while (incoming.toLowerCase().startsWith(
      lowerSymbolWithSpace + lowerSymbolWithSpace,
    )) {
      incoming = incoming.substring(requiredPrefix.length);
    }

    // Split off numeric portion
    String numberPart = incoming.substring(requiredPrefix.length);

    if (numberPart.trim().isEmpty) {
      return TextEditingValue(
        text: requiredPrefix,
        selection: TextSelection.collapsed(offset: requiredPrefix.length),
      );
    }

    // Convert commas to dots immediately for consistency
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

    // Reconstruct final value with prefix
    final String finalResult = '$requiredPrefix$result';

    // Try to keep caret just after symbol when user deletes, else at end
    int caretOffset;
    if (result.isEmpty) {
      caretOffset = requiredPrefix.length;
    } else {
      // If old caret was within numeric section, approximate relative position
      final oldNumericLength =
          oldValue.text.startsWith(requiredPrefix)
              ? oldValue.text.length - requiredPrefix.length
              : oldValue.text.length;
      final newNumericLength = result.length;
      // Maintain proportion (rough)
      if (oldNumericLength > 0 &&
          oldValue.selection.end > requiredPrefix.length) {
        final relative = oldValue.selection.end - requiredPrefix.length;
        final ratio = relative / oldNumericLength;
        caretOffset =
            requiredPrefix.length +
            (ratio * newNumericLength).clamp(0, newNumericLength).round();
      } else {
        caretOffset = finalResult.length;
      }
      if (caretOffset > finalResult.length) caretOffset = finalResult.length;
    }
    return TextEditingValue(
      text: finalResult,
      selection: TextSelection.collapsed(offset: caretOffset),
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
