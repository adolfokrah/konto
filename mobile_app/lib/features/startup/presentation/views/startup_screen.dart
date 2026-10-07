import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';

class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key});

  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  Timer? _timeoutTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthBloc>().add(AutoLoginRequested());

      // Safety timeout: if auth takes too long, go to onboarding
      _timeoutTimer = Timer(const Duration(seconds: 10), () {
        if (mounted) {
          GoRouter.of(context).go(AppRoutes.onboarding);
        }
      });
    });
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthInitial) {
          _timeoutTimer?.cancel();
          GoRouter.of(context).go(AppRoutes.onboarding);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.cream,
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(28),
                        child: Image.asset(
                          'assets/images/logo_icon.png',
                          width: 112,
                          height: 112,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 26),
                      Image.asset('assets/images/logo.png', height: 28),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.only(bottom: 24),
                child: Text(
                  'Licensed payments by Eganow',
                  style: DsText.caption,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
