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
      fontFamily: 'Supreme',
      // Configure tooltip theme to prevent ticker conflicts
      tooltipTheme: const TooltipThemeData(
        waitDuration: Duration(
          milliseconds: 2000,
        ), // Longer wait before showing
        showDuration: Duration(milliseconds: 1000), // Reasonable show duration
        triggerMode: TooltipTriggerMode.longPress, // Only show on long press
      ),
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
      // Configure tooltip theme to prevent ticker conflicts
      tooltipTheme: const TooltipThemeData(
        waitDuration: Duration(
          milliseconds: 2000,
        ), // Longer wait before showing
        showDuration: Duration(milliseconds: 1000), // Reasonable show duration
        triggerMode: TooltipTriggerMode.longPress, // Only show on long press
      ),
    );
  }
}
