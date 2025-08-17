import 'package:flutter/material.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/authentication/presentation/views/register_view.dart';
import 'package:konto/features/contribution/presentation/views/request_contribution_view.dart';
import 'package:konto/features/jars/presentation/views/jar_detail_view.dart';
import 'package:konto/features/onboarding/prensentation/pages/on_boarding_page.dart';
import 'package:konto/features/startup/presentation/views/startup_screen.dart';
import 'package:konto/features/verification/presentation/pages/otp_view.dart';

class AppRoutes {
  static Map<String, WidgetBuilder> get routes => {
    '/': (context) => const StartupScreen(),
    '/onboarding': (context) => const OnBoardingPage(),
    '/login': (context) => const LoginView(),
    '/register': (context) => const RegisterView(),
    '/otp': (context) => const OtpView(),
    '/jar_detail': (context) => const JarDetailView(),
    '/request_contribution': (context) => RequestContributionView(),
  };

  // Route names constants for easy access
  static const String initial = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String otp = '/otp';
  static const String jarDetail = '/jar_detail';
  static const String contributionRequest = '/request_contribution';
}
