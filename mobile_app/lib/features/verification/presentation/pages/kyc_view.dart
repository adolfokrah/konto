import 'package:Hoga/core/widgets/feedback_action_button.dart';
import 'package:Hoga/core/widgets/user_avatar_small.dart';
import 'package:Hoga/l10n/app_localizations.dart';
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
    final localizations = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        title: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            String firstName = localizations.user;
            if (state is AuthAuthenticated) {
              // Extract first name from full name
              final fullName = state.user.fullName;
              firstName = fullName.split(' ').first;
            }
            return Text(
              localizations.hiUser(firstName),
              style: TextStyles.titleMediumLg,
            );
          },
        ),
        actions: [
          const FeedbackActionButton(),
          Padding(
            padding: const EdgeInsets.all(10.0),
            child: UserAvatarSmall(
              backgroundColor:
                  isDark ? Theme.of(context).colorScheme.primary : Colors.white,
              radius: 20,
            ),
          ),
        ],
      ),
      body: BlocConsumer<KycBloc, KycState>(
        listener: (context, state) {
          if (state is KycSuccess) {
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

              // Show pending screen if KYC status is pending
              if (kycStatus == 'pending') {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
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
                          'This usually takes 1-3 business days.',
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

              // Show verification form if not pending
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.verified_user, size: 64),
                      const SizedBox(height: 24),
                      Text(
                        'In order to create a jar, please complete the KYC verification process.',
                        style: TextStyles.titleRegularSm,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Please tap the button below to start your KYC verification.',
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
