import 'package:flutter/material.dart';

class AppColors {
  // Brand (redesign · light theme only)
  static const Color navy = Color(0xFF1B232E); // text, primary buttons
  static const Color lime = Color(0xFFD9F57A); // active / highlight
  static const Color limeSoft = Color(0xFFF4FDDF); // tips, insight cards
  static const Color cream = Color(0xFFFBF6EE); // app background
  static const Color beige = Color(0xFFEBE2D7); // chart bars, muted fills
  static const Color fill = Color(0xFFF3ECE2); // input / segment fills
  static const Color line = Color(0xFFEDE5D9); // hairlines
  static const Color ink2 = Color(0xFF4A5463); // secondary text
  static const Color muted = Color(0xFF8B8F96); // tertiary text
  static const Color faint = Color(0xFFBFB7AB); // pesewas, disabled

  // Status: green and red only ever mean money in and money out / errors
  static const Color positive = Color(0xFF0F9F61);
  static const Color positiveSoft = Color(0xFFE6F7EE);
  static const Color negative = Color(0xFFE5483D);
  static const Color negativeSoft = Color(0xFFFDECEA);
  static const Color pending = Color(0xFFD9840A);
  static const Color pendingSoft = Color(0xFFFFF4E2);
  static const Color info = Color(0xFF2E7CF6);
  static const Color infoSoft = Color(0xFFEAF2FF);

  // Mobile money networks
  static const Color mtnYellow = Color(0xFFFFCB05);
  static const Color telecelRed = Color(0xFFE30613);

  // Existing names, kept so current screens compile; mapped to the new palette
  static const Color primaryLight = Color(0xFFFDF7EC);
  static const Color primaryDark = Color(0xFF2D3849);
  static const Color secondaryGreen = limeSoft;
  static const Color backgroundLight = beige;
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color errorRed = negative;
  static const Color warningOrange = pending;
  static const Color infoBlue = info;
  static const Color onPrimaryWhite = Color(0xFFFFFFFF);
  static const Color onSurfaceDark = navy;
  static const Color label = muted;
  static const Color black = Color(0xFF000000);

  // Light scheme. Roles as the widgets use them:
  // primary = card / input fill, onSurface = text and primary-button fill,
  // surface = screen background, secondary = soft lime, tertiary = lime.
  static const ColorScheme lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: surfaceWhite,
    onPrimary: surfaceWhite,
    secondary: limeSoft,
    onSecondary: navy,
    tertiary: lime,
    onTertiary: navy,
    error: negative,
    onError: surfaceWhite,
    surface: cream,
    onSurface: navy,
    onSurfaceVariant: ink2,
    surfaceContainerHighest: fill,
    outline: line,
    outlineVariant: line,
  );

  // Dark scheme, no longer used (the app is light-only) but kept for reference.
  static const ColorScheme darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: primaryDark,
    onPrimary: onPrimaryWhite,
    secondary: secondaryGreen,
    onSecondary: onPrimaryWhite,
    error: errorRed,
    onError: onPrimaryWhite,
    surface: onSurfaceDark,
    onSurface: surfaceWhite,
  );
}
