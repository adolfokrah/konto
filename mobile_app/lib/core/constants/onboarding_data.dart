import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/features/onboarding/prensentation/models/onboarding_data.dart' show OnBoardingData;

final List<OnBoardingData> onBoardingData = [
    OnBoardingData(
      title: "Create with\nPurpose",
      description: "Set up a jar in seconds to collect funds for weddings, funerals, birthdays, etc.",
      backgroundColor: AppColors.primaryLight,
      buttonVariant: ButtonVariant.fill,
      buttonText: "Next",
      illustration: "assets/images/onboarding_slide_1.png",
    ),
    OnBoardingData(
      title: "Give with\nConfidence",
      description: "Support loved ones with secure and transparent contributions.",
      backgroundColor: AppColors.secondaryGreen,
      buttonVariant: ButtonVariant.fill,
      buttonText: "Next",
      illustration: "assets/images/onboarding_slide_2.png",
    ),
    OnBoardingData(
      title: "Track Every\nContribution",
      description: "See who contributed, how much, and get notified when you hit your goal.",
      backgroundColor: AppColors.backgroundLight,
       buttonVariant: ButtonVariant.outline,
      buttonText: "Continue",
      illustration: "assets/images/onboarding_slide_3.png",
    ),
  ];