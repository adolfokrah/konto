import 'package:Hoga/features/verification/presentation/pages/kyc_view.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/features/authentication/presentation/views/login_view.dart';
import 'package:Hoga/features/authentication/presentation/views/register_view.dart';
import 'package:Hoga/features/contribution/presentation/views/add_contribution_view.dart';
import 'package:Hoga/features/contribution/presentation/views/await_momo_payment_view.dart';
import 'package:Hoga/features/contribution/presentation/views/contributions_list_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_description_edit_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_fixed_contribution_amount_edit_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_goal_view.dart';
import 'package:Hoga/features/contribution/presentation/views/request_contribution_view.dart';
import 'package:Hoga/features/contribution/presentation/views/save_contribution_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_create_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_detail_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_info_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_thank_you_message_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_name_edit_view.dart';
import 'package:Hoga/features/onboarding/prensentation/pages/on_boarding_page.dart';
import 'package:Hoga/features/startup/presentation/views/startup_screen.dart';
import 'package:Hoga/features/user_account/presentation/views/change_phone_number_view.dart';
import 'package:Hoga/features/user_account/presentation/views/personal_details_view.dart';
import 'package:Hoga/features/user_account/presentation/views/theme_settings_view.dart';
import 'package:Hoga/features/user_account/presentation/views/language_settings_view.dart';
import 'package:Hoga/features/user_account/presentation/views/user_account_view.dart';
import 'package:Hoga/features/user_account/presentation/views/withdrawal_account_view.dart';
import 'package:Hoga/features/verification/presentation/pages/otp_view.dart';

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
    '/jar_thank_you_message_edit':
        (context) => const JarThankYouMessageEditView(),
    '/jar_fixed_contribution_amount_edit':
        (context) => const JarFixedContributionAmountEditView(),
    '/jar_name_edit': (context) => const JarNameEditView(),
    '/user_account_view': (context) => const UserAccountView(),
    '/personal_details': (context) => const PersonalDetailsView(),
    '/change_phone_number': (context) => const ChangePhoneNumberView(),
    '/withdrawal_account': (context) => const WithdrawalAccountView(),
    '/await_momo_payment': (context) => const AwaitMomoPaymentView(),
    '/contributions_list': (context) => const ContributionsListView(),
    '/theme_settings': (context) => const ThemeSettingsView(),
    '/language_settings': (context) => const LanguageSettingsView(),
    '/kycView': (context) => const KycView(),
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
  static const String jarThankYouMessageEdit = '/jar_thank_you_message_edit';
  static const String jarFixedContributionAmountEdit =
      '/jar_fixed_contribution_amount_edit';
  static const String jarNameEdit = '/jar_name_edit';
  static const String userAccountView = '/user_account_view';
  static const String personalDetails = '/personal_details';
  static const String changePhoneNumber = '/change_phone_number';
  static const String withdrawalAccount = '/withdrawal_account';
  static const String awaitMomoPayment = '/await_momo_payment';
  static const String contributionsList = '/contributions_list';
  static const String themeSettings = '/theme_settings';
  static const String languageSettings = '/language_settings';
  static const String kycView = '/kycView';
}
