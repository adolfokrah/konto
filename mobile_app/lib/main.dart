import 'package:Hoga/core/services/fcm_service.dart';
import 'package:Hoga/features/notifications/logic/bloc/jar_invite_action_bloc.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:Hoga/core/config/app_config.dart';
import 'package:Hoga/core/services/service_registry.dart';
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
import 'package:Hoga/route.dart';
import 'package:Hoga/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:flutter_loading_overlay/flutter_loading_overlay.dart';

// Global navigator key for deep navigation
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize configuration from .env file
  await AppConfig.initialize();

  // Set initial system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );

  // Initialize service registry for dependency injection
  ServiceRegistry().initialize();

  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Initialize FCM listeners
  FCMService.initialize();

  // Initialize Sentry only for production and staging environments
  if (!AppConfig.isDevelopment) {
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
    final brightness =
        WidgetsBinding.instance.platformDispatcher.platformBrightness;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness:
            brightness == Brightness.dark
                ? Brightness
                    .light // Light icons on dark theme
                : Brightness.dark, // Dark icons on light theme
        statusBarBrightness:
            brightness == Brightness.dark
                ? Brightness
                    .dark // Dark status bar on iOS dark mode
                : Brightness.light, // Light status bar on iOS light mode
        // Android navigation bar configuration
        systemNavigationBarColor: Colors.black.withOpacity(0.3),
        systemNavigationBarIconBrightness: Brightness.light,
        systemNavigationBarContrastEnforced: true,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    FlutterLoadingOverlay().init(navigatorKey: navigatorKey);

    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) => OnboardingBloc()..add(CheckOnboardingStatus()),
        ),
        BlocProvider(create: (context) => AuthBloc()),
        BlocProvider(create: (context) => VerificationBloc()),
        BlocProvider(create: (context) => JarSummaryBloc()),
        BlocProvider(
          create:
              (context) => JarSummaryReloadBloc(
                jarSummaryBloc: BlocProvider.of<JarSummaryBloc>(context),
              ),
        ),
        BlocProvider(create: (context) => JarListBloc()),
        BlocProvider(create: (context) => JarCreateBloc()),
        BlocProvider(create: (context) => MediaBloc()),
        BlocProvider(create: (context) => AddContributionBloc()),
        BlocProvider(create: (context) => FetchContributionBloc()),
        BlocProvider(create: (context) => UpdateJarBloc()),
        BlocProvider(
          create:
              (context) =>
                  UserAccountBloc(authBloc: BlocProvider.of<AuthBloc>(context)),
        ),
        BlocProvider(create: (context) => WithdrawalAccountVerificationBloc()),
        BlocProvider(create: (context) => MomoPaymentBloc()),
        BlocProvider(create: (context) => FilterContributionsBloc()),
        BlocProvider(
          create:
              (context) => ContributionsListBloc(
                filterBloc: context.read<FilterContributionsBloc>(),
              ),
        ),
        BlocProvider(create: (context) => KycBloc()),
        BlocProvider(create: (context) => NotificationsBloc()),
        BlocProvider(create: (context) => JarInviteActionBloc()),
        // Add more BLoCs here as you create them
        // BlocProvider(
        //   create: (context) => HomeBloc(),
        // ),
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
              appTheme ??= theme_enum.AppTheme.system;

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

              final ThemeMode resolvedThemeMode = switch (appTheme) {
                theme_enum.AppTheme.light => ThemeMode.light,
                theme_enum.AppTheme.dark => ThemeMode.dark,
                theme_enum.AppTheme.system => ThemeMode.system,
              };

              return MaterialApp(
                navigatorKey: navigatorKey,
                title: 'hoga',
                theme: AppTheme.lightTheme,
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
                    ServiceRegistry().translationService.updateLocale(
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
                    ServiceRegistry().translationService.updateLocale(match);
                    return match;
                  }
                  // Fallback to first supported
                  ServiceRegistry().translationService.updateLocale(
                    supportedLocales.first,
                  );
                  return supportedLocales.first;
                },

                // Add builder to handle Android navigation bar overlay
                builder: (context, child) {
                  // Get the bottom padding from MediaQuery (system navigation bar height)
                  final mediaQuery = MediaQuery.of(context);
                  final bottomPadding = mediaQuery.viewPadding.bottom;

                  // Only add bottom padding if we have system navigation bar
                  if (bottomPadding > 0) {
                    return Padding(
                      padding: EdgeInsets.only(bottom: bottomPadding),
                      child: child ?? Container(),
                    );
                  }
                  return child ?? Container();
                },
                routes: AppRoutes.routes,
                initialRoute: AppRoutes.initial,
              );
            },
          );
        },
      ),
    );
  }
}
