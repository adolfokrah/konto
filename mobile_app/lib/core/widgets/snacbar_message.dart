import 'package:Hoga/core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/theme/text_styles.dart';

enum SnackBarType { success, error, warning, info }

class AppSnackBar {
  static void show(
    BuildContext context, {
    required String message,
    SnackBarType type = SnackBarType.info,
    Duration duration = const Duration(seconds: 3),
    String? actionLabel,
    VoidCallback? onActionPressed,
    VoidCallback? onTap,
  }) {
    final color = _getColorForType(type);
    final icon = _getIconForType(type);

    // Try to use Overlay to show snackbar above everything including bottom sheets
    try {
      final overlayState = Overlay.of(context, rootOverlay: true);
      _showOverlaySnackBar(
        overlayState,
        message: message,
        color: color,
        icon: icon,
        duration: duration,
        actionLabel: actionLabel,
        onActionPressed: onActionPressed,
        onTap: onTap,
      );
      return;
    } catch (e) {
      debugPrint('Failed to use overlay for snackbar: $e');
    }

    // Fallback to regular ScaffoldMessenger with floating behavior
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: AppColors.onPrimaryWhite, size: 16),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: TextStyles.titleRegularM.copyWith(
                  color: AppColors.onPrimaryWhite,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.navy,
        duration: duration,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: const EdgeInsets.all(16),
        action:
            actionLabel != null
                ? SnackBarAction(
                  label: actionLabel,
                  textColor: AppColors.onPrimaryWhite,
                  onPressed: onActionPressed ?? () {},
                )
                : null,
      ),
    );
  }

  static void showSuccess(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
    String? actionLabel,
    VoidCallback? onActionPressed,
  }) {
    show(
      context,
      message: message,
      type: SnackBarType.success,
      duration: duration,
      actionLabel: actionLabel,
      onActionPressed: onActionPressed,
    );
  }

  static void showError(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 4),
    String? actionLabel,
    VoidCallback? onActionPressed,
  }) {
    show(
      context,
      message: message,
      type: SnackBarType.error,
      duration: duration,
      actionLabel: actionLabel,
      onActionPressed: onActionPressed,
    );
  }

  static void showWarning(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
    String? actionLabel,
    VoidCallback? onActionPressed,
  }) {
    show(
      context,
      message: message,
      type: SnackBarType.warning,
      duration: duration,
      actionLabel: actionLabel,
      onActionPressed: onActionPressed,
    );
  }

  static void showInfo(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
    String? actionLabel,
    VoidCallback? onActionPressed,
    VoidCallback? onTap,
  }) {
    show(
      context,
      message: message,
      type: SnackBarType.info,
      duration: duration,
      actionLabel: actionLabel,
      onActionPressed: onActionPressed,
      onTap: onTap,
    );
  }

  static Color _getColorForType(SnackBarType type) {
    switch (type) {
      case SnackBarType.success:
        return AppColors.positive;
      case SnackBarType.error:
        return AppColors.negative;
      case SnackBarType.warning:
        return AppColors.pending;
      case SnackBarType.info:
        return AppColors.info;
    }
  }

  static IconData _getIconForType(SnackBarType type) {
    switch (type) {
      case SnackBarType.success:
        return Icons.check_circle;
      case SnackBarType.error:
        return Icons.error;
      case SnackBarType.warning:
        return Icons.warning;
      case SnackBarType.info:
        return Icons.info;
    }
  }

  /// Shows a snackbar using overlay to appear above bottom sheets
  static void _showOverlaySnackBar(
    OverlayState overlayState, {
    required String message,
    required Color color,
    required IconData icon,
    required Duration duration,
    String? actionLabel,
    VoidCallback? onActionPressed,
    VoidCallback? onTap,
  }) {
    late OverlayEntry overlayEntry;

    overlayEntry = OverlayEntry(
      builder:
          (context) => Positioned(
            bottom: 50,
            left: 16,
            right: 16,
            child: GestureDetector(
              onTap:
                  onTap != null
                      ? () {
                        overlayEntry.remove();
                        onTap();
                      }
                      : null,
              child: Material(
                color: Colors.transparent,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.navy,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: color,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          icon,
                          color: AppColors.onPrimaryWhite,
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          message,
                          style: TextStyles.titleRegularM.copyWith(
                            color: AppColors.onPrimaryWhite,
                          ),
                        ),
                      ),
                      if (actionLabel != null)
                        TextButton(
                          onPressed: () {
                            overlayEntry.remove();
                            onActionPressed?.call();
                          },
                          child: Text(
                            actionLabel,
                            style: TextStyle(color: AppColors.onPrimaryWhite),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
    );

    overlayState.insert(overlayEntry);

    // Auto-remove after duration
    Future.delayed(duration, () {
      if (overlayEntry.mounted) {
        overlayEntry.remove();
      }
    });
  }
}
