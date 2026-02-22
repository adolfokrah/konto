import 'package:Hoga/core/services/fcm_service.dart';
import 'package:Hoga/core/services/local_notification_service.dart';
import 'package:Hoga/features/collaborators/logic/bloc/reminder_bloc.dart';
import 'package:Hoga/features/notifications/logic/bloc/jar_invite_action_bloc.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/features/contribution/logic/bloc/export_contributions_bloc.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:Hoga/core/config/app_config.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/services/translation_service.dart';
import 'package:Hoga/core/theme/app_theme.dart';
import 'package:Hoga/core/enums/app_theme.dart' as theme_enum;
import 'package:Hoga/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/fetch_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_create/jar_create_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/withdrawal_account_verification_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/router.dart';
import 'package:Hoga/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:flutter_loading_overlay/flutter_loading_overlay.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize configuration from .env file
  await AppConfig.initialize();

  // Set initial system UI overlay style with white status bar icons
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light, // White icons
      statusBarBrightness: Brightness.dark, // iOS: dark status bar background
    ),
  );

  // Initialize dependency injection
  setupServiceLocator();

  try {
    await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform);
  } catch (e) {
    debugPrint('Firebase init failed: $e');
  }

  // Initialize local notifications for foreground push display
  try {
    await LocalNotificationService.initialize();
  } catch (e) {
    debugPrint('Local notifications init failed: $e');
  }

  // Initialize FCM listeners
  try {
    FCMService.initialize();
  } catch (e) {
    debugPrint('FCM init failed: $e');
  }

  // Initialize Sentry only for production and staging environments
  if (!AppConfig.isDevelopment) {
    try {
      await SentryFlutter.init((options) {
        options.dsn = AppConfig.sentryDsn;
        options.environment = AppConfig.flutterEnv;

        // Production vs Staging settings
        if (AppConfig.isProduction) {
          // Production: Optimized sampling rates
          options.debug = false;
          options.tracesSampleRate = 0.1; // Capture 10% of transactions
          options.profilesSampleRate = 0.1;
          options.replay.sessionSampleRate = 0.1; // Capture 10% of sessions
          options.replay.onErrorSampleRate =
              1.0; // Still capture all error sessions
        } else {
          // Staging: Higher sampling for testing
          options.debug = true;
          options.tracesSampleRate = 1.0; // Capture 100% for testing
          options.profilesSampleRate = 1.0;
          options.replay.sessionSampleRate =
              1.0; // Capture all sessions in staging
          options.replay.onErrorSampleRate = 1.0;
          options.enableLogs = true;
        }

        // Common settings for production and staging
        options.sendDefaultPii = true;
        options.enableLogs = true;
      }, appRunner: () => runApp(SentryWidget(child: const MainApp())));
    } catch (e) {
      debugPrint('Sentry init failed: $e');
      runApp(const MainApp());
    }
  } else {
    // Development: No Sentry, just run the app normally
    runApp(const MainApp());
  }
}

class MainApp extends StatefulWidget {
  const MainApp({super.key});

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> with WidgetsBindingObserver {
  GoRouter? _router;

  GoRouter _getRouter(BuildContext context) {
    return _router ??= createRouter(getIt<AuthBloc>());
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Configure edge-to-edge display
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    _updateSystemOverlay();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangePlatformBrightness() {
    _updateSystemOverlay();
  }

  void _updateSystemOverlay() {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        // Always use light icons (white) on status bar
        statusBarIconBrightness: Brightness.light,
        // Always use dark status bar background on iOS (makes icons white)
        statusBarBrightness: Brightness.dark,
        // Android navigation bar configuration
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness: Brightness.light,
        systemNavigationBarContrastEnforced: false,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    FlutterLoadingOverlay().init(navigatorKey: rootNavigatorKey);

    return MultiBlocProvider(
      providers: [
        BlocProvider.value(
          value: getIt<OnboardingBloc>()..add(CheckOnboardingStatus()),
        ),
        BlocProvider.value(value: getIt<AuthBloc>()),
        BlocProvider.value(value: getIt<VerificationBloc>()),
        BlocProvider.value(value: getIt<JarSummaryBloc>()),
        BlocProvider.value(value: getIt<JarSummaryReloadBloc>()),
        BlocProvider.value(value: getIt<JarListBloc>()),
        BlocProvider.value(value: getIt<JarCreateBloc>()),
        BlocProvider.value(value: getIt<MediaBloc>()),
        BlocProvider.value(value: getIt<AddContributionBloc>()),
        BlocProvider.value(value: getIt<FetchContributionBloc>()),
        BlocProvider.value(value: getIt<UpdateJarBloc>()),
        BlocProvider.value(value: getIt<UserAccountBloc>()),
        BlocProvider.value(value: getIt<WithdrawalAccountVerificationBloc>()),
        BlocProvider.value(value: getIt<MomoPaymentBloc>()),
        BlocProvider.value(value: getIt<FilterContributionsBloc>()),
        BlocProvider.value(value: getIt<ContributionsListBloc>()),
        BlocProvider.value(value: getIt<ExportContributionsBloc>()),
        BlocProvider.value(value: getIt<KycBloc>()),
        BlocProvider.value(value: getIt<NotificationsBloc>()),
        BlocProvider.value(value: getIt<JarInviteActionBloc>()),
        BlocProvider.value(value: getIt<ReminderBloc>()),
      ],
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, authState) {
          return BlocBuilder<UserAccountBloc, UserAccountState>(
            // Only rebuild when theme or language value changes compared to previous snapshot
            buildWhen: (prev, curr) {
              // Helper to extract (theme, language) tuple
              (theme_enum.AppTheme, String)? extract(UserAccountState s) {
                if (s is UserAccountSuccess) {
                  return (
                    s.updatedUser.appSettings.theme,
                    s.updatedUser.appSettings.language.value,
                  );
                }
                return null;
              }

              final prevVals = extract(prev);
              final currVals = extract(curr);

              // If neither had values, don't rebuild
              if (prevVals == null && currVals == null) return false;
              // If one is null and the other not, rebuild (first load)
              if (prevVals == null || currVals == null) return true;
              // Rebuild only when theme or language changed
              return prevVals != currVals;
            },
            builder: (context, userAccountState) {
              // Determine selected theme from UserAccount updates first, else fall back to authenticated user
              theme_enum.AppTheme? appTheme;
              if (userAccountState is UserAccountSuccess) {
                appTheme = userAccountState.updatedUser.appSettings.theme;
              } else if (authState is AuthAuthenticated) {
                appTheme = authState.user.appSettings.theme;
              }
              appTheme ??= theme_enum.AppTheme.dark;

              // Determine selected language locale from appSettings; fallback to system locale
              String? languageCode;
              if (userAccountState is UserAccountSuccess) {
                languageCode =
                    userAccountState.updatedUser.appSettings.language.value;
              } else if (authState is AuthAuthenticated) {
                languageCode = authState.user.appSettings.language.value;
              }

              // If no user preference, use system language (only if supported)
              if (languageCode == null || languageCode.isEmpty) {
                final systemLocale =
                    WidgetsBinding.instance.platformDispatcher.locale;
                if (systemLocale.languageCode == 'en' ||
                    systemLocale.languageCode == 'fr') {
                  languageCode = systemLocale.languageCode;
                }
              }
              final Locale? resolvedLocale =
                  (languageCode == null || languageCode.isEmpty)
                      ? null
                      : Locale(languageCode);

              // Light theme disabled - always use dark theme
              final ThemeMode resolvedThemeMode = switch (appTheme) {
                theme_enum.AppTheme.light => ThemeMode.dark, // Redirect light to dark
                theme_enum.AppTheme.dark => ThemeMode.dark,
                theme_enum.AppTheme.system => ThemeMode.dark, // Force dark even for system
              };

              return MaterialApp.router(
                routerConfig: _getRouter(context),
                title: 'hoga',
                // theme: AppTheme.lightTheme, // COMMENTED OUT - Light theme disabled
                darkTheme: AppTheme.darkTheme,
                themeMode: resolvedThemeMode,
                // Use user-selected locale or fallback (null lets Flutter resolve)
                locale: resolvedLocale,
                debugShowCheckedModeBanner: false,
                localizationsDelegates: const [
                  AppLocalizations.delegate,
                  GlobalMaterialLocalizations.delegate,
                  GlobalWidgetsLocalizations.delegate,
                  GlobalCupertinoLocalizations.delegate,
                ],
                supportedLocales: const [
                  Locale('en'), // English
                  Locale('fr'), // French
                ],
                localeResolutionCallback: (locale, supportedLocales) {
                  // If we already have a resolvedLocale, use that.
                  if (resolvedLocale != null) {
                    getIt<TranslationService>().updateLocale(
                      resolvedLocale,
                    );
                    return resolvedLocale;
                  }
                  // Else use system provided locale if supported
                  if (locale != null) {
                    final match = supportedLocales.firstWhere(
                      (l) => l.languageCode == locale.languageCode,
                      orElse: () => supportedLocales.first,
                    );
                    getIt<TranslationService>().updateLocale(match);
                    return match;
                  }
                  // Fallback to first supported
                  getIt<TranslationService>().updateLocale(
                    supportedLocales.first,
                  );
                  return supportedLocales.first;
                },

                // Add builder to handle Android navigation bar overlay
                builder: (context, child) {
                  return SafeArea(
                    bottom:
                        Theme.of(context).platform == TargetPlatform.android,
                    top: false,
                    child: child ?? Container(),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
