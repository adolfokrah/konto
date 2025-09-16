import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';

class AppSmallButton extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? textColor;
  final EdgeInsetsGeometry? padding;

  const AppSmallButton({
    super.key,
    required this.child,
    this.onPressed,
    this.backgroundColor,
    this.textColor,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        elevation: 0,
        backgroundColor:
            backgroundColor ?? Theme.of(context).colorScheme.primary,
        foregroundColor: textColor ?? Theme.of(context).colorScheme.onSurface,
        padding:
            padding ??
            const EdgeInsets.symmetric(
              vertical: AppSpacing.spacingXs,
              horizontal: AppSpacing.spacingL,
            ),
        minimumSize: Size.zero, // Allow button to be smaller than default
        tapTargetSize:
            MaterialTapTargetSize.shrinkWrap, // Removes extra padding
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.radiusL),
        ),
      ),
      child: child,
    );
  }
}
