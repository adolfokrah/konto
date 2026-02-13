import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';

class KycView extends StatelessWidget {
  const KycView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: Text('Verify your identity', style: TextStyles.titleMediumLg),
      ),
      body: BlocConsumer<KycBloc, KycState>(
        listener: (context, state) {
          if (state is KycSuccess) {
            // Reload user data to get updated KYC status
            context.read<AuthBloc>().add(AutoLoginRequested());

            // Show success message
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'KYC session created successfully! Opening verification page...',
                ),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is KycFailure) {
            // Show error message
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          return BlocBuilder<AuthBloc, AuthState>(
            builder: (context, authState) {
              // Check user's KYC status
              String? kycStatus;
              if (authState is AuthAuthenticated) {
                kycStatus = authState.user.kycStatus;
              }

              // If user is already KYC verified, don't show any KYC screens
              // They should be navigated elsewhere in the app
              if (kycStatus == 'verified') {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.spacingM),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle, size: 64, color: Colors.green),
                        const SizedBox(height: 24),
                        Text(
                          'KYC Verification Complete',
                          style: TextStyles.titleBoldLg,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Your identity has been successfully verified. You can now create jars and use all app features.',
                          style: TextStyles.titleRegularSm,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              }

              // Show in_review screen if KYC status is in_review (for unverified users)
              if (kycStatus == 'in_review') {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.spacingM),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.hourglass_empty,
                          size: 64,
                          color: Colors.orange,
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'KYC Verification Pending',
                          style: TextStyles.titleBoldLg,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Your KYC verification is currently being processed. We will notify you once it\'s complete.',
                          style: TextStyles.titleRegularSm,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'This usually takes 24 hours.',
                          style: TextStyles.titleRegularSm.copyWith(
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              }

              // Show verification form for unverified users (null, 'failed', or other statuses)
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.verified_user, size: 64),
                      const SizedBox(height: 24),
                      Text(
                        'In order to transfer your jar balance, you need to verify your account.',
                        style: TextStyles.titleRegularSm,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Please tap the button below to start your account verification.',
                        style: TextStyles.titleRegularSm,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      AppButton.filled(
                        onPressed:
                            state is KycInProgress
                                ? null
                                : () {
                                  // Trigger the RequestKycSession event
                                  context.read<KycBloc>().add(
                                    RequestKycSession(),
                                  );
                                },
                        text:
                            state is KycInProgress
                                ? 'Processing...'
                                : 'Verify my Identity',
                        isLoading: state is KycInProgress,
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
