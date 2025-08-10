import 'package:flutter/material.dart';

class AppColors {
  // Define your Figma colors
  static const Color primaryLight = Color(0xFFFDF7EC);
  static const Color secondaryGreen = Color(0xFFF4FDDF);
  static const Color backgroundLight = Color(0xFFEBE2D7);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color errorRed = Color(0xFFEF4444);
  static const Color onPrimaryWhite = Color(0xFFFFFFFF);
  static const Color onSurfaceDark = Color(0xFF1F2937);
  static const Color label = Color(0xFF747373);
  static const Color black = Color(0xFF000000);

  // Create light theme color scheme
  static const ColorScheme lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: primaryLight,
    onPrimary: onPrimaryWhite,
    secondary: secondaryGreen,
    onSecondary: onPrimaryWhite,
    error: errorRed,
    onError: onPrimaryWhite,
    surface: backgroundLight,
    onSurface: onSurfaceDark,
  );
  
  // Create dark theme color scheme (if needed)
  static const ColorScheme darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: primaryLight,
    onPrimary: onPrimaryWhite,
    secondary: secondaryGreen,
    onSecondary: onPrimaryWhite,
    error: errorRed,
    onError: onPrimaryWhite,
    surface: onSurfaceDark,
    onSurface: surfaceWhite,
  );
}