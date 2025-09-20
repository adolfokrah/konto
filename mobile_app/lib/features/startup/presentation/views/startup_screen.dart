import 'package:Hoga/features/verification/presentation/pages/kyc_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:Hoga/route.dart';

class StartupScreen extends StatelessWidget {
  const StartupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: MultiBlocListener(
        listeners: [
          BlocListener<OnboardingBloc, OnboardingState>(
            listener: (context, state) {
              if (state is! OnboardingCompleted) {
                Navigator.of(
                  context,
                ).pushReplacementNamed(AppRoutes.onboarding);
              } else {
                // Onboarding is completed, now check auth status
                // Trigger auth check if needed
                context.read<AuthBloc>().add(AutoLoginRequested());
              }
            },
          ),
          BlocListener<AuthBloc, AuthState>(
            listener: (context, state) {
              if (state is AuthAuthenticated) {
                Navigator.of(context).pushReplacementNamed(AppRoutes.jarDetail);
              } else if (state is AuthInitial) {
                Navigator.of(context).pushReplacementNamed(AppRoutes.login);
              }
            },
          ),
        ],
        child: Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
