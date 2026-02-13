import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/widgets/alert_banner.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/route.dart';

/// A widget that displays contextual alerts for jar creators based on missing information
/// Shows one alert at a time in priority order:
/// 1. Missing jar description
/// 2. Missing thank you message
/// 3. Missing withdrawal account
/// 4. KYC not verified or in review
class JarCompletionAlert extends StatelessWidget {
  final JarSummaryModel jarData;

  const JarCompletionAlert({super.key, required this.jarData});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        if (authState is! AuthAuthenticated) {
          return const SizedBox.shrink();
        }

        final user = authState.user;
        final bool isCreator = jarData.creator.id == user.id;

        // Only show alerts for jar creators
        if (!isCreator) {
          return const SizedBox.shrink();
        }

        // Check conditions and prioritize alerts
        // 1. No jar description (Highest Priority)
        if (jarData.description == null ||
            jarData.description!.trim().isEmpty) {
          return Alert(
            message:
                'Every jar holds a story worth sharing. Add a short description to tell yours. Tap to begin.',
            onTap: () {
              Navigator.pushNamed(context, AppRoutes.jarDescriptionEdit);
            },
          );
        }

        // 2. No thank you message
        if (jarData.thankYouMessage == null ||
            jarData.thankYouMessage!.trim().isEmpty) {
          return Alert(
            message:
                'Add a personalized thank you message to show appreciation to your contributors. Tap to add a thank you message.',
            onTap: () {
              Navigator.pushNamed(context, AppRoutes.jarThankYouMessageEdit);
            },
          );
        }

        // 3. No withdrawal account set
        if (user.accountNumber == null ||
            user.accountNumber!.trim().isEmpty ||
            user.bank == null ||
            user.bank!.trim().isEmpty ||
            user.accountHolder == null ||
            user.accountHolder!.trim().isEmpty) {
          return Alert(
            message:
                'Set up your withdrawal account to receive funds from your jar. Tap to add withdrawal details.',
            onTap: () {
              Navigator.pushNamed(context, AppRoutes.withdrawalAccount);
            },
          );
        }

        // 4. KYC not verified
        if (user.kycStatus == 'none') {
          return Alert(
            message:
                'Verify your identity to transfer funds from your jar. Tap to start verification.',
            onTap: () {
              Navigator.pushNamed(context, AppRoutes.kycView);
            },
          );
        }

        // 5. KYC in review (Lowest Priority)
        if (user.kycStatus == 'in_review') {
          return Alert(
            message:
                'Your identity verification is under review. This usually takes 24 hours. We\'ll notify you once complete.',
            onTap: null, // Non-clickable, just informational
          );
        }

        // All conditions met - no alert needed
        return const SizedBox.shrink();
      },
    );
  }
}
