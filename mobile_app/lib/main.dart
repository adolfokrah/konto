import 'package:flutter/material.dart';
import 'package:konto/core/theme/app_theme.dart';
import 'package:konto/features/onboarding/prensentation/pages/on_boarding_page.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const OnBoardingPage(),
    );
  }
}
