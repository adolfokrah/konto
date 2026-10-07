import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_colors.dart';
import '../constants/app_radius.dart';
import 'text_styles.dart';

class AppTheme {
  /// Navy, cream and lime, Chillax + Supreme. Built from the active
  /// AppColors palette, so call AppColors.setBrightness first.
  static ThemeData get current {
    final dark = AppColors.isDark;
    final scheme =
        dark ? AppColors.darkColorScheme : AppColors.lightColorScheme;
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
      dividerTheme: DividerThemeData(
        color: AppColors.line,
        thickness: 1,
        space: 1,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.cream,
        surfaceTintColor: Colors.transparent,
        foregroundColor: AppColors.navy,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          // Icons contrast with the canvas: dark on cream, light on dark
          statusBarIconBrightness: dark ? Brightness.light : Brightness.dark,
          statusBarBrightness: dark ? Brightness.dark : Brightness.light, // iOS
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
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
          (s) =>
              s.contains(WidgetState.selected)
                  ? AppColors.lime
                  : AppColors.surfaceWhite,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (s) =>
              s.contains(WidgetState.selected)
                  ? AppColors.navy
                  : (dark ? AppColors.beige : const Color(0xFFDDD5CA)),
        ),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? AppColors.navy : null,
        ),
        checkColor: WidgetStateProperty.all(
          dark ? AppColors.onLime : AppColors.lime,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.all(AppColors.navy),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: AppColors.navy,
        linearTrackColor: AppColors.fill,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.navy,
        contentTextStyle: TextStyle(color: AppColors.surfaceWhite),
        behavior: SnackBarBehavior.floating,
      ),
      textSelectionTheme: TextSelectionThemeData(
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
}
