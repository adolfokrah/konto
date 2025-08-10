import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/onboarding_data.dart';
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
        
        return Scaffold(
          backgroundColor: onBoardingData[currentPage].backgroundColor,
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
                  },
                ),
                const SizedBox(height: AppSpacing.spacingM),
                OnboardingDescription(currentPage: currentPage),
                const SizedBox(height: AppSpacing.spacingL),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
                  child: AppButton(
                    text: onBoardingData[currentPage].buttonText,
                    variant: onBoardingData[currentPage].buttonVariant,
                    onPressed: () {
                      // Handle button press - go to next page or complete onboarding
                      if (currentPage < onBoardingData.length - 1) {
                        context.read<OnboardingBloc>().add(PageChanged(currentPage + 1));
                      } else {
                        // Last page - complete onboarding (navigate to home or next screen)
                        // TODO: Navigate to home or next screen
                        print('Onboarding completed');
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
