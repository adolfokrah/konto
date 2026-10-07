import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/constants/button_variants.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
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
    return AccSheet(
      children: [
        const AccSheetHeader('Review account'),
        Container(
          decoration: BoxDecoration(
            color: AppColors.cream,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              DsKeyValue('Account name', verificationData.name),
              const Divider(height: 1, color: AppColors.line),
              DsKeyValue('Phone number', verificationData.phoneNumber),
            ],
          ),
        ),
        Row(
          spacing: 10,
          children: [
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
            Expanded(
              child: AppButton(
                text: 'Confirm account',
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
    );
  }
}
