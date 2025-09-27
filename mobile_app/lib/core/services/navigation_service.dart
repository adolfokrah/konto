import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/features/contribution/presentation/views/contribution_view.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'dart:async';

/// Service for handling deep navigation within the app
class NavigationService {
  static final NavigationService _instance = NavigationService._internal();
  factory NavigationService() => _instance;
  NavigationService._internal();

  /// Navigate to contribution view with jar and contribution context
  ///
  /// This implements the step-by-step flow:
  /// 1. User taps notification (handled by FCM)
  /// 2. Check type (handled in FCM service)
  /// 3. Set selected jar to jarId
  /// 4. Once jar is successfully loaded, open contribution view with contributionId
  static Future<void> navigateToContribution({
    required BuildContext context,
    required String jarId,
    required String contributionId,
  }) async {
    print(
      '🚀 Starting navigation to contribution: $contributionId in jar: $jarId',
    );

    // Step 3: Set selected jar to jarId
    final jarSummaryBloc = context.read<JarSummaryBloc>();

    // Save jar ID to storage first
    final jarStorageService = ServiceRegistry().jarStorageService;
    final saved = await jarStorageService.saveCurrentJarId(jarId);

    if (!saved) {
      print('❌ Failed to save jar ID to storage');
      return;
    }

    print('✅ Jar ID saved to storage: $jarId');

    // Listen for jar summary loading completion
    late StreamSubscription<JarSummaryState> jarStateSubscription;

    // Create a completer to track when jar is loaded
    final Completer<void> jarLoadedCompleter = Completer<void>();

    // Subscribe to jar summary state changes
    jarStateSubscription = jarSummaryBloc.stream.listen((state) {
      print('🔍 Jar summary state changed: ${state.runtimeType}');

      if (state is JarSummaryLoaded) {
        print('✅ Jar summary loaded successfully');
        if (!jarLoadedCompleter.isCompleted) {
          jarLoadedCompleter.complete();
        }
      } else if (state is JarSummaryError) {
        print('❌ Jar summary loading failed: ${state.message}');
        if (!jarLoadedCompleter.isCompleted) {
          jarLoadedCompleter.completeError(state.message);
        }
      }
    });

    try {
      // Request jar summary loading
      print('📨 Requesting jar summary for: $jarId');
      jarSummaryBloc.add(SetCurrentJarRequested(jarId: jarId));

      // Wait for jar to be loaded (with timeout)
      await jarLoadedCompleter.future.timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw TimeoutException(
            'Jar loading timed out',
            const Duration(seconds: 10),
          );
        },
      );

      // Step 4: Once jar is successfully loaded, open contribution view with contributionId
      print('🎯 Opening contribution view with ID: $contributionId');

      // Check if context is still valid before using it
      if (context.mounted) {
        // Navigate to contribution view
        ContributionView.show(context, contributionId);
      } else {
        print('❌ Context is no longer mounted, cannot show contribution view');
      }
    } catch (e) {
      print('❌ Error during navigation to contribution: $e');
    } finally {
      // Clean up subscription
      jarStateSubscription.cancel();
    }
  }

  /// Navigate to jar detail view
  static void navigateToJarDetail(BuildContext context, String jarId) {
    print('🏺 Navigating to jar detail: $jarId');

    // Set current jar and navigate
    final jarSummaryBloc = context.read<JarSummaryBloc>();
    jarSummaryBloc.add(SetCurrentJarRequested(jarId: jarId));

    Navigator.of(context).pushReplacementNamed('/jar_detail');
  }
}

class TimeoutException implements Exception {
  final String message;
  final Duration timeout;

  const TimeoutException(this.message, this.timeout);

  @override
  String toString() => 'TimeoutException: $message (timeout: $timeout)';
}
