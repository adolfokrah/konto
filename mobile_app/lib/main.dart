import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:konto/core/config/app_config.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/theme/app_theme.dart';
import 'package:konto/core/enums/app_theme.dart' as theme_enum;
import 'package:konto/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:konto/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:konto/features/contribution/logic/bloc/fetch_contribution_bloc.dart';
import 'package:konto/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:konto/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_create/jar_create_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/features/media/logic/bloc/media_bloc.dart';
import 'package:konto/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:konto/features/user_account/logic/bloc/withdrawal_account_verification_bloc.dart';
import 'package:konto/route.dart';
import 'package:konto/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set initial system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );

  // Initialize service registry for dependency injection
  ServiceRegistry().initialize();

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
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
        BlocProvider(create: (context) => UserAccountBloc()),
        BlocProvider(create: (context) => WithdrawalAccountVerificationBloc()),
        BlocProvider(create: (context) => MomoPaymentBloc()),
        BlocProvider(create: (context) => FilterContributionsBloc()),
        BlocProvider(
          create:
              (context) => ContributionsListBloc(
                filterBloc: context.read<FilterContributionsBloc>(),
              ),
        ),
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

              final ThemeMode resolvedThemeMode = switch (appTheme) {
                theme_enum.AppTheme.light => ThemeMode.light,
                theme_enum.AppTheme.dark => ThemeMode.dark,
                theme_enum.AppTheme.system => ThemeMode.system,
              };

              return MaterialApp(
                title: 'Konto',
                theme: AppTheme.lightTheme,
                darkTheme: AppTheme.darkTheme,
                themeMode: resolvedThemeMode,
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
                  // Update translation service when locale changes
                  if (locale != null) {
                    ServiceRegistry().translationService.updateLocale(locale);
                  }
                  return locale;
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
