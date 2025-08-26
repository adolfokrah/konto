import 'package:flutter/material.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/authentication/presentation/views/register_view.dart';
import 'package:konto/features/contribution/presentation/views/add_contribution_view.dart';
import 'package:konto/features/jars/presentation/views/jar_description_edit_view.dart';
import 'package:konto/features/jars/presentation/views/jar_fixed_contribution_amount_edit_view.dart';
import 'package:konto/features/jars/presentation/views/jar_goal_view.dart';
import 'package:konto/features/contribution/presentation/views/request_contribution_view.dart';
import 'package:konto/features/contribution/presentation/views/save_contribution_view.dart';
import 'package:konto/features/jars/presentation/views/jar_create_view.dart';
import 'package:konto/features/jars/presentation/views/jar_detail_view.dart';
import 'package:konto/features/jars/presentation/views/jar_info_view.dart';
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
    '/add_contribution': (context) => const AddContributionView(),
    '/save_contribution': (context) => const SaveContributionView(),
    '/jar_create': (context) => const JarCreateView(),
    '/jar_goal': (context) => const JarGoalView(),
    '/jar_info': (context) => const JarInfoView(),
    '/jar_description_edit': (context) => const JarDescriptionEditView(),
    '/jar_fixed_contribution_amount_edit':
        (context) => const JarFixedContributionAmountEditView(),
  };

  // Route names constants for easy access
  static const String initial = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String otp = '/otp';
  static const String jarDetail = '/jar_detail';
  static const String contributionRequest = '/request_contribution';
  static const String addContribution = '/add_contribution';
  static const String saveContribution = '/save_contribution';
  static const String jarCreate = '/jar_create';
  static const String jarGoal = '/jar_goal';
  static const String jarInfo = '/jar_info';
  static const String jarDescriptionEdit = '/jar_description_edit';
  static const String jarFixedContributionAmountEdit =
      '/jar_fixed_contribution_amount_edit';
}
