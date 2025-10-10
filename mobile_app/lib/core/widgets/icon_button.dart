import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';

class AppIconButton extends StatelessWidget {
  /// The callback function when the button is pressed
  final VoidCallback? onPressed;

  /// The icon to display in the button
  final IconData icon;

  /// The size of the button
  final Size? size;

  /// Whether the button is enabled or disabled
  final bool enabled;

  /// Whether to show a loading indicator instead of the icon
  final bool loading;

  final double? opacity;
  const AppIconButton({
    super.key,
    required this.onPressed,
    required this.icon,
    this.size,
    this.enabled = true,
    this.loading = false,
    this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return IconButton(
      onPressed: enabled ? onPressed : null,
      icon:
          loading
              ? SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              )
              : Icon(icon),
      style: IconButton.styleFrom(
        backgroundColor:
            isDark
                ? Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: opacity ?? 1)
                : AppColors.surfaceWhite.withValues(alpha: opacity ?? 1),
        foregroundColor:
            isDark ? Theme.of(context).colorScheme.onSurface : AppColors.black,
        minimumSize: size ?? const Size(50, 50), // Makes button bigger
      ),
    );
  }
}
