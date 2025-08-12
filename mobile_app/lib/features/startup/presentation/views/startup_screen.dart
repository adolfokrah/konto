import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
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
    // Check for existing user session first
    context.read<AuthBloc>().add(AutoLoginRequested());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, authState) {
          // If checking for existing session
          if (authState is AutoLoginLoading) {
            return const _LoadingScreen(message: 'Checking session...');
          }
          
          // If user has valid token, navigate to home
          if (authState is AutoLoginSuccess) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              Navigator.of(context).pushReplacementNamed('/home');
            });
            return const _LoadingScreen(message: 'Welcome back!');
          }
          
          // No valid token, check onboarding
          if (authState is AutoLoginFailed) {
            return BlocBuilder<OnboardingBloc, OnboardingState>(
              builder: (context, onboardingState) {
                // First time checking onboarding status
                if (onboardingState is OnboardingInitial) {
                  // Trigger onboarding check
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    context.read<OnboardingBloc>().add(CheckOnboardingStatus());
                  });
                  return const _LoadingScreen(message: 'Loading...');
                }
                
                // User is going through onboarding
                if (onboardingState is OnboardingPageState) {
                  return const OnBoardingPage();
                }
                
                // Onboarding completed, go to login
                if (onboardingState is OnboardingCompleted) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    Navigator.of(context).pushReplacementNamed('/login');
                  });
                  return const _LoadingScreen(message: 'Setting up...');
                }
                
                return const _LoadingScreen(message: 'Loading...');
              },
            );
          }
          
          // Default loading state
          return const _LoadingScreen(message: 'Starting up...');
        },
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
