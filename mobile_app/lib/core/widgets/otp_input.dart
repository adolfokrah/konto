import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';

/// A custom OTP (One-Time Password) input widget that follows the app's design system
class AppOtpInput extends StatefulWidget {
  /// Number of OTP digits (typically 4, 5, or 6)
  final int length;
  
  /// Callback when OTP is complete
  final Function(String)? onCompleted;
  
  /// Callback when OTP value changes
  final Function(String)? onChanged;
  
  /// Whether the input is enabled
  final bool enabled;
  
  /// Whether to auto-focus the first field
  final bool autoFocus;
  
  /// Whether to obscure the text (for security)
  final bool obscureText;
  
  /// Width of each OTP field
  final double fieldWidth;
  
  /// Height of each OTP field
  final double fieldHeight;
  
  /// Space between OTP fields
  final double spacing;
  
  /// Initial value for the OTP
  final String? initialValue;
  
  /// Error state
  final bool hasError;
  
  /// Custom input decoration
  final InputDecoration? decoration;

  const AppOtpInput({
    super.key,
    this.length = 6,
    this.onCompleted,
    this.onChanged,
    this.enabled = true,
    this.autoFocus = true,
    this.obscureText = false,
    this.fieldWidth = 50.0,
    this.fieldHeight = 60.0,
    this.spacing = AppSpacing.spacingS,
    this.initialValue,
    this.hasError = false,
    this.decoration,
  });

  @override
  State<AppOtpInput> createState() => _AppOtpInputState();
}

class _AppOtpInputState extends State<AppOtpInput> {
  late List<TextEditingController> _controllers;
  late List<FocusNode> _focusNodes;
  String _otpValue = '';

  @override
  void initState() {
    super.initState();
    _initializeControllers();
    _initializeFocusNodes();
    _setInitialValue();
  }

  void _initializeControllers() {
    _controllers = List.generate(
      widget.length,
      (index) => TextEditingController(),
    );
  }

  void _initializeFocusNodes() {
    _focusNodes = List.generate(
      widget.length,
      (index) => FocusNode(),
    );
  }

  void _setInitialValue() {
    if (widget.initialValue != null && widget.initialValue!.isNotEmpty) {
      final value = widget.initialValue!;
      for (int i = 0; i < widget.length && i < value.length; i++) {
        _controllers[i].text = value[i];
      }
      _updateOtpValue();
    }
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final focusNode in _focusNodes) {
      focusNode.dispose();
    }
    super.dispose();
  }

  void _updateOtpValue() {
    _otpValue = _controllers.map((controller) => controller.text).join();
    widget.onChanged?.call(_otpValue);
    
    if (_otpValue.length == widget.length) {
      widget.onCompleted?.call(_otpValue);
    }
  }

  void _onFieldChanged(String value, int index) {
    // Handle deletion - if field becomes empty, move to previous field
    if (value.isEmpty && index > 0) {
      // Delay to avoid conflicts with key event handler
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_controllers[index].text.isEmpty && _focusNodes[index].hasFocus) {
          _focusNodes[index - 1].requestFocus();
        }
      });
    }
    
    // Only allow single digit
    if (value.length > 1) {
      _controllers[index].text = value.substring(value.length - 1);
      _controllers[index].selection = TextSelection.fromPosition(
        TextPosition(offset: _controllers[index].text.length),
      );
    }

    _updateOtpValue();

    // Auto-focus next field when entering a digit
    if (value.isNotEmpty && index < widget.length - 1) {
      _focusNodes[index + 1].requestFocus();
    }
  }

  void _onFieldSubmitted(String value, int index) {
    // Move to next field or complete
    if (index < widget.length - 1) {
      _focusNodes[index + 1].requestFocus();
    } else {
      _focusNodes[index].unfocus();
    }
  }

  void _onFieldTap(int index) {
    // Focus and place cursor at end
    _focusNodes[index].requestFocus();
    _controllers[index].selection = TextSelection.fromPosition(
      TextPosition(offset: _controllers[index].text.length),
    );
  }

  bool _onFieldKeyEvent(KeyEvent event, int index) {
    // Handle backspace key
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_controllers[index].text.isNotEmpty) {
        // Clear current field if it has content
        _controllers[index].clear();
        _updateOtpValue();
        return true;
      } else if (index > 0) {
        // Current field is empty, move to previous field and clear it if it has content
        _focusNodes[index - 1].requestFocus();
        if (_controllers[index - 1].text.isNotEmpty) {
          _controllers[index - 1].clear();
          _updateOtpValue();
        }
        return true;
      }
    }
    return false;
  }

  /// Clear all OTP fields
  void clear() {
    for (final controller in _controllers) {
      controller.clear();
    }
    _otpValue = '';
    widget.onChanged?.call(_otpValue);
    if (widget.autoFocus) {
      _focusNodes[0].requestFocus();
    }
  }

  /// Set OTP value programmatically
  void setValue(String value) {
    for (int i = 0; i < widget.length; i++) {
      _controllers[i].text = i < value.length ? value[i] : '';
    }
    _updateOtpValue();
  }

  /// Get current OTP value
  String get value => _otpValue;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Calculate available width and adjust field size if needed
        final screenWidth = MediaQuery.of(context).size.width;
        final padding = AppSpacing.spacingM * 2; // Account for page padding
        final availableWidth = constraints.maxWidth.isFinite 
            ? constraints.maxWidth 
            : screenWidth - padding;
        
        final totalSpacing = widget.spacing * (widget.length - 1);
        final maxTotalFieldWidth = availableWidth - totalSpacing;
        final calculatedFieldWidth = maxTotalFieldWidth / widget.length;
        
        // Use smaller field width if needed, but maintain minimum size
        final effectiveFieldWidth = calculatedFieldWidth < widget.fieldWidth 
            ? (calculatedFieldWidth > 35 ? calculatedFieldWidth : 35.0)
            : widget.fieldWidth;
        
        // Adjust spacing proportionally if fields are smaller
        final effectiveSpacing = calculatedFieldWidth < widget.fieldWidth 
            ? (widget.spacing * 0.6).clamp(8.0, widget.spacing) 
            : widget.spacing;
        
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: List.generate(widget.length, (index) {
              return Container(
                margin: EdgeInsets.only(
                  right: index < widget.length - 1 ? effectiveSpacing : 0,
                ),
                child: _buildOtpField(index, effectiveFieldWidth),
              );
            }),
          ),
        );
      },
    );
  }

  Widget _buildOtpField(int index, [double? customWidth]) {
    final fieldWidth = customWidth ?? widget.fieldWidth;
    
    return Container(
      width: fieldWidth,
      height: widget.fieldHeight,
      decoration: BoxDecoration(
        color: widget.enabled 
            ? Theme.of(context).colorScheme.primary 
            : Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppRadius.radiusM),
        border: widget.hasError
            ? Border.all(
                color: Theme.of(context).colorScheme.error,
                width: 2,
              )
            : _focusNodes[index].hasFocus
                ? Border.all(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                    width: 2,
                  )
                : null,
      ),
      child: Focus(
        onKeyEvent: (node, event) {
          return _onFieldKeyEvent(event, index) 
              ? KeyEventResult.handled 
              : KeyEventResult.ignored;
        },
        child: Center(
          child: TextFormField(
            controller: _controllers[index],
            focusNode: _focusNodes[index],
            enabled: widget.enabled,
            obscureText: widget.obscureText,
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            autofocus: widget.autoFocus && index == 0,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(1),
            ],
            style: AppTextStyles.titleBoldLg,
            cursorColor: Theme.of(context).colorScheme.onSurface,
            decoration: widget.decoration ?? InputDecoration(
              border: InputBorder.none,
              counterText: '',
              contentPadding: EdgeInsets.zero,
              isDense: true,
              hintStyle: AppTextStyles.titleMediumM.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
              ),
            ),
            onChanged: (value) => _onFieldChanged(value, index),
            onFieldSubmitted: (value) => _onFieldSubmitted(value, index),
            onTap: () => _onFieldTap(index),
          ),
        ),
      ),
    );
  }
}

/// A simplified OTP input widget for quick usage
class SimpleOtpInput extends StatelessWidget {
  final int length;
  final Function(String)? onCompleted;
  final Function(String)? onChanged;
  final bool enabled;
  final String? initialValue;
  final bool hasError;

  const SimpleOtpInput({
    super.key,
    this.length = 6,
    this.onCompleted,
    this.onChanged,
    this.enabled = true,
    this.initialValue,
    this.hasError = false,
  });

  @override
  Widget build(BuildContext context) {
    return AppOtpInput(
      length: length,
      onCompleted: onCompleted,
      onChanged: onChanged,
      enabled: enabled,
      initialValue: initialValue,
      hasError: hasError,
    );
  }
}

/// A compact OTP input widget for smaller spaces
class CompactOtpInput extends StatelessWidget {
  final int length;
  final Function(String)? onCompleted;
  final Function(String)? onChanged;
  final bool enabled;
  final String? initialValue;
  final bool hasError;

  const CompactOtpInput({
    super.key,
    this.length = 4,
    this.onCompleted,
    this.onChanged,
    this.enabled = true,
    this.initialValue,
    this.hasError = false,
  });

  @override
  Widget build(BuildContext context) {
    return AppOtpInput(
      length: length,
      onCompleted: onCompleted,
      onChanged: onChanged,
      enabled: enabled,
      initialValue: initialValue,
      hasError: hasError,
      fieldWidth: 45.0,
      fieldHeight: 50.0,
      spacing: AppSpacing.spacingXs,
    );
  }
}
