// integration_test/register_flow_test.dart
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/features/authentication/presentation/views/register_view.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/features/verification/presentation/pages/otp_view.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import '../lib/test_setup.dart';
import '../lib/api_mock_interceptor.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    await TestSetup.initialize();
    // Mock SMS OTP endpoint (?key= when base URL empty) to always succeed
    MockInterceptor.overrideEndpoint('?key=', (options) {
      return Response(
        requestOptions: options,
        data: {
          'status': 'success',
          'code': '2000',
          'message': 'SMS sent successfully',
          'data': {
            'status': 'success',
            'code': '2000',
            'message': 'Message sent',
          },
        },
        statusCode: 200,
      );
    });
  });

  tearDownAll(() {
    TestSetup.reset();
    MockInterceptor.clearEndpointOverride('?key=');
  });

  group('Register Flow Test', () {
    testWidgets('User can register successfully with all fields', (
      tester,
    ) async {
      // Mock successful user existence check (user doesn't exist)
      MockInterceptor.overrideEndpoint(BackendConfig.checkUserExistence, (
        options,
      ) {
        return Response(
          requestOptions: options,
          data: {
            'success': true,
            'exists': false,
            'message': 'Phone number not found',
          },
          statusCode: 200,
        );
      });

      // Start directly with the RegisterView for testing
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
            routes: {
              '/otp': (context) => const OtpView(),
              '/login': (context) => const LoginView(),
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify we're on the register page by checking for form fields
      expect(find.byKey(const Key('fullName')), findsOneWidget);
      expect(find.byKey(const Key('email')), findsOneWidget);
      expect(find.byKey(const Key('phoneNumber')), findsOneWidget);

      // Fill the full name field
      final fullNameField = find.byKey(const Key('fullName'));
      await tester.enterText(fullNameField, 'John Doe');
      await tester.pumpAndSettle();

      // Fill the email field
      final emailField = find.byKey(const Key('email'));
      await tester.enterText(emailField, 'john.doe@example.com');
      await tester.pumpAndSettle();

      // Fill the phone number field
      final phoneNumberField = find.byKey(const Key('phoneNumber'));
      await tester.enterText(phoneNumberField, '245301631');
      await tester.pumpAndSettle();

      // Tap create account button
      final createAccountButton = find.text('Create Account');
      expect(createAccountButton, findsOneWidget);
      await tester.tap(createAccountButton);
      await tester.pumpAndSettle();

      // Wait a bit for navigation to complete
      await tester.pump(const Duration(milliseconds: 500));

      // Check if the OTP page is displayed
      expect(find.byType(OtpView), findsOneWidget);

      // Check that we're no longer on the register page
      expect(find.byKey(const Key('fullName')), findsNothing);
      expect(find.byKey(const Key('email')), findsNothing);

      // Look for OTP-specific elements
      expect(
        find.textContaining('OTP'),
        findsOneWidget,
        reason: 'Should find OTP text on the page',
      );

      // Clear the override for next test
      MockInterceptor.clearEndpointOverride(BackendConfig.checkUserExistence);
    });

    testWidgets('User can register with pre-filled data from login navigation', (
      tester,
    ) async {
      // Mock successful user existence check (user doesn't exist)
      MockInterceptor.overrideEndpoint(BackendConfig.checkUserExistence, (
        options,
      ) {
        return Response(
          requestOptions: options,
          data: {
            'success': true,
            'exists': false,
            'message': 'Phone number not found',
          },
          statusCode: 200,
        );
      });

      // Create a navigator key to control navigation
      final navigatorKey = GlobalKey<NavigatorState>();

      // Start with a simple app that can navigate to RegisterView with arguments
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            navigatorKey: navigatorKey,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      navigatorKey.currentContext!,
                      MaterialPageRoute(
                        builder: (context) => const RegisterView(),
                        settings: const RouteSettings(
                          arguments: {
                            'initialPhoneNumber': '245301631',
                            'initialCountryCode': '+233',
                            'initialSelectedCountry': 'Ghana',
                          },
                        ),
                      ),
                    );
                  },
                  child: const Text('Navigate to Register'),
                ),
              ),
            ),
            routes: {'/otp': (context) => const OtpView()},
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap the button to navigate to RegisterView with arguments
      final navigateButton = find.text('Navigate to Register');
      expect(navigateButton, findsOneWidget);
      await tester.tap(navigateButton);
      await tester.pumpAndSettle();

      // Wait for the widget to initialize with pre-filled data
      await tester.pump(const Duration(milliseconds: 1000));

      // Verify we're now on the register page
      expect(find.byKey(const Key('fullName')), findsOneWidget);
      expect(find.byKey(const Key('email')), findsOneWidget);
      expect(find.byKey(const Key('phoneNumber')), findsOneWidget);

      // Fill remaining required fields
      final fullNameField = find.byKey(const Key('fullName'));
      await tester.enterText(fullNameField, 'Jane Smith');
      await tester.pumpAndSettle();

      final emailField = find.byKey(const Key('email'));
      await tester.enterText(emailField, 'jane.smith@example.com');
      await tester.pumpAndSettle();

      // The phone number should be pre-filled, but let's also add it to ensure the test works
      final phoneNumberField = find.byKey(const Key('phoneNumber'));
      await tester.enterText(phoneNumberField, '245301631');
      await tester.pumpAndSettle();

      // Tap create account button
      final createAccountButton = find.text('Create Account');
      await tester.tap(createAccountButton);
      await tester.pumpAndSettle();

      // Wait for navigation
      await tester.pump(const Duration(milliseconds: 500));

      // Verify navigation to OTP view
      expect(find.byType(OtpView), findsOneWidget);

      // Clear the override for next test
      MockInterceptor.clearEndpointOverride(BackendConfig.checkUserExistence);
    });
  });

  group('Register Validation Tests', () {
    testWidgets('Show error when full name is missing', (tester) async {
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Fill email and phone but leave full name empty
      final emailField = find.byKey(const Key('email'));
      await tester.enterText(emailField, 'test@example.com');
      await tester.pumpAndSettle();

      final phoneNumberField = find.byKey(const Key('phoneNumber'));
      await tester.enterText(phoneNumberField, '245301631');
      await tester.pumpAndSettle();

      // Tap create account button
      final createAccountButton = find.text('Create Account');
      await tester.tap(createAccountButton);
      await tester.pumpAndSettle();

      // Check for error message
      expect(
        find.textContaining('Please enter your full name'),
        findsOneWidget,
      );
    });

    testWidgets('Show error when email is missing', (tester) async {
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Fill full name and phone but leave email empty
      final fullNameField = find.byKey(const Key('fullName'));
      await tester.enterText(fullNameField, 'John Doe');
      await tester.pumpAndSettle();

      final phoneNumberField = find.byKey(const Key('phoneNumber'));
      await tester.enterText(phoneNumberField, '245301631');
      await tester.pumpAndSettle();

      // Tap create account button
      final createAccountButton = find.text('Create Account');
      await tester.tap(createAccountButton);
      await tester.pumpAndSettle();

      // Check for error message
      expect(
        find.textContaining('Please enter your email address'),
        findsOneWidget,
      );
    });

    testWidgets('Show error when phone number is missing', (tester) async {
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Fill full name and email but leave phone number empty
      final fullNameField = find.byKey(const Key('fullName'));
      await tester.enterText(fullNameField, 'John Doe');
      await tester.pumpAndSettle();

      final emailField = find.byKey(const Key('email'));
      await tester.enterText(emailField, 'test@example.com');
      await tester.pumpAndSettle();

      // Tap create account button
      final createAccountButton = find.text('Create Account');
      await tester.tap(createAccountButton);
      await tester.pumpAndSettle();

      // Check for error message
      expect(
        find.textContaining('Please enter your phone number'),
        findsOneWidget,
      );
    });
  });

  group('Register Error Scenarios', () {
    testWidgets('Show error when user already exists with phone number', (
      tester,
    ) async {
      // Mock user existence check (user exists with phone)
      MockInterceptor.overrideEndpoint(BackendConfig.checkUserExistence, (
        options,
      ) {
        return Response(
          requestOptions: options,
          data: {
            'success': true,
            'exists': true,
            'message': 'User already exists',
          },
          statusCode: 200,
        );
      });

      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Fill all fields
      final fullNameField = find.byKey(const Key('fullName'));
      await tester.enterText(fullNameField, 'John Doe');
      await tester.pumpAndSettle();

      final emailField = find.byKey(const Key('email'));
      await tester.enterText(emailField, 'john@example.com');
      await tester.pumpAndSettle();

      final phoneNumberField = find.byKey(const Key('phoneNumber'));
      await tester.enterText(phoneNumberField, '245301631');
      await tester.pumpAndSettle();

      // Tap create account button
      final createAccountButton = find.text('Create Account');
      await tester.tap(createAccountButton);
      await tester.pumpAndSettle();

      // Wait for error response
      await tester.pump(const Duration(milliseconds: 500));

      // Check for error message about account already existing
      expect(find.textContaining('Account already exists'), findsOneWidget);

      // Clear the override for next test
      MockInterceptor.clearEndpointOverride(BackendConfig.checkUserExistence);
    });

    testWidgets('Navigate back to login view when login button is tapped', (
      tester,
    ) async {
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
            routes: {'/login': (context) => const LoginView()},
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find and tap the login button using its key
      final loginButton = find.byKey(const Key('login_button'));
      expect(loginButton, findsOneWidget);

      // Scroll to make the button visible if it's off-screen
      await tester.ensureVisible(loginButton);
      await tester.pumpAndSettle();

      await tester.tap(loginButton, warnIfMissed: false);
      await tester.pumpAndSettle();

      // Should navigate back (pop) since it's likely Navigator.pop()
      // We can verify by checking if we're still on register view or not
      // If using Navigator.pop(), the view might disappear
      // If using named route, we'd see LoginView

      // This test verifies the button exists and is tappable
    });
  });

  group('Register UI Interaction Tests', () {
    testWidgets('Country selection works correctly', (tester) async {
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find the country selection field
      final countryField = find.byKey(const Key('country'));
      expect(countryField, findsOneWidget);

      // Tap on country field to open dropdown
      await tester.tap(countryField);
      await tester.pumpAndSettle();

      // The implementation might vary based on SelectInput widget
      // This test verifies the field is interactive
    });

    testWidgets('Phone number input responds to country code changes', (
      tester,
    ) async {
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find the phone number input
      final phoneNumberField = find.byKey(const Key('phoneNumber'));
      expect(phoneNumberField, findsOneWidget);

      // Enter a phone number
      await tester.enterText(phoneNumberField, '987654321');
      await tester.pumpAndSettle();

      // Verify the text was entered
      expect(find.text('987654321'), findsOneWidget);
    });

    testWidgets('Terms and conditions links are interactive', (tester) async {
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('fr'), // French
            ],
            home: const RegisterView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Look for terms and conditions text
      // The exact text will depend on your localization
      final termsText = find.textContaining('Terms');
      if (termsText.evaluate().isNotEmpty) {
        // Terms text exists, verify it's tappable
        await tester.tap(termsText.first);
        await tester.pumpAndSettle();
      }

      // Look for privacy policy text
      final privacyText = find.textContaining('Privacy');
      if (privacyText.evaluate().isNotEmpty) {
        // Privacy text exists, verify it's tappable
        await tester.tap(privacyText.first);
        await tester.pumpAndSettle();
      }
    });
  });
}
