import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/haptic_utils.dart';


class AppButton extends StatelessWidget {
  final String text;
  final Widget? icon;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool isFullWidth;
  final bool isLoading;
  final bool enableHapticFeedback;
  final Color? backgroundColor;
  final Color? textColor;
  final Color? borderColor;

  const AppButton({
    super.key,
    required this.text,
    this.icon,
    this.onPressed,
    this.variant = ButtonVariant.fill,
    this.isFullWidth = true,
    this.isLoading = false,
    this.enableHapticFeedback = true,
    this.backgroundColor,
    this.textColor,
    this.borderColor,
  });

  // Factory constructors for common button types
  factory AppButton.filled({
    Key? key,
    required String text,
    Widget? icon,
    VoidCallback? onPressed,
    bool isFullWidth = true,
    bool isLoading = false,
    bool enableHapticFeedback = true,
    Color? backgroundColor,
    Color? textColor,
  }) {
    return AppButton(
      key: key,
      text: text,
      icon: icon,
      onPressed: onPressed,
      variant: ButtonVariant.fill,
      isFullWidth: isFullWidth,
      isLoading: isLoading,
      enableHapticFeedback: enableHapticFeedback,
      backgroundColor: backgroundColor,
      textColor: textColor,
    );
  }

  factory AppButton.outlined({
    Key? key,
    required String text,
    Widget? icon,
    VoidCallback? onPressed,
    bool isFullWidth = true,
    bool isLoading = false,
    bool enableHapticFeedback = true,
    Color? borderColor,
    Color? textColor,
  }) {
    return AppButton(
      key: key,
      text: text,
      icon: icon,
      onPressed: onPressed,
      variant: ButtonVariant.outline,
      isFullWidth: isFullWidth,
      isLoading: isLoading,
      enableHapticFeedback: enableHapticFeedback,
      borderColor: borderColor,
      textColor: textColor,
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isDisabled = onPressed == null && !isLoading;
    
    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: 55,
      child: variant == ButtonVariant.fill
          ? _buildFilledButton(context, isDisabled)
          : _buildOutlinedButton(context, isDisabled),
    );
  }

  VoidCallback? _getOnPressedCallback() {
    if (onPressed == null || isLoading) return null;

    return enableHapticFeedback
        ? () {
            HapticUtils.heavy();
            onPressed!();
          }
        : onPressed!;
  }

  Widget _buildFilledButton(BuildContext context, bool isDisabled) {
    final Color bgColor = isDisabled
        ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)
        : backgroundColor ?? Theme.of(context).colorScheme.onSurface;
    
    final Color txtColor = isDisabled
        ? Theme.of(context).colorScheme.primary
        : textColor ?? Theme.of(context).colorScheme.primary;

    return ElevatedButton(
      onPressed: _getOnPressedCallback(),
      style: ElevatedButton.styleFrom(
        backgroundColor: bgColor,
        foregroundColor: txtColor,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(100),
        ),
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.spacingM,
          vertical: AppSpacing.spacingXs,
        ),
      ),
      child: _buildButtonContent(txtColor),
    );
  }

  Widget _buildOutlinedButton(BuildContext context, bool isDisabled) {
    final Color borderClr = isDisabled
        ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.3)
        : borderColor ?? Theme.of(context).colorScheme.onSurface;
    
    final Color txtColor = isDisabled
        ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.5)
        : textColor ?? Theme.of(context).colorScheme.onSurface;

    return OutlinedButton(
      onPressed: _getOnPressedCallback(),
      style: OutlinedButton.styleFrom(
        foregroundColor: txtColor,
        side: BorderSide(
          color: borderClr,
          width: 2,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.radiusL),
        ),
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.spacingM,
          vertical: AppSpacing.spacingXs,
        ),
      ),
      child: _buildButtonContent(txtColor),
    );
  }

  Widget _buildButtonContent(Color textColor) {
    if (isLoading) {
      return SizedBox(
        height: 22,
        width: 22,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(textColor),
        ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 30,
            height: 22,
            child: icon,
          ),
          SizedBox(width: AppSpacing.spacingXs),
          Flexible(
            child: Text(
              text,
              style: AppTextStyles.titleMediumM.copyWith(
                color: textColor,
                fontWeight: FontWeight.w500,
                fontSize: 16,
                height: 22 / 16, // line-height: 22px
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      );
    }

    return Text(
      text,
      style: AppTextStyles.titleMediumM.copyWith(
        color: textColor,
      ),
      overflow: TextOverflow.ellipsis,
    );
  }
}

// Extension for easy button usage
extension AppButtonExtension on Widget {
  Widget withGap(double gap) {
    return Padding(
      padding: EdgeInsets.only(bottom: gap),
      child: this,
    );
  }
}
