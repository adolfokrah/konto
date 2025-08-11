import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:konto/features/onboarding/prensentation/pages/on_boarding_page.dart';

/// Startup screen that handles onboarding check and auto-login
class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key});

  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  @override
  void initState() {
    super.initState();
    // Trigger onboarding check first
    context.read<OnboardingBloc>().add(CheckOnboardingStatus());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<OnboardingBloc, OnboardingState>(
        listener: (context, onboardingState) {
          // When onboarding check is complete, check for auto-login
          if (onboardingState is OnboardingCompleted) {
            // Onboarding is complete, now check for auto-login
            context.read<AuthBloc>().add(AutoLoginRequested());
          }
        },
        child: BlocBuilder<OnboardingBloc, OnboardingState>(
          builder: (context, onboardingState) {
            // Show onboarding if not completed
            if (onboardingState is OnboardingInitial) {
              return const OnBoardingPage();
            }
            
            // If onboarding is completed, show auth flow or auto-login results
            if (onboardingState is OnboardingCompleted) {
              return BlocBuilder<AuthBloc, AuthState>(
                builder: (context, authState) {
                  // Handle auto-login states
                  if (authState is AutoLoginLoading) {
                    return const _LoadingScreen(message: 'Checking session...');
                  }
                  
                  if (authState is AutoLoginSuccess) {
                    // Auto-login successful, navigate to home
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      Navigator.of(context).pushReplacementNamed('/home');
                    });
                    return const _LoadingScreen(message: 'Welcome back!');
                  }
                  
                  if (authState is AutoLoginFailed) {
                    // Auto-login failed, show login screen
                    return const LoginView();
                  }
                  
                  // Default to login view while checking
                  return const LoginView();
                },
              );
            }
            
            // Default loading state
            return const _LoadingScreen(message: 'Starting up...');
          },
        ),
      ),
    );
  }
}

/// Loading screen component
class _LoadingScreen extends StatelessWidget {
  final String message;
  
  const _LoadingScreen({
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.8),
          ],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App logo or icon
            Icon(
              Icons.account_balance_wallet,
              size: 80,
              color: Colors.white,
            ),
            const SizedBox(height: 32),
            
            // App name
            Text(
              'Konto',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 48),
            
            // Loading indicator
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
            const SizedBox(height: 16),
            
            // Loading message
            Text(
              message,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.white.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
