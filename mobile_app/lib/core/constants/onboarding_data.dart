import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_images.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/features/onboarding/data/models/onboarding_data.dart'
    show OnBoardingData;

final List<OnBoardingData> onBoardingData = [
  OnBoardingData(
    title: "Create with\nPurpose",
    description:
        "Set up a jar in seconds to collect funds for weddings, funerals, birthdays, etc.",
    backgroundColor: AppColors.primaryLight,
    buttonVariant: ButtonVariant.fill,
    buttonText: "Next",
    illustration: AppImages.onboardingSlide1,
  ),
  OnBoardingData(
    title: "Give with\nConfidence",
    description:
        "Support loved ones with secure and transparent contributions.",
    backgroundColor: AppColors.secondaryGreen,
    buttonVariant: ButtonVariant.fill,
    buttonText: "Next",
    illustration: AppImages.onboardingSlide2,
  ),
  OnBoardingData(
    title: "Track Every\nContribution",
    description:
        "See who contributed, how much, and get notified when you hit your goal.",
    backgroundColor: AppColors.backgroundLight,
    buttonVariant: ButtonVariant.outline,
    buttonText: "Continue",
    illustration: AppImages.onboardingSlide3,
  ),
];
