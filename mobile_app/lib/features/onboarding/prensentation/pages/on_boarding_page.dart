import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/button_variants.dart';
import 'package:konto/core/constants/localized_onboarding_data.dart';
import 'package:konto/core/utils/haptic_utils.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:konto/features/onboarding/prensentation/widgets/onboarding_description.dart';
import 'package:konto/features/onboarding/prensentation/widgets/onboarding_progress_indicator.dart';
import 'package:konto/features/onboarding/prensentation/widgets/onboarding_slider.dart';
import 'package:konto/features/onboarding/prensentation/widgets/onboarding_title.dart';

class OnBoardingPage extends StatelessWidget {
  const OnBoardingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<OnboardingBloc, OnboardingState>(
      builder: (context, state) {
        final currentPage = state is OnboardingPageState ? state.currentPage : 0;
        final localizedOnBoardingData = LocalizedOnboardingData.getOnboardingData(context);
        
        return Scaffold(
          backgroundColor: localizedOnBoardingData[currentPage].backgroundColor,
          body: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Progress indicator
                OnBoardingProgressIndicator(currentPage: currentPage),
                const SizedBox(height: AppSpacing.spacingM),
                OnboardingTitle(currentPage: currentPage),
                const SizedBox(height: AppSpacing.spacingM),
                OnBoardingSlider(
                  currentPage: currentPage,
                  onPageChanged: (index) {
                    context.read<OnboardingBloc>().add(PageChanged(index));
                    HapticUtils.heavy();
                  },
                ),
                const SizedBox(height: AppSpacing.spacingM),
                OnboardingDescription(currentPage: currentPage),
                const SizedBox(height: AppSpacing.spacingL),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
                  child: AppButton(
                    borderColor: AppColors.black,
                    backgroundColor: AppColors.black,
                    textColor: localizedOnBoardingData[currentPage].buttonVariant == ButtonVariant.fill  ? AppColors.primaryLight : AppColors.black,
                    text: localizedOnBoardingData[currentPage].buttonText,
                    variant: localizedOnBoardingData[currentPage].buttonVariant,
                    onPressed: () {
                      // Handle button press - go to next page or complete onboarding
                      if (currentPage < localizedOnBoardingData.length - 1) {
                        context.read<OnboardingBloc>().add(PageChanged(currentPage + 1));
                      } else {
                        context.read<OnboardingBloc>().add(OnboardingFinished());
                      }
                    },
                  ),
                ),
                const SizedBox(height: AppSpacing.spacingM),
              ],
            ),
          ),
        );
      },
    );
  }
}
