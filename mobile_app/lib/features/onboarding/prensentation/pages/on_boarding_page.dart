import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/url_launcher_utils.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/button_variants.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:marqueer/marqueer.dart';
import 'package:Hoga/route.dart';

class OnBoardingPage extends StatelessWidget {
  const OnBoardingPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark
              ? Theme.of(context).colorScheme.surface
              : AppColors.primaryLight,
      body: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingXs),
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.spacingL),
            // Test: Simple row to see if images load first
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Auto-scrolling marquee - First row (faster, right to left)
                  SizedBox(
                    height: 200,
                    child: Marqueer(
                      pps: 50, // Pixels per second (faster)
                      direction: MarqueerDirection.rtl,
                      interaction: false,
                      child: Row(
                        children: List.generate(10, (index) {
                          final imageIndex = (index % 5) + 1;
                          return Container(
                            margin: const EdgeInsets.only(right: 12),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.asset(
                                'assets/images/onboarding/image$imageIndex.png',
                                width: 150,
                                height: 200,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    width: 150,
                                    height: 200,
                                    decoration: BoxDecoration(
                                      color: Colors.grey[300],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.image_not_supported,
                                    ),
                                  );
                                },
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Auto-scrolling marquee - Second row (slower, left to right)
                  SizedBox(
                    height: 200,
                    child: Marqueer(
                      pps: 30, // Pixels per second (slower)
                      direction: MarqueerDirection.ltr,
                      interaction: false,
                      child: Row(
                        children: List.generate(10, (index) {
                          final imageIndex = (index % 5) + 6;
                          return Container(
                            margin: const EdgeInsets.only(right: 12),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.asset(
                                'assets/images/onboarding/image$imageIndex.png',
                                width: 150,
                                height: 200,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    width: 150,
                                    height: 200,
                                    decoration: BoxDecoration(
                                      color: Colors.grey[300],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.image_not_supported,
                                    ),
                                  );
                                },
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.spacingXs),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingL,
              ),
              child: Column(
                children: [
                  Text(
                    "Create with purpose",
                    style: AppTextStyles.headingOne,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.spacingXs),
                  Text(
                    "Set up a jar in seconds to collect contributions for weddings, projects, NGOs, trips, funerals, church offerings, etc.",
                    style: AppTextStyles.titleMediumS,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),
                  AppButton(
                    text: "Login",
                    variant: ButtonVariant.fill,
                    onPressed: () {
                      Navigator.of(context).pushNamed(AppRoutes.login);
                    },
                  ),
                  const SizedBox(height: AppSpacing.spacingXs),
                  AppButton(
                    text: "Register",
                    variant: ButtonVariant.outline,
                    onPressed: () {
                      Navigator.of(context).pushNamed(AppRoutes.register);
                    },
                  ),
                  const SizedBox(height: AppSpacing.spacingXs),
                  InkWell(
                    onTap: () {
                      UrlLauncherUtils.launch('https://hogapay.com/about');
                    },
                    child: Text(
                      "About hogapay",
                      style: AppTextStyles.titleMediumS.copyWith(
                        decoration: TextDecoration.underline,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingXs),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
