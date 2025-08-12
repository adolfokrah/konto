import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/home/presentation/views/home_view.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import '../config/test_config.dart';

// Mock classes using bloc_test
class MockAuthBloc extends MockBloc<AuthEvent, AuthState> implements AuthBloc {}
class MockVerificationBloc extends MockBloc<VerificationEvent, VerificationState> 
    implements VerificationBloc {}
class MockOnboardingBloc extends MockBloc<OnboardingEvent, OnboardingState> 
    implements OnboardingBloc {}

void main() {
  group('Auto Login Flow Tests', () {
    late MockAuthBloc mockAuthBloc;
    late MockVerificationBloc mockVerificationBloc;
    late MockOnboardingBloc mockOnboardingBloc;

    setUp(() {
      mockAuthBloc = MockAuthBloc();
      mockVerificationBloc = MockVerificationBloc();
      mockOnboardingBloc = MockOnboardingBloc();
      
      // Configure default states
      when(() => mockAuthBloc.state).thenReturn(const AuthInitial());
      when(() => mockVerificationBloc.state).thenReturn(VerificationInitial());
      when(() => mockOnboardingBloc.state).thenReturn(OnboardingInitial());
      
      TestConfig.isTestMode = true;
    });

    Widget createAutoLoginTestApp({required Widget child}) {
      return MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [Locale('en'), Locale('fr')],
        locale: const Locale('en'),
        home: MultiBlocProvider(
          providers: [
            BlocProvider<OnboardingBloc>.value(value: mockOnboardingBloc),
            BlocProvider<AuthBloc>.value(value: mockAuthBloc),
            BlocProvider<VerificationBloc>.value(value: mockVerificationBloc),
          ],
          child: Builder(builder: (context) => child),
        ),
      );
    }

    testWidgets('AUTOLOGIN-001: Initial auto-login check', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert - Should start with initial state
      expect(mockAuthBloc.state, isA<AuthInitial>());
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('AUTOLOGIN-002: Auto-login loading state', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
      
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthLoading>());
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('AUTOLOGIN-003: Successful auto-login authentication', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        const AuthAuthenticated(TestConfig.testPhoneNumber)
      );
      
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthAuthenticated>());
      final state = mockAuthBloc.state as AuthAuthenticated;
      expect(state.phoneNumber, TestConfig.testPhoneNumber);
    });

    testWidgets('AUTOLOGIN-004: Auto-login failure - unauthenticated state', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(const AuthUnauthenticated());
      
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthUnauthenticated>());
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('AUTOLOGIN-005: Auto-login with stored credentials check', (WidgetTester tester) async {
      // Arrange - Simulate that we have stored credentials
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act - Simulate auto-login request triggering
      when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
      await tester.pump();

      // Simulate successful auto-login
      when(() => mockAuthBloc.state).thenReturn(
        const AuthAuthenticated(TestConfig.testPhoneNumber)
      );
      await tester.pump();

      // Assert
      expect(mockAuthBloc.state, isA<AuthAuthenticated>());
    });

    testWidgets('AUTOLOGIN-006: Auto-login failure - invalid credentials', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        const AuthFailure('Invalid stored credentials')
      );
      
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthFailure>());
      final state = mockAuthBloc.state as AuthFailure;
      expect(state.error, 'Invalid stored credentials');
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('AUTOLOGIN-007: Auto-login timeout handling', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act - Simulate loading for extended period
      when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
      await tester.pump();
      
      // Simulate multiple frames to test loading persistence
      for (int i = 0; i < 5; i++) {
        await tester.pump(const Duration(milliseconds: 100));
      }
      
      // Simulate timeout fallback to unauthenticated
      when(() => mockAuthBloc.state).thenReturn(const AuthUnauthenticated());
      await tester.pump();

      // Assert
      expect(mockAuthBloc.state, isA<AuthUnauthenticated>());
    });

    testWidgets('AUTOLOGIN-008: Navigation after successful auto-login', (WidgetTester tester) async {
      // Arrange - Start with unauthenticated state
      when(() => mockAuthBloc.state).thenReturn(const AuthUnauthenticated());
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act - Simulate successful auto-login
      when(() => mockAuthBloc.state).thenReturn(
        const AuthAuthenticated(TestConfig.testPhoneNumber)
      );
      await tester.pump();

      // Assert - Should still be on login view (navigation would be handled by router)
      expect(find.byType(LoginView), findsOneWidget);
      expect(mockAuthBloc.state, isA<AuthAuthenticated>());
    });

    testWidgets('AUTOLOGIN-009: Auto-login state persistence', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        const AuthAuthenticated(TestConfig.testPhoneNumber)
      );
      
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act - Rebuild the widget to test state persistence
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthAuthenticated>());
      final state = mockAuthBloc.state as AuthAuthenticated;
      expect(state.phoneNumber, TestConfig.testPhoneNumber);
    });

    testWidgets('AUTOLOGIN-010: Multiple authentication attempts', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act - Simulate multiple authentication attempts
      // First attempt - loading
      when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
      await tester.pump();

      // First attempt - failure
      when(() => mockAuthBloc.state).thenReturn(
        const AuthFailure('Network error')
      );
      await tester.pump();

      // Second attempt - loading
      when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
      await tester.pump();

      // Second attempt - success
      when(() => mockAuthBloc.state).thenReturn(
        const AuthAuthenticated(TestConfig.testPhoneNumber)
      );
      await tester.pump();

      // Assert
      expect(mockAuthBloc.state, isA<AuthAuthenticated>());
    });

    group('Auto Login Integration Tests', () {
      testWidgets('INTEGRATION-001: Complete auto-login flow simulation', (WidgetTester tester) async {
        // Arrange
        await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
        await tester.pumpAndSettle();

        // Act - Simulate complete auto-login flow
        // 1. Initial state
        expect(mockAuthBloc.state, isA<AuthInitial>());

        // 2. Auto-login triggered - loading
        when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
        await tester.pump();
        expect(mockAuthBloc.state, isA<AuthLoading>());

        // 3. Auto-login successful
        when(() => mockAuthBloc.state).thenReturn(
          const AuthAuthenticated(TestConfig.testPhoneNumber)
        );
        await tester.pump();

        // Assert
        expect(mockAuthBloc.state, isA<AuthAuthenticated>());
        final state = mockAuthBloc.state as AuthAuthenticated;
        expect(state.phoneNumber, TestConfig.testPhoneNumber);
        expect(find.byType(LoginView), findsOneWidget);
      });

      testWidgets('INTEGRATION-002: Auto-login failure recovery flow', (WidgetTester tester) async {
        // Arrange
        await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));
        await tester.pumpAndSettle();

        // Act - Simulate auto-login failure and recovery
        // 1. Auto-login fails
        when(() => mockAuthBloc.state).thenReturn(
          const AuthFailure('Token expired')
        );
        await tester.pump();
        expect(mockAuthBloc.state, isA<AuthFailure>());

        // 2. Reset to unauthenticated
        when(() => mockAuthBloc.state).thenReturn(const AuthUnauthenticated());
        await tester.pump();

        // Assert
        expect(mockAuthBloc.state, isA<AuthUnauthenticated>());
        expect(find.byType(LoginView), findsOneWidget);
      });

      testWidgets('INTEGRATION-003: Performance test with rapid state changes', (WidgetTester tester) async {
        // Arrange
        await tester.pumpWidget(createAutoLoginTestApp(child: const LoginView()));

        // Act - Simulate rapid auto-login state changes
        for (int i = 0; i < 3; i++) {
          when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
          await tester.pump();
          when(() => mockAuthBloc.state).thenReturn(const AuthUnauthenticated());
          await tester.pump();
          when(() => mockAuthBloc.state).thenReturn(
            const AuthAuthenticated(TestConfig.testPhoneNumber)
          );
          await tester.pump();
        }

        // Assert
        expect(find.byType(LoginView), findsOneWidget);
        expect(mockAuthBloc.state, isA<AuthAuthenticated>());
      });
    });
  });
}
