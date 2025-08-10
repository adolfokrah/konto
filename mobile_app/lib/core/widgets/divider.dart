import 'package:flutter/material.dart';

class AppDivider extends StatelessWidget {
  const AppDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return // Divider
      Divider(
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1), // theme-aware primary color
      );
  }
}