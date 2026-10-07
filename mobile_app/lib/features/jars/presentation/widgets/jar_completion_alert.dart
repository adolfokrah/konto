import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

/// Setup prompt for jar creators, shown as a single note with progress
/// ("Finish setting up · 3 of 6"). One item at a time, in priority order:
/// 1. Missing jar description
/// 2. Missing thank you message
/// 3. Missing withdrawal account
/// 4. KYC not verified or in review
/// 5. Missing profile photo
/// 6. Missing additional jar photos
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

        final waState = context.watch<WithdrawalAccountsBloc>().state;

        final hasDescription =
            jarData.description != null &&
            jarData.description!.trim().isNotEmpty;
        final hasThankYou =
            jarData.thankYouMessage != null &&
            jarData.thankYouMessage!.trim().isNotEmpty;
        // Source of truth is the user's withdrawal accounts list. Only count it
        // missing once the list has loaded so a cold bloc doesn't flash a false alert.
        final missingPayout =
            waState.status == WithdrawalAccountsStatus.loaded &&
            waState.accounts.isEmpty;
        final verified =
            user.isOrganization
                ? user.kybStatus == 'approved'
                : user.kycStatus == 'verified';
        final hasPhoto = user.photo != null;
        final hasJarPhotos = jarData.images.isNotEmpty;

        final done =
            [
              hasDescription,
              hasThankYou,
              !missingPayout,
              verified,
              hasPhoto,
              hasJarPhotos,
            ].where((d) => d).length;
        final heading = 'Finish setting up · $done of 6';

        Widget note({
          required String text,
          VoidCallback? onTap,
          String? title,
          DsTone tone = DsTone.pending,
          IconData icon = Icons.edit_outlined,
        }) => DsCard(
          // White row card (mockup): tinted icon tile, title, one line, chevron.
          padding: const EdgeInsets.all(14),
          onTap: onTap,
          child: Row(
            children: [
              DsIconTile(icon, tone: tone),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title ?? heading,
                      style: DsText.rowTitle.copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(text, style: DsText.caption),
                  ],
                ),
              ),
              if (onTap != null) ...[
                const SizedBox(width: 8),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: AppColors.faint,
                ),
              ],
            ],
          ),
        );

        // 1. No jar description (Highest Priority)
        if (!hasDescription) {
          return note(
            text: 'Add a description so people know what it\'s for',
            onTap: () => context.push(AppRoutes.jarDescriptionEdit),
          );
        }

        // 2. No thank you message
        if (!hasThankYou) {
          return note(
            text: 'Add a thank-you note contributors see after paying',
            onTap: () => context.push(AppRoutes.jarThankYouMessageEdit),
          );
        }

        // 3. No withdrawal account set.
        if (missingPayout) {
          return note(
            text: 'Add a payout account to receive your money',
            icon: Icons.account_balance_wallet_outlined,
            onTap: () => context.push(AppRoutes.withdrawalAccounts),
          );
        }

        // 4. Individuals: KYC not verified
        if (!user.isOrganization && user.kycStatus == 'none') {
          return note(
            text:
                'Verify your identity to collect and transfer · about 3 minutes',
            icon: Icons.verified_user_outlined,
            onTap: () => context.push(AppRoutes.kycView),
          );
        }

        // 5. Individuals: KYC in review
        if (!user.isOrganization && user.kycStatus == 'in_review') {
          return note(
            title: 'Verification in review',
            text: 'Usually takes 24 hours. We\'ll let you know.',
            tone: DsTone.info,
            icon: Icons.hourglass_top_rounded,
          );
        }

        // 6. Organizations: business verification (KYB) only
        if (user.isOrganization && user.kybStatus != 'approved') {
          final kyb = user.kybStatus;
          if (kyb == 'in_review' || kyb == 'pending' || kyb == 'under-review') {
            return note(
              title: 'Business verification in review',
              text: 'We\'ll notify you once it\'s approved.',
              tone: DsTone.info,
              icon: Icons.hourglass_top_rounded,
            );
          }
          return note(
            text:
                kyb == 'rejected'
                    ? 'Your business verification was not approved. Review and resubmit.'
                    : 'Verify your organization so your jar can start collecting.',
            tone: kyb == 'rejected' ? DsTone.negative : DsTone.pending,
            icon: Icons.business_outlined,
            onTap: () => context.push(AppRoutes.businessKyb),
          );
        }

        // 7. No profile photo
        if (!hasPhoto) {
          return note(
            text: 'Add a profile photo so contributors know it\'s you',
            icon: Icons.account_circle_outlined,
            onTap: () => context.go(AppRoutes.userAccountView),
          );
        }

        // 8. No additional jar photos
        if (!hasJarPhotos) {
          return note(
            text: 'Add photos of what you\'re collecting for',
            icon: Icons.add_photo_alternate_outlined,
            onTap: () => context.push(AppRoutes.jarInfo),
          );
        }

        // All conditions met - no alert needed
        return const SizedBox.shrink();
      },
    );
  }
}
