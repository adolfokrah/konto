import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/localized_onboarding_data.dart';
import 'package:Hoga/core/theme/text_styles.dart';

class OnboardingDescription extends StatelessWidget {
  final int currentPage;
  const OnboardingDescription({super.key, required this.currentPage});

  @override
  Widget build(BuildContext context) {
    final localizedOnBoardingData = LocalizedOnboardingData.getOnboardingData(
      context,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        layoutBuilder: (Widget? currentChild, List<Widget> previousChildren) {
          return Stack(
            alignment: Alignment.centerLeft,
            children: <Widget>[
              ...previousChildren,
              if (currentChild != null) currentChild,
            ],
          );
        },
        transitionBuilder: (Widget child, Animation<double> animation) {
          return FadeTransition(opacity: animation, child: child);
        },
        child: Text(
          localizedOnBoardingData[currentPage].description,
          key: ValueKey<int>(currentPage),
          style: TextStyles.headingTwo.copyWith(color: AppColors.black),
        ),
      ),
    );
  }
}
