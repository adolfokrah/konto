import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Creates a GoRouter for testing that routes to the provided widget map.
/// Usage:
/// ```dart
/// MaterialApp.router(
///   routerConfig: createTestRouter(
///     initialRoute: '/jar_detail',
///     routes: {
///       '/jar_detail': (context) => const JarDetailView(),
///       '/jar_goal': (context) => const JarGoalView(),
///     },
///   ),
/// )
/// ```
GoRouter createTestRouter({
  required String initialRoute,
  required Map<String, WidgetBuilder> routes,
}) {
  return GoRouter(
    initialLocation: initialRoute,
    routes: routes.entries.map((entry) {
      return GoRoute(
        path: entry.key,
        builder: (context, state) => entry.value(context),
      );
    }).toList(),
  );
}
