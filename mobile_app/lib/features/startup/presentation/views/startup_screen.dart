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
  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthBloc>().add(AutoLoginRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (_hasNavigated) return;

          if (state is AuthAuthenticated) {
            _hasNavigated = true;
            Navigator.of(context).pushReplacementNamed(AppRoutes.jarDetail);
          } else if (state is AuthInitial) {
            _hasNavigated = true;
            Navigator.of(context).pushReplacementNamed(AppRoutes.onboarding);
          }
        },
        child: Center(
          child: CircularProgressIndicator(
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}
