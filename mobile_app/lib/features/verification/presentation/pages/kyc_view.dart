import 'package:Hoga/core/widgets/feedback_action_button.dart';
import 'package:Hoga/core/widgets/user_avatar_small.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';

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
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is AuthAuthenticated) {
            final user = state.user;
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
                      onPressed: () async {
                        Navigator.pushNamed(context, AppRoutes.kycIntroView);
                      },
                      text: 'Verify my Identity',
                    ),
                  ],
                ),
              ),
            );
          }
          return Center(child: CircularProgressIndicator());
        },
      ),
    );
  }
}
