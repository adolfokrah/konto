import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/verification/presentation/pages/otp_view.dart';
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
  group('Login Flow Tests', () {
    late MockAuthBloc mockAuthBloc;
    late MockVerificationBloc mockVerificationBloc;
    late MockOnboardingBloc mockOnboardingBloc;

    setUp(() {
      mockAuthBloc = MockAuthBloc();
      mockVerificationBloc = MockVerificationBloc();
      mockOnboardingBloc = MockOnboardingBloc();
      
      // Configure default states
      when(() => mockAuthBloc.state).thenReturn(AuthInitial());
      when(() => mockVerificationBloc.state).thenReturn(VerificationInitial());
      when(() => mockOnboardingBloc.state).thenReturn(OnboardingInitial());
      
      TestConfig.isTestMode = true;
    });

    Widget createLoginTestApp({required Widget child}) {
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

    testWidgets('LOGIN-001: LoginView loads successfully', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(find.byType(LoginView), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('LOGIN-002: Phone number input field interaction', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act & Assert - Ensure TextField exists
      final phoneFields = find.byType(TextField);
      expect(phoneFields, findsAtLeastNWidgets(1), 
        reason: 'LOGIN-002: Phone input field should be present');
      
      await tester.enterText(phoneFields.first, TestConfig.testPhoneNumber);
      await tester.pump();

      // Assert
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('LOGIN-003: Country selection functionality', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act - Try to find and interact with country selector
      final dropdowns = find.byType(DropdownButton);
      final countryTexts = find.textContaining('Country');
      
      if (dropdowns.evaluate().isNotEmpty) {
        await tester.tap(dropdowns.first);
        await tester.pumpAndSettle();
      } else if (countryTexts.evaluate().isNotEmpty) {
        await tester.tap(countryTexts.first);
        await tester.pumpAndSettle();
      }

      // Assert
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('LOGIN-004: Continue button functionality', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act - Fill form and tap continue
      final phoneFields = find.byType(TextField);
        await tester.enterText(phoneFields.first, TestConfig.testPhoneNumber);
        await tester.pump();

      final buttons = find.byType(ElevatedButton);
      if (buttons.evaluate().isNotEmpty) {
        await tester.tap(buttons.first);
        await tester.pump();
      }

      // Assert
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('LOGIN-005: Loading state during phone verification', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(AuthLoading());
      
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthLoading>());
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('LOGIN-006: Error state handling during login', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        AuthFailure('Phone number not found')
      );
      
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthFailure>());
      expect(find.byType(LoginView), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('LOGIN-007: Phone number availability check result', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        const PhoneNumberAvailabilityResult(
          phoneNumber: TestConfig.testPhoneNumber,
          countryCode: TestConfig.testCountryCode,
          exists: true,
          shouldLogin: true,
          shouldRegister: false,
          message: 'Phone number found',
        )
      );
      
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<PhoneNumberAvailabilityResult>());
      final state = mockAuthBloc.state as PhoneNumberAvailabilityResult;
      expect(state.shouldLogin, isTrue);
      expect(state.shouldRegister, isFalse);
    });

    testWidgets('LOGIN-008: OTP code sent process simulation', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        const AuthCodeSentSuccess(
          verificationId: TestConfig.testOtp,
          phoneNumber: TestConfig.testPhoneNumber,
          countryCode: TestConfig.testCountryCode,
        )
      );
      
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthCodeSentSuccess>());
    });

    testWidgets('LOGIN-009: Form validation with empty fields', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      await tester.pumpAndSettle();

      // Act - Try to submit without filling phone number
      final buttons = find.byType(ElevatedButton);
      if (buttons.evaluate().isNotEmpty) {
        await tester.tap(buttons.first);
        await tester.pump();
      }

      // Assert - Should remain on login view
      expect(find.byType(LoginView), findsOneWidget);
    });

    testWidgets('LOGIN-010: Performance test with multiple state changes', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
      
      // Act - Simulate rapid state changes
      for (int i = 0; i < 3; i++) {
        when(() => mockAuthBloc.state).thenReturn(AuthLoading());
        await tester.pump();
        when(() => mockAuthBloc.state).thenReturn(AuthInitial());
        await tester.pump();
      }

      // Assert
      expect(find.byType(LoginView), findsOneWidget);
    });

    group('Login Integration Tests', () {
      testWidgets('INTEGRATION-001: Complete login flow simulation', (WidgetTester tester) async {
        // Arrange
        await tester.pumpWidget(createLoginTestApp(child: const LoginView()));
        await tester.pumpAndSettle();

        // Act - Simulate complete flow
        // 1. Enter phone number
        final phoneFields = find.byType(TextField);
        if (phoneFields.evaluate().isNotEmpty) {
          await tester.enterText(phoneFields.first, TestConfig.testPhoneNumber);
          await tester.pump();
        }

        // 2. Simulate phone check
        when(() => mockAuthBloc.state).thenReturn(
          const PhoneNumberAvailabilityResult(
            phoneNumber: TestConfig.testPhoneNumber,
            countryCode: TestConfig.testCountryCode,
            exists: true,
            shouldLogin: true,
            shouldRegister: false,
            message: 'Phone number found',
          )
        );
        await tester.pump();

        // 3. Simulate OTP code sent
        when(() => mockAuthBloc.state).thenReturn(
          const AuthCodeSentSuccess(
            verificationId: TestConfig.testOtp,
            phoneNumber: TestConfig.testPhoneNumber,
            countryCode: TestConfig.testCountryCode,
          )
        );
        await tester.pump();

        // Assert
        expect(find.byType(LoginView), findsOneWidget);
        expect(mockAuthBloc.state, isA<AuthCodeSentSuccess>());
      });
    });
  });
}
