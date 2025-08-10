import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/onboarding_data.dart';
import 'package:konto/core/theme/text_styles.dart';

class OnboardingTitle extends StatelessWidget {
  final int currentPage; // Placeholder for current page index
  const OnboardingTitle({super.key, required this.currentPage});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
      child: Text(onBoardingData[currentPage].title, style: TextStyles.headingOne),
    );
  }
}