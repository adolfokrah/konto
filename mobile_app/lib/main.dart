import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/theme/app_theme.dart';
import 'package:konto/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_create/jar_create_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:konto/features/media/logic/bloc/media_bloc.dart';
import 'package:konto/route.dart';
import 'package:konto/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  // Initialize service registry for dependency injection
  ServiceRegistry().initialize();
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

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
        // Add more BLoCs here as you create them
        // BlocProvider(
        //   create: (context) => HomeBloc(),
        // ),
      ],
      child: MaterialApp(
        title: 'Konto',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode:
            ThemeMode.system, // Automatically switch based on system setting
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
