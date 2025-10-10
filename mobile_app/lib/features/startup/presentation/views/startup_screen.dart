import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/route.dart';

class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key});

  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      print('🚀 StartupScreen: Initialized, triggering auto login');
      context.read<AuthBloc>().add(AutoLoginRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          print(
            '🚀 StartupScreen: AuthBloc state changed to: ${state.runtimeType}',
          );
          if (state is AuthAuthenticated) {
            print(
              '🚀 StartupScreen: User authenticated, navigating to jar details',
            );
            Navigator.of(context).pushReplacementNamed(AppRoutes.jarDetail);
          } else if (state is AuthInitial) {
            print(
              '🚀 StartupScreen: User not authenticated, navigating to onboarding',
            );
            Navigator.of(context).pushReplacementNamed(AppRoutes.onboarding);
          }
        },
        child: const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
