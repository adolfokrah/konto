import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_colors.dart';
import '../constants/app_radius.dart';
import 'text_styles.dart';

class AppTheme {
  /// The app is light-only (redesign): navy, cream and lime, Chillax + Supreme.
  static ThemeData get lightTheme {
    const scheme = AppColors.lightColorScheme;
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.cream,
      canvasColor: AppColors.cream,
      textTheme: AppTextStyles.textTheme.apply(
        bodyColor: AppColors.navy,
        displayColor: AppColors.navy,
      ),
      fontFamily: 'Supreme',
      splashFactory: InkSparkle.splashFactory,
      dividerTheme: const DividerThemeData(
        color: AppColors.line,
        thickness: 1,
        space: 1,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.cream,
        surfaceTintColor: Colors.transparent,
        foregroundColor: AppColors.navy,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark, // dark icons on cream
          statusBarBrightness: Brightness.light, // iOS
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surfaceWhite,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: AppColors.surfaceWhite,
        showDragHandle: false,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppRadius.radiusSheet),
          ),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.cream,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.radiusCard),
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceWhite,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.radiusCard),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? AppColors.lime
              : AppColors.surfaceWhite,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? AppColors.navy
              : const Color(0xFFDDD5CA),
        ),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? AppColors.navy : null,
        ),
        checkColor: WidgetStateProperty.all(AppColors.lime),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.all(AppColors.navy),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.navy,
        linearTrackColor: AppColors.fill,
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: AppColors.navy,
        contentTextStyle: TextStyle(color: AppColors.surfaceWhite),
        behavior: SnackBarBehavior.floating,
      ),
      textSelectionTheme: const TextSelectionThemeData(
        cursorColor: AppColors.navy,
        selectionHandleColor: AppColors.navy,
        selectionColor: AppColors.lime,
      ),
      tooltipTheme: const TooltipThemeData(
        waitDuration: Duration(milliseconds: 2000),
        showDuration: Duration(milliseconds: 1000),
        triggerMode: TooltipTriggerMode.longPress,
      ),
    );
  }

  /// Kept for reference; the app no longer uses a dark theme.
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: AppColors.darkColorScheme,
      textTheme: AppTextStyles.textTheme,
      fontFamily: 'Supreme',
      appBarTheme: const AppBarTheme(
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
      ),
    );
  }
}
