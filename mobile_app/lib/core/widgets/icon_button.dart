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

  const AppIconButton({
    super.key,
    required this.onPressed,
    required this.icon,
    this.size,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return IconButton(
      onPressed: enabled ? onPressed : null,
      icon: Icon(icon),
      style: IconButton.styleFrom(
        backgroundColor:
            isDark
                ? Theme.of(context).colorScheme.primary
                : AppColors.surfaceWhite,
        foregroundColor:
            isDark ? Theme.of(context).colorScheme.onSurface : AppColors.black,
        minimumSize: size ?? const Size(55, 55), // Makes button bigger
      ),
    );
  }
}
