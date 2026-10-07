import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';

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
    final bg = backgroundColor ?? AppColors.navy;
    final fg = textColor ?? AppColors.surfaceWhite;
    return Opacity(
      opacity: enabled ? 1.0 : 0.5,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(9),
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(9),
          child: Padding(
            padding:
                padding ??
                EdgeInsets.symmetric(horizontal: dense ? 11 : 14, vertical: 7),
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Supreme',
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: fg,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
