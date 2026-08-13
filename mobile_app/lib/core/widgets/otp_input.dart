import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';

/// A custom OTP (One-Time Password) input widget that follows the app's design system.
///
/// The digits are rendered as decorative boxes on top of a single, invisible text
/// field that holds the whole code. Focus therefore never moves while the user
/// types, which is what keeps the software keyboard attached — an earlier version
/// used one field per digit and hopped focus after every keystroke, which tore
/// down and rebuilt the platform text input connection mid-entry and left iPadOS
/// without a keyboard from the second digit onwards.
///
/// A single field also gives us SMS autofill, paste, and backspace for free.
class AppOtpInput extends StatefulWidget {
  /// Number of OTP digits (typically 4, 5, or 6)
  final int length;

  /// Callback when OTP is complete
  final Function(String)? onCompleted;

  /// Callback when OTP value changes
  final Function(String)? onChanged;

  /// Whether the input is enabled
  final bool enabled;

  /// Whether to auto-focus the input
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
  });

  @override
  State<AppOtpInput> createState() => _AppOtpInputState();
}

class _AppOtpInputState extends State<AppOtpInput> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: _sanitize(widget.initialValue));
    _focusNode = FocusNode();
    // The boxes render the focused/filled state, so they need to repaint when
    // focus changes even though no text changed.
    _focusNode.addListener(_onFocusChanged);

    if (_controller.text.isNotEmpty) {
      // Report the seeded value once the first frame is up, so callers can read
      // it without being called during their own build.
      WidgetsBinding.instance.addPostFrameCallback((_) => _notify());
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChanged);
    _focusNode.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onFocusChanged() {
    if (mounted) setState(() {});
  }

  /// Strip anything that is not a digit and cap at [AppOtpInput.length].
  String _sanitize(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
    return digits.length > widget.length
        ? digits.substring(0, widget.length)
        : digits;
  }

  void _notify() {
    final value = _controller.text;
    widget.onChanged?.call(value);
    if (value.length == widget.length) {
      widget.onCompleted?.call(value);
    }
  }

  void _onChanged(String _) {
    setState(() {});
    _notify();
  }

  /// Keep entry append-only: tapping a box should not drop the caret between
  /// digits, otherwise the next keystroke would land in the middle of the code.
  void _moveCaretToEnd() {
    _controller.selection = TextSelection.collapsed(
      offset: _controller.text.length,
    );
  }

  /// Clear all OTP fields
  void clear() {
    _controller.clear();
    setState(() {});
    widget.onChanged?.call('');
    if (widget.autoFocus) {
      _focusNode.requestFocus();
    }
  }

  /// Set OTP value programmatically
  void setValue(String value) {
    _controller.text = _sanitize(value);
    _moveCaretToEnd();
    setState(() {});
    _notify();
  }

  /// Get current OTP value
  String get value => _controller.text;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Calculate available width and adjust field size if needed
        final screenWidth = MediaQuery.of(context).size.width;
        final padding = AppSpacing.spacingM * 2; // Account for page padding
        final availableWidth =
            constraints.maxWidth.isFinite
                ? constraints.maxWidth
                : screenWidth - padding;

        final totalSpacing = widget.spacing * (widget.length - 1);
        final maxTotalFieldWidth = availableWidth - totalSpacing;
        final calculatedFieldWidth = maxTotalFieldWidth / widget.length;

        // Use smaller field width if needed, but maintain minimum size
        final effectiveFieldWidth =
            calculatedFieldWidth < widget.fieldWidth
                ? (calculatedFieldWidth > 35 ? calculatedFieldWidth : 35.0)
                : widget.fieldWidth;

        // Adjust spacing proportionally if fields are smaller
        final effectiveSpacing =
            calculatedFieldWidth < widget.fieldWidth
                ? (widget.spacing * 0.6).clamp(8.0, widget.spacing)
                : widget.spacing;

        // Give the stack a definite width so the input can be sized to cover
        // every box; it sits inside a horizontal scroll view, so it would
        // otherwise be laid out unbounded.
        final totalWidth =
            effectiveFieldWidth * widget.length +
            effectiveSpacing * (widget.length - 1);

        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SizedBox(
            width: totalWidth,
            height: widget.fieldHeight,
            child: Stack(
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(widget.length, (index) {
                    return Container(
                      margin: EdgeInsets.only(
                        right: index < widget.length - 1 ? effectiveSpacing : 0,
                      ),
                      child: _buildBox(index, effectiveFieldWidth),
                    );
                  }),
                ),
                // The real input, stretched over the boxes so a tap anywhere on
                // the row focuses it. Invisible, because the boxes above draw
                // the digits.
                Positioned.fill(child: _buildHiddenField()),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHiddenField() {
    return TextField(
      controller: _controller,
      focusNode: _focusNode,
      enabled: widget.enabled,
      autofocus: widget.autoFocus,
      keyboardType: TextInputType.number,
      textInputAction: TextInputAction.done,
      // One field for the whole code, so SMS autofill fills it in a single shot
      // instead of having to spread across per-digit fields.
      autofillHints: const [AutofillHints.oneTimeCode],
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(widget.length),
      ],
      // Hidden: the digits are painted by the boxes underneath. Transparent text
      // rather than obscured, so nothing double-renders.
      showCursor: false,
      cursorWidth: 0,
      style: const TextStyle(color: Colors.transparent, fontSize: 1),
      decoration: const InputDecoration(
        border: InputBorder.none,
        counterText: '',
        contentPadding: EdgeInsets.zero,
        isCollapsed: true,
      ),
      onChanged: _onChanged,
      onTap: _moveCaretToEnd,
    );
  }

  Widget _buildBox(int index, double fieldWidth) {
    final code = _controller.text;
    final hasDigit = index < code.length;
    // The next empty box is the active one; once the code is full, keep the
    // highlight on the last box rather than running off the end.
    final isActive =
        _focusNode.hasFocus &&
        index == code.length.clamp(0, widget.length - 1) &&
        code.length < widget.length;

    Border? border;
    if (widget.hasError) {
      border = Border.all(color: Theme.of(context).colorScheme.error, width: 2);
    } else if (isActive) {
      border = Border.all(
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
        width: 2,
      );
    }

    return Container(
      width: fieldWidth,
      height: widget.fieldHeight,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color:
            widget.enabled
                ? Theme.of(context).colorScheme.primary
                : Theme.of(context).colorScheme.primary.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppRadius.radiusM),
        border: border,
      ),
      child: Text(
        hasDigit ? (widget.obscureText ? '•' : code[index]) : '',
        style: AppTextStyles.titleBoldLg,
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
