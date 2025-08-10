import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/theme/app_theme.dart';
import 'package:konto/route.dart';
import 'package:konto/features/onboarding/logic/bloc/onboarding_bloc.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) => OnboardingBloc(),
        ),
        // Add more BLoCs here as you create them
        // BlocProvider(
        //   create: (context) => AuthBloc(),
        // ),
        // BlocProvider(
        //   create: (context) => HomeBloc(),
        // ),
      ],
      child: MaterialApp(
        theme: AppTheme.lightTheme,
        debugShowCheckedModeBanner: false,
        routes: AppRoutes.routes,
        initialRoute: AppRoutes.initial,
      ),
    );
  }
}
