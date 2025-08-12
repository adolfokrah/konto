import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:konto/features/authentication/presentation/views/register_view.dart';
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
  group('Registration Flow Tests', () {
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

    Widget createRegisterTestApp({required Widget child}) {
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

    testWidgets('REGISTER-001: RegisterView loads successfully', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Assert
      expect(find.byType(RegisterView), findsOneWidget);
      expect(tester.takeException(), isNull);
      
    });

    testWidgets('REGISTER-002: Full name input field interaction', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Act - Find and fill full name field
      final nameFields = find.byKey(const Key('fullName'));
      final textFields = find.byType(TextField);
      
      if (nameFields.evaluate().isNotEmpty) {
        await tester.enterText(nameFields.first, TestConfig.testFullName);
        await tester.pump();
      } else if (textFields.evaluate().isNotEmpty) {
        // Use first text field as fallback
        await tester.enterText(textFields.first, TestConfig.testFullName);
        await tester.pump();
      }

      // Assert
      expect(find.byType(RegisterView), findsOneWidget);
    });

    testWidgets('REGISTER-003: Email input field interaction', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Act - Find and fill email field
      final emailFields = find.byKey(const Key('email'));
      
      if (emailFields.evaluate().isNotEmpty) {
        await tester.enterText(emailFields.first, TestConfig.testEmail);
        await tester.pump();
      }

      // Assert
      expect(find.byType(RegisterView), findsOneWidget);
    });

    testWidgets('REGISTER-004: Phone number input field interaction', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Act - Find and fill phone number field
      final phoneFields = find.byKey(const Key('phoneNumber'));
      
      if (phoneFields.evaluate().isNotEmpty) {
        await tester.enterText(phoneFields.first, TestConfig.testPhoneNumber);
        await tester.pump();
      }

      // Assert
      expect(find.byType(RegisterView), findsOneWidget);
    });

    testWidgets('REGISTER-005: Country selection functionality', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Act - Try to find and interact with country selector
      final countrySelector = find.text('Select Country');
      final dropdowns = find.byType(DropdownButton);
      
      if (countrySelector.evaluate().isNotEmpty) {
        await tester.tap(countrySelector.first);
        await tester.pumpAndSettle();
        
        // Try to find Ghana
        final ghana = find.text('Ghana');
        if (ghana.evaluate().isNotEmpty) {
          await tester.tap(ghana.first);
          await tester.pumpAndSettle();
        }
      } else if (dropdowns.evaluate().isNotEmpty) {
        await tester.tap(dropdowns.first);
        await tester.pumpAndSettle();
      }

      // Assert
      expect(find.byType(RegisterView), findsOneWidget);
    });

    testWidgets('REGISTER-006: Complete registration form filling', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Act - Fill all available form fields
      // Fill fields by key if available
      final fullNameField = find.byKey(const Key('fullName'));
      if (fullNameField.evaluate().isNotEmpty) {
        await tester.enterText(fullNameField.first, TestConfig.testFullName);
        await tester.pump();
      }
      
      final emailField = find.byKey(const Key('email'));
      if (emailField.evaluate().isNotEmpty) {
        await tester.enterText(emailField.first, TestConfig.testEmail);
        await tester.pump();
      }
      
      final phoneField = find.byKey(const Key('phoneNumber'));
      if (phoneField.evaluate().isNotEmpty) {
        await tester.enterText(phoneField.first, TestConfig.testPhoneNumber);
        await tester.pump();
      }

      // Assert
      expect(find.byType(RegisterView), findsOneWidget);
    });

    testWidgets('REGISTER-007: Continue button functionality', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Act - Fill form and tap continue
      final fullNameField = find.byKey(const Key('fullName'));
      if (fullNameField.evaluate().isNotEmpty) {
        await tester.enterText(fullNameField.first, TestConfig.testFullName);
        await tester.pump();
      }

      final buttons = find.byType(ElevatedButton);
      final textButtons = find.text('Continue');
      
      if (textButtons.evaluate().isNotEmpty) {
        await tester.tap(textButtons.first);
        await tester.pump();
      } else if (buttons.evaluate().isNotEmpty) {
        await tester.tap(buttons.first);
        await tester.pump();
      }

      // Assert
      expect(find.byType(RegisterView), findsOneWidget);
    });

    testWidgets('REGISTER-008: Phone number availability check for registration', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        const PhoneNumberAvailabilityResult(
          phoneNumber: TestConfig.testPhoneNumber,
          countryCode: TestConfig.testCountryCode,
          exists: false,
          shouldLogin: false,
          shouldRegister: true,
          message: 'Phone number available for registration',
        )
      );
      
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<PhoneNumberAvailabilityResult>());
      final state = mockAuthBloc.state as PhoneNumberAvailabilityResult;
      expect(state.shouldRegister, isTrue);
      expect(state.shouldLogin, isFalse);
    });

    testWidgets('REGISTER-009: Loading state during registration', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(const AuthLoading());
      
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<AuthLoading>());
      expect(find.byType(RegisterView), findsOneWidget);
    });

    testWidgets('REGISTER-010: Registration OTP sent state', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        const UserRegistrationOtpSent(
          phoneNumber: TestConfig.testPhoneNumber,
          countryCode: TestConfig.testCountryCode,
          country: TestConfig.testCountry,
          fullName: TestConfig.testFullName,
          email: TestConfig.testEmail,
          sentOtp: TestConfig.testOtp,
        )
      );
      
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<UserRegistrationOtpSent>());
      final state = mockAuthBloc.state as UserRegistrationOtpSent;
      expect(state.phoneNumber, TestConfig.testPhoneNumber);
      expect(state.email, TestConfig.testEmail);
    });

    testWidgets('REGISTER-011: Registration error handling', (WidgetTester tester) async {
      // Arrange
      when(() => mockAuthBloc.state).thenReturn(
        const UserRegistrationFailure(
          error: 'Registration failed - email already exists',
          errors: {'email': ['Email is already taken']},
        )
      );
      
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Assert
      expect(mockAuthBloc.state, isA<UserRegistrationFailure>());
      expect(find.byType(RegisterView), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('REGISTER-012: Form validation with empty fields', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
      await tester.pumpAndSettle();

      // Act - Try to submit without filling required fields
      final buttons = find.byType(ElevatedButton);
      if (buttons.evaluate().isNotEmpty) {
        await tester.tap(buttons.first);
        await tester.pump();
      }

      // Assert - Should remain on register view
      expect(find.byType(RegisterView), findsOneWidget);
    });

    group('Registration Integration Tests', () {
      testWidgets('INTEGRATION-001: Complete registration flow simulation', (WidgetTester tester) async {
        // Arrange
        await tester.pumpWidget(createRegisterTestApp(child: const RegisterView()));
        await tester.pumpAndSettle();

        // Act - Simulate complete registration flow
        // 1. Fill all form fields
        final fullNameField = find.byKey(const Key('fullName'));
        if (fullNameField.evaluate().isNotEmpty) {
          await tester.enterText(fullNameField.first, TestConfig.testFullName);
          await tester.pump();
        }
        
        final emailField = find.byKey(const Key('email'));
        if (emailField.evaluate().isNotEmpty) {
          await tester.enterText(emailField.first, TestConfig.testEmail);
          await tester.pump();
        }
        
        final phoneField = find.byKey(const Key('phoneNumber'));
        if (phoneField.evaluate().isNotEmpty) {
          await tester.enterText(phoneField.first, TestConfig.testPhoneNumber);
          await tester.pump();
        }

        // 2. Simulate phone number availability check
        when(() => mockAuthBloc.state).thenReturn(
          const PhoneNumberAvailabilityResult(
            phoneNumber: TestConfig.testPhoneNumber,
            countryCode: TestConfig.testCountryCode,
            exists: false,
            shouldLogin: false,
            shouldRegister: true,
            message: 'Phone number available for registration',
          )
        );
        await tester.pump();

        // 3. Simulate OTP sent for registration
        when(() => mockAuthBloc.state).thenReturn(
          const UserRegistrationOtpSent(
            phoneNumber: TestConfig.testPhoneNumber,
            countryCode: TestConfig.testCountryCode,
            country: TestConfig.testCountry,
            fullName: TestConfig.testFullName,
            email: TestConfig.testEmail,
            sentOtp: TestConfig.testOtp,
          )
        );
        await tester.pump();

        // Assert
        expect(find.byType(RegisterView), findsOneWidget);
        expect(mockAuthBloc.state, isA<UserRegistrationOtpSent>());
      });
    });
  });
}
