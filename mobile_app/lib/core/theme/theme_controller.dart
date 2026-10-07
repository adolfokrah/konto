import 'package:flutter/widgets.dart';
import 'package:Hoga/core/enums/app_theme.dart' as theme_enum;

/// Theme picked on this device in this session. Wins over the saved
/// preference so a switch shows at once, before the account update returns.
final themeOverride = ValueNotifier<theme_enum.AppTheme?>(null);

/// Marks every element dirty. AppColors are read straight from a static
/// palette, so widgets that don't depend on Theme need this to repaint.
void rebuildAllWidgets() {
  void mark(Element e) {
    e.markNeedsBuild();
    e.visitChildren(mark);
  }

  WidgetsBinding.instance.rootElement?.visitChildren(mark);
}
