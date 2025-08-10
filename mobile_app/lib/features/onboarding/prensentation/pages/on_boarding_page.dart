import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/onboarding_data.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/features/onboarding/prensentation/widgets/onboarding_description.dart';
import 'package:konto/features/onboarding/prensentation/widgets/onboarding_progress_indicator.dart';
import 'package:konto/features/onboarding/prensentation/widgets/onboarding_slider.dart';
import 'package:konto/features/onboarding/prensentation/widgets/onboarding_title.dart';

class OnBoardingPage extends StatelessWidget {
  final currentPage = 0; // Placeholder for current page index
  const OnBoardingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: onBoardingData[0].backgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress indicator
            OnBoardingProgressIndicator(currentPage: currentPage),
            const SizedBox(height: AppSpacing.spacingM),
            OnboardingTitle(currentPage: currentPage),
            const SizedBox(height: AppSpacing.spacingM),
            OnBoardingSlider(currentPage: currentPage,),
            const SizedBox(height: AppSpacing.spacingM),
            OnboardingDescription(currentPage: currentPage,),
            const SizedBox(height: AppSpacing.spacingM),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
              child: AppButton(
              text: onBoardingData[0].buttonText,
              variant: onBoardingData[0].buttonVariant,
              onPressed: () {
                // Handle button press
              }),
            ),
            const SizedBox(height: AppSpacing.spacingM),
          ],
        ),
      ),
    );
  }
}
