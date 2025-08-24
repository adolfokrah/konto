import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/drag_handle.dart';

/// A generic alert bottom sheet that displays a title, message, and action buttons
class AlertBottomSheet extends StatelessWidget {
  final String title;
  final String message;
  final String? cancelText;
  final String? confirmText;
  final VoidCallback? onCancel;
  final VoidCallback? onConfirm;
  final Color? confirmButtonColor;
  final Color? confirmTextColor;
  final bool isDestructive;

  const AlertBottomSheet({
    super.key,
    required this.title,
    required this.message,
    this.cancelText,
    this.confirmText,
    this.onCancel,
    this.onConfirm,
    this.confirmButtonColor,
    this.confirmTextColor,
    this.isDestructive = false,
  });

  /// Shows the alert bottom sheet
  static Future<bool?> show({
    required BuildContext context,
    required String title,
    required String message,
    String? cancelText,
    String? confirmText,
    VoidCallback? onCancel,
    VoidCallback? onConfirm,
    Color? confirmButtonColor,
    Color? confirmTextColor,
    bool isDestructive = false,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      builder: (BuildContext context) {
        return AlertBottomSheet(
          title: title,
          message: message,
          cancelText: cancelText,
          confirmText: confirmText,
          onCancel: onCancel,
          onConfirm: onConfirm,
          confirmButtonColor: confirmButtonColor,
          confirmTextColor: confirmTextColor,
          isDestructive: isDestructive,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppRadius.radiusM),
          topRight: Radius.circular(AppRadius.radiusM),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingL),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          const Center(child: DragHandle()),
          const SizedBox(height: AppSpacing.spacingL),

          // Title
          Text(title, style: TextStyles.titleBoldLg),
          const SizedBox(height: AppSpacing.spacingM),

          // Message
          Text(
            message,
            style: TextStyles.titleMedium.copyWith(
              color: Theme.of(
                context,
              ).textTheme.bodyMedium?.color?.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(height: AppSpacing.spacingL),

          // Action buttons
          Row(
            children: [
              // Cancel button
              Expanded(
                child: AppButton.outlined(
                  text: cancelText ?? 'Cancel',
                  onPressed: () {
                    Navigator.of(context).pop(false);
                    onCancel?.call();
                  },
                ),
              ),
              const SizedBox(width: AppSpacing.spacingM),

              // Confirm button
              Expanded(
                child: AppButton(
                  text: confirmText ?? 'Continue',
                  onPressed: () {
                    Navigator.of(context).pop(true);
                    onConfirm?.call();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.spacingM),
        ],
      ),
    );
  }
}
