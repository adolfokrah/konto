import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/main.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/services/local_storage_service.dart';
import 'package:konto/core/services/sms_otp_service.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/authentication/data/models/user.dart';
import 'package:konto/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:konto/features/onboarding/data/repositories/onboarding_repository.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import '../config/test_config.dart';

/// Test utilities for widget testing
class TestUtils {
  /// Create a testable app with mock services
  static Widget createTestApp({
    required Widget home,
    bool enableTestMode = true,
  }) {
    if (enableTestMode) {
      TestConfig.isTestMode = true;
      SmsOtpService.isTestMode = true;
      ServiceRegistry().initialize();
    }

    final localStorageService = LocalStorageService();
    final onboardingRepository = OnboardingRepository(
      localStorageService: localStorageService,
    );

    return MaterialApp(
      home: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (context) => OnboardingBloc(
              onboardingRepository: onboardingRepository,
            ),
          ),
          BlocProvider(
            create: (context) => AuthBloc(),
          ),
          BlocProvider(
            create: (context) => VerificationBloc(),
          ),
        ],
        child: home,
      ),
    );
  }

  /// Create the full app for integration tests
  static Widget createFullTestApp() {
    TestConfig.isTestMode = true;
    SmsOtpService.isTestMode = true;
    ServiceRegistry().initialize();
    return const MainApp();
  }
  
  /// Reset test state
  static void resetTestState() {
    TestConfig.isTestMode = true;
    SmsOtpService.isTestMode = true;
  }
  
  /// Wait for async operations with tester
  static Future<void> waitForAsync(WidgetTester tester, [Duration? duration]) async {
    await Future.delayed(duration ?? const Duration(milliseconds: 100));
    await tester.pumpAndSettle();
  }

  /// Wait for a specific widget type to appear
  static Future<void> waitForWidget<T>(
    WidgetTester tester, {
    Duration timeout = const Duration(seconds: 10),
  }) async {
    final startTime = DateTime.now();
    while (DateTime.now().difference(startTime) < timeout) {
      await tester.pumpAndSettle();
      if (find.byType(T).evaluate().isNotEmpty) {
        return;
      }
      await Future.delayed(const Duration(milliseconds: 100));
    }
    throw Exception('Widget of type "${T.toString()}" not found within timeout');
  }

  /// Find a widget by its key
  static Finder findByKey(String key) {
    return find.byKey(Key(key));
  }

  /// Find a text widget
  static Finder findByText(String text) {
    return find.text(text);
  }

  /// Enter text in a field by key
  static Future<void> enterTextByKey(
    WidgetTester tester,
    String key,
    String text,
  ) async {
    await tester.enterText(findByKey(key), text);
    await tester.pumpAndSettle();
  }

  /// Tap a button by key
  static Future<void> tapByKey(WidgetTester tester, String key) async {
    await tester.tap(findByKey(key));
    await tester.pumpAndSettle();
  }

  /// Tap a button by text
  static Future<void> tapButtonWithText(WidgetTester tester, String text) async {
    await tester.tap(find.text(text));
    await tester.pumpAndSettle();
  }

  /// Verify that a widget exists
  static void expectWidgetExists(String key) {
    expect(findByKey(key), findsOneWidget);
  }

  /// Verify that a text exists
  static void expectTextExists(String text) {
    expect(findByText(text), findsOneWidget);
  }

  /// Clear all user data from storage
  static Future<void> clearUserData() async {
    try {
      ServiceRegistry().initialize();
      await ServiceRegistry().userStorageService.clearUserData();
    } catch (e) {
      debugPrint('Failed to clear user data: $e');
    }
  }
}
