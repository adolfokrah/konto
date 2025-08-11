import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:konto/core/services/local_storage_service.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/theme/app_theme.dart';
import 'package:konto/route.dart';
import 'package:konto/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:konto/features/onboarding/data/repositories/onboarding_repository.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
    // Initialize service registry for dependency injection
  ServiceRegistry().initialize();
  
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Create service instances
    final localStorageService = LocalStorageService();
    
    // Create repository instances
    final onboardingRepository = OnboardingRepository(
      localStorageService: localStorageService,
    );

    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) => OnboardingBloc(
            onboardingRepository: onboardingRepository,
          )..add(CheckOnboardingStatus()),
        ),
        BlocProvider(
          create: (context) => AuthBloc(),
        ),
        BlocProvider(
          create: (context) => VerificationBloc(),
        ),
        // Add more BLoCs here as you create them
        // BlocProvider(
        //   create: (context) => HomeBloc(),
        // ),
      ],
      child: MaterialApp(
        title: 'Konto',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system, // Automatically switch based on system setting
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
        routes: AppRoutes.routes,
        initialRoute: AppRoutes.initial,
      ),
    );
  }
}
