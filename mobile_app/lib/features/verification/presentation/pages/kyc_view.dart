import 'package:Hoga/route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/authentication/presentation/widgets/auth_widgets.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:go_router/go_router.dart';

class KycView extends StatelessWidget {
  const KycView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<KycBloc, KycState>(
      listener: (context, state) {
        if (state is KycSuccess) {
          // Reload user data to get updated KYC status
          context.read<AuthBloc>().add(AutoLoginRequested());

          AppSnackBar.showSuccess(
            context,
            message: 'Identity verified successfully!',
          );
          context.pop();
        } else if (state is KycInReview) {
          // Don't reload auth here - verification is still in progress.
          // KYC status will update via webhook when verification completes.
        } else if (state is KycFailure) {
          AppSnackBar.showError(context, message: state.errorMessage);
        }
      },
      builder: (context, state) {
        return BlocBuilder<AuthBloc, AuthState>(
          builder: (context, authState) {
            // Check user's KYC status
            String? kycStatus;
            // Organizations also need business verification (KYB) after KYC.
            bool needsKyb = false;
            if (authState is AuthAuthenticated) {
              kycStatus = authState.user.kycStatus;
              needsKyb =
                  authState.user.isOrganization &&
                  authState.user.kybStatus != 'approved';
            }

            if (kycStatus == 'verified') {
              return _VerifiedView(needsKyb: needsKyb);
            }
            if (kycStatus == 'in_review') {
              return const _InReviewView();
            }
            // Unverified users (null, 'none', or any other status)
            return _StartView(state: state);
          },
        );
      },
    );
  }
}

/// Not started: what's needed, then one button.
class _StartView extends StatelessWidget {
  final KycState state;
  const _StartView({required this.state});

  @override
  Widget build(BuildContext context) {
    final busy = state is KycInProgress;
    return Scaffold(
      backgroundColor: AppColors.surfaceWhite,
      appBar: AuthTopBar(close: true, background: AppColors.surfaceWhite),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const DsIconTile(
              Icons.verified_user_outlined,
              tone: DsTone.info,
              size: 64,
            ),
            const SizedBox(height: 16),
            const AuthHeader(
              title: 'Verify your ID to start collecting',
              subtitle: 'Required by Bank of Ghana rules for payment apps.',
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: AppColors.fill,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  _NeedRow(Icons.badge_outlined, 'Ghana Card or passport'),
                  Divider(height: 1, color: AppColors.line),
                  _NeedRow(Icons.photo_camera_outlined, 'A quick selfie'),
                  Divider(height: 1, color: AppColors.line),
                  _NeedRow(Icons.schedule_rounded, 'Review within 24 hours'),
                ],
              ),
            ),
            if (state is KycFailure) ...[
              const SizedBox(height: 14),
              DsNote(
                tone: DsTone.negative,
                icon: Icons.error_outline_rounded,
                title: "We couldn't start verification",
                text: (state as KycFailure).errorMessage,
              ),
            ],
          ],
        ),
      ),
      bottomNavigationBar: AuthFooter(
        background: AppColors.surfaceWhite,
        children: [
          AppButton.filled(
            onPressed:
                busy
                    ? null
                    : () {
                      // Trigger the RequestKycSession event
                      context.read<KycBloc>().add(RequestKycSession());
                    },
            text: busy ? 'Processing...' : 'Start · about 3 min',
            isLoading: busy,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.lock_outline_rounded,
                size: 13,
                color: AppColors.muted,
              ),
              SizedBox(width: 6),
              Flexible(
                child: Text(
                  'Encrypted and handled by our ID partner',
                  style: DsText.caption,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NeedRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _NeedRow(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: AppColors.surfaceWhite,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: AppColors.navy),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: DsText.rowTitle.copyWith(fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

/// In review: step list with the manual review as the current step.
class _InReviewView extends StatelessWidget {
  const _InReviewView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: const AuthTopBar(title: 'Verification'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          DsCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text('Identity check', style: DsText.section),
                    ),
                    DsTag('In review', tone: DsTone.pending),
                  ],
                ),
                const SizedBox(height: 16),
                const DsSteps(
                  current: 2,
                  steps: [
                    ('Ghana Card uploaded', null),
                    ('Selfie matched', null),
                    ('Manual review', 'Usually under 24 hours'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const DsNote(
            tone: DsTone.neutral,
            text:
                "You can set up jars now. Payments open as soon as you're "
                'approved.',
          ),
          const SizedBox(height: 12),
          DsCard(
            color: AppColors.positiveSoft,
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceWhite,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.verified_user_outlined,
                    color: AppColors.positive,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'When approved',
                        style: DsText.rowTitle.copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'Your status changes to "Verified" here and on your profile.',
                        style: DsText.caption,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Verified: success state; organizations continue to business verification.
class _VerifiedView extends StatelessWidget {
  final bool needsKyb;
  const _VerifiedView({required this.needsKyb});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceWhite,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const DsIconTile(
                Icons.verified_user_outlined,
                tone: DsTone.positive,
                size: 64,
              ),
              const SizedBox(height: 14),
              AuthHeader(
                title: "You're verified",
                subtitle:
                    needsKyb
                        ? 'Your identity has been verified. Next, verify your '
                            'organization so your jars can start collecting.'
                        : 'Your jars can take payments and transfer money. '
                            'Thanks for keeping Hogapay safe.',
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: AuthFooter(
        background: AppColors.surfaceWhite,
        children: [
          if (needsKyb)
            AppButton.filled(
              text: 'Continue to business verification',
              onPressed: () => context.pushReplacement(AppRoutes.businessKyb),
            )
          else
            AppButton.filled(
              text: 'Go to my jars',
              onPressed: () => context.go(AppRoutes.jars),
            ),
        ],
      ),
    );
  }
}
