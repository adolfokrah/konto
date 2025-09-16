import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/localized_onboarding_data.dart';

class OnBoardingProgressIndicator extends StatelessWidget {
  final int currentPage; // Placeholder for current page index

  const OnBoardingProgressIndicator({super.key, required this.currentPage});

  @override
  Widget build(BuildContext context) {
    final localizedOnBoardingData = LocalizedOnboardingData.getOnboardingData(
      context,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
      child: Row(
        children: List.generate(
          localizedOnBoardingData.length,
          (index) => Expanded(
            child: Container(
              height: 4,
              margin: EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingXs / 3,
              ),
              decoration: BoxDecoration(
                color:
                    index <= currentPage
                        ? AppColors.black
                        : AppColors.black.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(AppRadius.radiusL),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
