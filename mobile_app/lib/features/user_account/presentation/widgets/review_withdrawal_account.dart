import 'package:flutter/material.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/constants/button_variants.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/features/user_account/logic/bloc/withdrawal_account_verification_bloc.dart';

/// Bottom sheet widget to display withdrawal account verification success details
class ReviewWithdrawalAccountBottomSheet extends StatelessWidget {
  final WithdrawalAccountVerificationSuccess verificationData;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;

  const ReviewWithdrawalAccountBottomSheet({
    super.key,
    required this.verificationData,
    this.onConfirm,
    this.onCancel,
  });

  /// Show the bottom sheet
  static Future<bool?> show({
    required BuildContext context,
    required WithdrawalAccountVerificationSuccess verificationData,
    VoidCallback? onConfirm,
    VoidCallback? onCancel,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => ReviewWithdrawalAccountBottomSheet(
            verificationData: verificationData,
            onConfirm: onConfirm,
            onCancel: onCancel,
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppRadius.radiusM),
          topRight: Radius.circular(AppRadius.radiusM),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingM),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            const Center(child: DragHandle()),
            const SizedBox(height: AppSpacing.spacingM),

            // Title
            Text('Review Account Details', style: TextStyles.titleBoldLg),
            const SizedBox(height: AppSpacing.spacingXs),

            // Account details card
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Account Name
                _buildDetailRow(
                  label: 'Account Name',
                  value: verificationData.name,
                ),
                const SizedBox(height: AppSpacing.spacingM),

                // Phone Number
                _buildDetailRow(
                  label: 'Phone Number',
                  value: verificationData.phoneNumber,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.spacingL),

            // Action buttons
            Row(
              children: [
                // Cancel button
                Expanded(
                  child: AppButton(
                    text: 'Cancel',
                    variant: ButtonVariant.outline,
                    onPressed: () {
                      Navigator.pop(context, false);
                      onCancel?.call();
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.spacingM),

                // Confirm button
                Expanded(
                  child: AppButton(
                    text: 'Confirm Account',
                    variant: ButtonVariant.fill,
                    onPressed: () {
                      Navigator.pop(context, true);
                      onConfirm?.call();
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow({required String label, required String value}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyles.titleRegularM.copyWith(
            color: AppColors.label,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyles.titleMediumS.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
