import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:flutter/material.dart';

class Alert extends StatelessWidget {
  final String message;
  final VoidCallback? onTap;
  const Alert({super.key, required this.message, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: AppSpacing.spacingM,
        horizontal: AppSpacing.spacingXs,
      ),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary,
            borderRadius: BorderRadius.circular(AppRadius.radiusM),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline, size: 15, color: Colors.white),
              SizedBox(height: 3),
              Text(
                message,
                style: AppTextStyles.titleRegularXs.copyWith(
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
