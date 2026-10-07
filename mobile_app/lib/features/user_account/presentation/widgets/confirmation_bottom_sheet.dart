import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';

/// Generic confirmation bottom sheet (Log out, Close account, Remove account):
/// icon tile, title, one line of copy, primary action and a ghost cancel.
class ConfirmationBottomSheet extends StatelessWidget {
  final String title;
  final String description;
  final String confirmButtonText;
  final String cancelButtonText;
  final VoidCallback onConfirm;
  final VoidCallback? onCancel;
  final Color? confirmButtonColor;

  /// Destructive actions get a red icon tile and a red primary button.
  final bool isDangerous;
  final IconData? icon;

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
    this.icon,
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
    IconData? icon,
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
            icon: icon,
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final buttonColor =
        confirmButtonColor ?? (isDangerous ? AppColors.negative : null);
    return AccSheet(
      children: [
        if (icon != null)
          Align(
            alignment: Alignment.centerLeft,
            child: DsIconTile(
              icon!,
              size: 52,
              tone: isDangerous ? DsTone.negative : DsTone.neutral,
            ),
          ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 6,
          children: [
            Text(title, style: AccText.h2),
            Text(description, style: DsText.small),
          ],
        ),
        Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 4,
          children: [
            AppButton.filled(
              text: confirmButtonText,
              backgroundColor: buttonColor,
              textColor: buttonColor != null ? AppColors.surfaceWhite : null,
              onPressed: () {
                Navigator.pop(context);
                onConfirm();
              },
            ),
            SizedBox(
              width: double.infinity,
              child: AccGhostButton(
                text: cancelButtonText,
                onPressed: () {
                  Navigator.pop(context);
                  onCancel?.call();
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}
