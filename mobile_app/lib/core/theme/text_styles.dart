// Text styles matching Figma design system
import 'package:flutter/material.dart';

class AppTextStyles {
  // Heading Styles
  static const TextStyle headingOne = TextStyle(
    fontFamily: 'Chubbo',
    fontSize: 58,
    fontWeight: FontWeight.bold, // Bold
    height: 1.2,
    letterSpacing: -0.5,
  );

  static const TextStyle headingTwo = TextStyle(
    fontFamily: 'Chubbo',
    fontSize: 20,
    fontWeight: FontWeight.normal, // Auto weight
    height: 1.3,
    letterSpacing: -0.2,
  );

  // Title Styles
  static const TextStyle titleMediumM = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 18,
    fontWeight: FontWeight.w500, // Medium
    height: 1.4,
    letterSpacing: 0.1,
  );

  static const TextStyle titleRegularM = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 14,
    fontWeight: FontWeight.normal, // Regular
    height: 1.4,
    letterSpacing: 0.1,
  );

  static const TextStyle titleBoldM = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 14,
    fontWeight: FontWeight.bold, // Bold
    height: 1.4,
    letterSpacing: 0.1,
  );

  static const TextStyle titleBoldXl = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 36,
    fontWeight: FontWeight.bold, // Bold
    height: 1.2,
    letterSpacing: -0.5,
  );

  static const TextStyle titleMediumLg = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 20,
    fontWeight: FontWeight.w500, // Medium
    height: 1.3,
    letterSpacing: -0.2,
  );

  static const TextStyle titleBoldLg = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 20,
    fontWeight: FontWeight.bold, // Bold
    height: 1.3,
    letterSpacing: -0.2,
  );

  static const TextStyle titleRegularSm = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 13,
    fontWeight: FontWeight.normal, // Regular
    height: 1.4,
    letterSpacing: 0.1,
  );

  static const TextStyle titleMedium = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 18,
    fontWeight: FontWeight.w500, // Medium
    height: 1.3,
    letterSpacing: -0.1,
  );

  static const TextStyle titleMediumXs = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 12,
    fontWeight: FontWeight.w500, // Medium
    height: 1.4,
    letterSpacing: 0.2,
  );

  static const TextStyle titleRegularXs = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 12,
    fontWeight: FontWeight.normal, // Regular
    height: 1.4,
    letterSpacing: 0.2,
  );

  // Create TextTheme for Material Design integration
  static const TextTheme textTheme = TextTheme(
    // Map Figma styles to Material Design text roles
    headlineLarge: headingOne,
    headlineMedium: titleBoldXl,
    headlineSmall: headingTwo,
    
    titleLarge: titleMediumLg,
    titleMedium: titleMedium,
    titleSmall: titleMediumM,
    
    bodyLarge: titleRegularM,
    bodyMedium: titleRegularSm,
    bodySmall: titleRegularXs,
    
    labelLarge: titleBoldM,
    labelMedium: titleMediumXs,
    labelSmall: titleRegularXs,
  );
}

// Extension for easy access to custom text styles
extension AppTextStylesExtension on BuildContext {
  AppTextStyles get textStyles => AppTextStyles();
}

// Helper class for accessing text styles
class TextStyles {
  static const headingOne = AppTextStyles.headingOne;
  static const headingTwo = AppTextStyles.headingTwo;
  static const titleMediumM = AppTextStyles.titleMediumM;
  static const titleRegularM = AppTextStyles.titleRegularM;
  static const titleBoldM = AppTextStyles.titleBoldM;
  static const titleBoldXl = AppTextStyles.titleBoldXl;
  static const titleMediumLg = AppTextStyles.titleMediumLg;
  static const titleBoldLg = AppTextStyles.titleBoldLg;
  static const titleRegularSm = AppTextStyles.titleRegularSm;
  static const titleMedium = AppTextStyles.titleMedium;
  static const titleMediumXs = AppTextStyles.titleMediumXs;
  static const titleRegularXs = AppTextStyles.titleRegularXs;
}