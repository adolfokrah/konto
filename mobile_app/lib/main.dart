import 'package:flutter/material.dart';
import 'package:konto/core/theme/app_theme.dart';
import 'package:konto/core/theme/text_styles.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return  MaterialApp(
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(
          child: Text('Hello World!', style: TextStyles.titleBoldLg),
        ),
      ),
    );
  }
}
