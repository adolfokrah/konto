import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_spacing.dart';

/// Reusable action button used inside notification list items (Accept, Decline, etc.).
/// Wraps a tap area with consistent padding, background color and text styling.
class NotificationActionButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final Color? backgroundColor;
  final Color? textColor;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final bool enabled;
  final bool dense;

  const NotificationActionButton({
    super.key,
    required this.label,
    required this.onTap,
    this.backgroundColor,
    this.textColor,
    this.padding,
    this.borderRadius = 4.0,
    this.enabled = true,
    this.dense = true,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBg =
        backgroundColor ?? Theme.of(context).colorScheme.primary;
    final effectivePadding =
        padding ??
        EdgeInsets.only(
          top: AppSpacing.spacingXs,
          right: dense ? AppSpacing.spacingM : AppSpacing.spacingL,
        );

    return Opacity(
      opacity: enabled ? 1.0 : 0.5,
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(borderRadius),
        child: Container(
          padding: effectivePadding,
          decoration: BoxDecoration(
            color: effectiveBg,
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: textColor ?? Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}
