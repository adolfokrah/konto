import 'package:flutter/widgets.dart';
import 'package:Hoga/core/constants/app_colors.dart';

/// Marks a subtree as the body of a white bottom sheet.
///
/// On full-screen pages, inputs, segments and boxed buttons sit on the cream
/// background with an [AppColors.fill] surface. Inside a white sheet those
/// same surfaces use the app background colour ([AppColors.cream]) instead.
/// Shared widgets call [SheetSurface.fillOf] so they pick the right one.
class SheetSurface extends InheritedWidget {
  const SheetSurface({super.key, required super.child});

  /// Whether [context] sits inside a bottom sheet body.
  static bool isIn(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<SheetSurface>() != null;

  /// Fill colour for inner surfaces: cream in sheets, fill on pages.
  static Color fillOf(BuildContext context) =>
      isIn(context) ? AppColors.cream : AppColors.fill;

  @override
  bool updateShouldNotify(SheetSurface oldWidget) => false;
}
