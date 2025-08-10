import 'package:flutter/material.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/onboarding/prensentation/pages/on_boarding_page.dart';
import 'package:konto/l10n/app_localizations.dart';

class AppRoutes {
  static Map<String, WidgetBuilder> get routes => {
        '/': (context) => const OnBoardingPage(),
        '/onboarding': (context) => const OnBoardingPage(),
        '/login': (context) => const LoginView(),
        '/home': (context) => Scaffold(
              body: Center(
                child: Text(AppLocalizations.of(context)!.homePageComingSoon),
              ),
            ),
      };

  // Route names constants for easy access
  static const String initial = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String home = '/home';
}
