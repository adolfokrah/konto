import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'text_styles.dart';

class AppTheme {
  // Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      // Use Material 3 design system
      useMaterial3: true,
      // Color scheme
      colorScheme: AppColors.lightColorScheme,
      // Custom text theme from Figma
      textTheme: AppTextStyles.textTheme,
      fontFamily: 'Supreme'
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      // Use Material 3 design system
      useMaterial3: true,
      // Color scheme
      colorScheme: AppColors.darkColorScheme,
      // Custom text theme from Figma
      textTheme: AppTextStyles.textTheme,
      fontFamily: 'Supreme',
    );
  }
  
}
