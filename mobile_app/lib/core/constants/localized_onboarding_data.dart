import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/features/onboarding/data/models/onboarding_data.dart'
    show OnBoardingData;
import 'package:konto/l10n/app_localizations.dart';

class LocalizedOnboardingData {
  static List<OnBoardingData> getOnboardingData(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return [
      OnBoardingData(
        title: localizations.onboardingTitle1,
        description: localizations.onboardingDescription1,
        backgroundColor: AppColors.primaryLight,
        buttonVariant: ButtonVariant.fill,
        buttonText: localizations.next,
        illustration: "assets/images/onboarding_slide_1.png",
      ),
      OnBoardingData(
        title: localizations.onboardingTitle2,
        description: localizations.onboardingDescription2,
        backgroundColor: AppColors.secondaryGreen,
        buttonVariant: ButtonVariant.fill,
        buttonText: localizations.next,
        illustration: "assets/images/onboarding_slide_2.png",
      ),
      OnBoardingData(
        title: localizations.onboardingTitle3,
        description: localizations.onboardingDescription3,
        backgroundColor: AppColors.backgroundLight,
        buttonVariant: ButtonVariant.outline,
        buttonText: localizations.continueText,
        illustration: "assets/images/onboarding_slide_3.png",
      ),
    ];
  }
}
