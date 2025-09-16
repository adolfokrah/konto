import 'package:flutter/material.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_input_formatter.dart';

/// A reusable text field widget specifically designed for currency input
/// Features:
/// - Large centered text display
/// - Currency symbol preservation
/// - Numeric input formatting
/// - Theme-aware cursor color
class CurrencyTextField extends StatefulWidget {
  /// Controller for the text field
  final TextEditingController controller;

  /// Focus node for the text field
  final FocusNode? focusNode;

  /// Currency symbol to display (e.g., '$', '₵', '€')
  final String currencySymbol;

  /// Text style for the input field
  final TextStyle? textStyle;

  /// Called when the value changes
  final ValueChanged<String>? onChanged;

  /// Called when editing is complete
  final VoidCallback? onEditingComplete;

  /// Called when submitted
  final ValueChanged<String>? onSubmitted;

  const CurrencyTextField({
    super.key,
    required this.controller,
    required this.currencySymbol,
    this.focusNode,
    this.textStyle,
    this.onChanged,
    this.onEditingComplete,
    this.onSubmitted,
  });

  @override
  State<CurrencyTextField> createState() => _CurrencyTextFieldState();
}

class _CurrencyTextFieldState extends State<CurrencyTextField> {
  late final CurrencyInputFormatter _currencyFormatter;

  @override
  void initState() {
    super.initState();
    _currencyFormatter = CurrencyInputFormatter();
    _initializeCurrencySymbol();
  }

  @override
  void didUpdateWidget(CurrencyTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currencySymbol != widget.currencySymbol) {
      _initializeCurrencySymbol();
    }
  }

  void _initializeCurrencySymbol() {
    _currencyFormatter.setCurrencySymbol(widget.currencySymbol);

    // Initialize with currency symbol if controller is empty
    if (widget.controller.text.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          widget.controller.text = widget.currencySymbol;
          widget.controller.selection = TextSelection.collapsed(
            offset: widget.currencySymbol.length,
          );
        }
      });
    }
  }

  /// Get the numeric value from the current text (without currency symbol)
  double get numericValue =>
      _currencyFormatter.getNumericValue(widget.controller.text);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return TextField(
      controller: widget.controller,
      focusNode: widget.focusNode,
      keyboardType: const TextInputType.numberWithOptions(
        decimal: true,
        signed: false,
      ),
      inputFormatters: [_currencyFormatter],
      cursorColor: isDark ? Colors.white : AppColors.black,
      style:
          widget.textStyle ??
          TextStyles.titleBoldXl.copyWith(
            fontSize: 64,
            fontWeight: FontWeight.bold,
          ),
      textAlign: TextAlign.center,
      onChanged: widget.onChanged,
      onEditingComplete: widget.onEditingComplete,
      onSubmitted: widget.onSubmitted,
      decoration: const InputDecoration(
        border: InputBorder.none,
        contentPadding: EdgeInsets.zero,
        hintText: '0.00',
      ),
    );
  }
}

/// Extension to easily get the numeric value from a CurrencyTextField
extension CurrencyTextFieldExt on CurrencyTextField {
  /// Get the numeric value from the text field
  double getNumericValue() {
    final formatter = CurrencyInputFormatter();
    formatter.setCurrencySymbol(currencySymbol);
    return formatter.getNumericValue(controller.text);
  }
}
