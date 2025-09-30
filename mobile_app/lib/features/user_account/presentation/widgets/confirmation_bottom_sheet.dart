import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/button_variants.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';

/// Generic confirmation bottom sheet widget
class ConfirmationBottomSheet extends StatelessWidget {
  final String title;
  final String description;
  final String confirmButtonText;
  final String cancelButtonText;
  final VoidCallback onConfirm;
  final VoidCallback? onCancel;
  final Color? confirmButtonColor;
  final bool isDangerous;

  const ConfirmationBottomSheet({
    super.key,
    required this.title,
    required this.description,
    required this.confirmButtonText,
    required this.onConfirm,
    this.cancelButtonText = 'Cancel',
    this.onCancel,
    this.confirmButtonColor,
    this.isDangerous = false,
  });

  /// Show the confirmation bottom sheet
  static void show(
    BuildContext context, {
    required String title,
    required String description,
    required String confirmButtonText,
    required VoidCallback onConfirm,
    String cancelButtonText = 'Cancel',
    VoidCallback? onCancel,
    Color? confirmButtonColor,
    bool isDangerous = false,
  }) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => ConfirmationBottomSheet(
            title: title,
            description: description,
            confirmButtonText: confirmButtonText,
            onConfirm: onConfirm,
            cancelButtonText: cancelButtonText,
            onCancel: onCancel,
            confirmButtonColor: confirmButtonColor,
            isDangerous: isDangerous,
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color:
            isDark ? Theme.of(context).scaffoldBackgroundColor : Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppRadius.radiusM),
          topRight: Radius.circular(AppRadius.radiusM),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingM),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          DragHandle(),

          // Title
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              title,
              style: TextStyles.titleMediumLg,
              textAlign: TextAlign.center,
            ),
          ),

          const SizedBox(height: AppSpacing.spacingM),

          // Description
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              description,
              style: TextStyles.titleRegularM,
              textAlign: TextAlign.center,
            ),
          ),

          const SizedBox(height: AppSpacing.spacingM),

          // Action buttons
          Row(
            children: [
              // Cancel button
              Expanded(
                child: AppButton(
                  text: cancelButtonText,
                  variant: ButtonVariant.outline,
                  onPressed: () {
                    Navigator.pop(context);
                    if (onCancel != null) {
                      onCancel!();
                    }
                  },
                ),
              ),

              const SizedBox(width: AppSpacing.spacingM),

              // Confirm button
              Expanded(
                child: AppButton(
                  text: confirmButtonText,
                  variant: ButtonVariant.fill,
                  onPressed: () {
                    Navigator.pop(context);
                    onConfirm();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
