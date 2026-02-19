import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/startup/presentation/views/startup_screen.dart';
import 'package:Hoga/features/onboarding/prensentation/pages/on_boarding_page.dart';
import 'package:Hoga/features/onboarding/prensentation/pages/walk_through.dart';
import 'package:Hoga/features/authentication/presentation/views/login_view.dart';
import 'package:Hoga/features/authentication/presentation/views/register_view.dart';
import 'package:Hoga/features/verification/presentation/pages/otp_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_detail_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_create_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_goal_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_info_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_description_edit_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_thank_you_message_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_fixed_contribution_amount_edit_view.dart';
import 'package:Hoga/features/jars/presentation/views/jar_name_edit_view.dart';
import 'package:Hoga/features/jars/presentation/views/withdraw_view.dart';
import 'package:Hoga/features/contribution/presentation/views/add_contribution_view.dart';
import 'package:Hoga/features/contribution/presentation/views/save_contribution_view.dart';
import 'package:Hoga/features/contribution/presentation/views/await_momo_payment_view.dart';
import 'package:Hoga/features/contribution/presentation/views/contributions_list_view.dart';
import 'package:Hoga/features/contribution/presentation/views/request_contribution_view.dart';
import 'package:Hoga/features/user_account/presentation/views/user_account_view.dart';
import 'package:Hoga/features/user_account/presentation/views/personal_details_view.dart';
import 'package:Hoga/features/user_account/presentation/views/change_phone_number_view.dart';
import 'package:Hoga/features/user_account/presentation/views/withdrawal_account_view.dart';
import 'package:Hoga/features/user_account/presentation/views/theme_settings_view.dart';
import 'package:Hoga/features/user_account/presentation/views/language_settings_view.dart';
import 'package:Hoga/features/verification/presentation/pages/kyc_view.dart';
import 'package:Hoga/features/notifications/presentation/views/notficiations_list_view.dart';

/// Global navigator key for deep navigation (FCM, FlutterLoadingOverlay)
final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createRouter(AuthBloc authBloc) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: AppRoutes.initial,
    refreshListenable: GoRouterRefreshStream(authBloc.stream),
    redirect: (BuildContext context, GoRouterState state) {
      final authState = authBloc.state;
      final currentLocation = state.matchedLocation;

      const authRoutes = {
        AppRoutes.login,
        AppRoutes.register,
        AppRoutes.otp,
        AppRoutes.onboarding,
        AppRoutes.walkthrough,
      };
      final isOnAuthRoute = authRoutes.contains(currentLocation);
      final isOnStartup = currentLocation == AppRoutes.initial;

      // Auth still loading — stay where you are on auth/startup routes
      if (authState is AuthLoading) {
        if (isOnAuthRoute || isOnStartup) return null;
        return AppRoutes.initial;
      }

      // Not authenticated — force to onboarding unless already on auth route
      if (authState is AuthInitial) {
        if (isOnAuthRoute || isOnStartup) return null;
        return AppRoutes.onboarding;
      }

      // Authenticated — redirect away from auth/startup routes
      if (authState is AuthAuthenticated) {
        if (isOnAuthRoute || isOnStartup) return AppRoutes.jarDetail;
        return null;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const StartupScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnBoardingPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginView(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterView(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) => const OtpView(),
      ),
      GoRoute(
        path: '/walkthrough',
        builder: (context, state) => const WalkThrough(),
      ),
      GoRoute(
        path: '/jar_detail',
        builder: (context, state) => const JarDetailView(),
      ),
      GoRoute(
        path: '/request_contribution',
        builder: (context, state) => RequestContributionView(),
      ),
      GoRoute(
        path: '/add_contribution',
        builder: (context, state) => const AddContributionView(),
      ),
      GoRoute(
        path: '/save_contribution',
        builder: (context, state) => const SaveContributionView(),
      ),
      GoRoute(
        path: '/jar_create',
        builder: (context, state) => const JarCreateView(),
      ),
      GoRoute(
        path: '/jar_goal',
        builder: (context, state) => const JarGoalView(),
      ),
      GoRoute(
        path: '/jar_info',
        builder: (context, state) => const JarInfoView(),
      ),
      GoRoute(
        path: '/jar_description_edit',
        builder: (context, state) => const JarDescriptionEditView(),
      ),
      GoRoute(
        path: '/jar_thank_you_message_edit',
        builder: (context, state) => const JarThankYouMessageEditView(),
      ),
      GoRoute(
        path: '/jar_fixed_contribution_amount_edit',
        builder: (context, state) => const JarFixedContributionAmountEditView(),
      ),
      GoRoute(
        path: '/jar_name_edit',
        builder: (context, state) => const JarNameEditView(),
      ),
      GoRoute(
        path: '/user_account_view',
        builder: (context, state) => const UserAccountView(),
      ),
      GoRoute(
        path: '/personal_details',
        builder: (context, state) => const PersonalDetailsView(),
      ),
      GoRoute(
        path: '/change_phone_number',
        builder: (context, state) => const ChangePhoneNumberView(),
      ),
      GoRoute(
        path: '/withdrawal_account',
        builder: (context, state) => const WithdrawalAccountView(),
      ),
      GoRoute(
        path: '/await_momo_payment',
        builder: (context, state) => const AwaitMomoPaymentView(),
      ),
      GoRoute(
        path: '/contributions_list',
        builder: (context, state) => const ContributionsListView(),
      ),
      GoRoute(
        path: '/theme_settings',
        builder: (context, state) => const ThemeSettingsView(),
      ),
      GoRoute(
        path: '/language_settings',
        builder: (context, state) => const LanguageSettingsView(),
      ),
      GoRoute(
        path: '/kycView',
        builder: (context, state) => const KycView(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotficiationsListView(),
      ),
      GoRoute(
        path: '/withdraw',
        builder: (context, state) => const WithdrawView(),
      ),
    ],
  );
}

/// Converts a Bloc stream into a ChangeNotifier for go_router's refreshListenable.
/// Only notifies when the auth state **type** changes (e.g. AuthInitial → AuthAuthenticated),
/// not when the same state type is re-emitted with updated data.
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((state) {
      final stateType = state.runtimeType;
      if (stateType != _lastStateType) {
        _lastStateType = stateType;
        notifyListeners();
      }
    });
  }

  Type? _lastStateType;
  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
