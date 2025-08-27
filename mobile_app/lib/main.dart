import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/theme/app_theme.dart';
import 'package:konto/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:konto/features/contribution/logic/bloc/fetch_contribution_bloc.dart';
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

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");

  // Set initial system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );

  // Initialize service registry for dependency injection
  ServiceRegistry().initialize();
  runApp(const MainApp());
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
        // Add more BLoCs here as you create them
        // BlocProvider(
        //   create: (context) => HomeBloc(),
        // ),
      ],
      child: MaterialApp(
        title: 'Konto',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
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
      ),
    );
  }
}
