// integration_test/login_flow_test.dart
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/authentication/presentation/views/register_view.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/features/verification/presentation/pages/otp_view.dart';
import 'package:konto/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/media/logic/bloc/media_bloc.dart';
import 'package:konto/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/features/jars/presentation/views/jar_detail_view.dart';
import 'package:konto/l10n/app_localizations.dart';
import '../lib/test_setup.dart';
import '../lib/api_mock_interceptor.dart';
import 'package:konto/core/services/sms_otp_service.dart';
// No repository override now; we mock network.

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    await TestSetup.initialize();
    // Mock SMS API endpoint to always succeed
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
  });

  group('Login Flow Test', () {
    testWidgets('User can log in successfully', (tester) async {
      // Ensure SmsOtpService test mode
      SmsOtpService.isTestMode = true;

      // Instead of mocking SMS endpoint (which was leading to VerificationFailure due to response parsing),
      // we fake the repository by supplying a bloc that uses our fake repo result manually.

      // Mock successful login after OTP verification
      MockInterceptor.overrideEndpoint('/users/login-with-phone', (options) {
        return Response(
          requestOptions: options,
          data: {
            'success': true,
            'message': 'Login successful',
            'token': 'mock_jwt_token_12345',
            'exp':
                DateTime.now()
                    .add(const Duration(hours: 24))
                    .millisecondsSinceEpoch,
            'user': {
              'id': 'test_user_123',
              'phoneNumber': '245301631',
              'countryCode': '+233',
              'fullName': 'Test User',
              'email': 'test@example.com',
              'country': 'Ghana',
              'isKYCVerified': false,
              'createdAt': DateTime.now().toIso8601String(),
              'updatedAt': DateTime.now().toIso8601String(),
              'sessions': [],
              'appSettings': {
                'language': 'en',
                'theme': 'light',
                'biometricAuthEnabled': false,
                'notificationsSettings': {
                  'pushNotificationsEnabled': true,
                  'emailNotificationsEnabled': true,
                  'smsNotificationsEnabled': false,
                },
              },
            },
          },
          statusCode: 200,
        );
      });

      // Start directly with the LoginView for testing
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(create: (context) => JarSummaryBloc()),
            BlocProvider(create: (context) => JarListBloc()),
            BlocProvider(create: (context) => MediaBloc()),
            BlocProvider(
              create:
                  (context) =>
                      UserAccountBloc(authBloc: context.read<AuthBloc>()),
            ),
            BlocProvider(create: (context) => UpdateJarBloc()),
            BlocProvider(
              create:
                  (context) => JarSummaryReloadBloc(
                    jarSummaryBloc: BlocProvider.of<JarSummaryBloc>(context),
                  ),
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
            home: const LoginView(),
            routes: {
              '/otp': (context) => const OtpView(),
              '/jar_detail': (context) => const JarDetailView(),
              '/home':
                  (context) =>
                      const JarDetailView(), // Add home route for successful login
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify we're on the login page by checking for the phone number field
      expect(find.byKey(const Key('phone_number')), findsOneWidget);

      // Find the form fields
      final phoneNumber = find.byKey(const Key('phone_number'));

      // Fill the number input
      await tester.enterText(phoneNumber, '245301631');
      await tester.pumpAndSettle();

      // Tap login
      final loginButton = find.byKey(const Key('login_button'));
      await tester.tap(loginButton);
      await tester.pumpAndSettle();

      // Wait a bit more for navigation to complete
      await tester.pump(const Duration(milliseconds: 500));

      // Since the test shows successful login -> direct navigation to /home
      // Let's check if we navigated directly to home (successful login flow)
      // OR if we're on OTP page (verification flow)

      final isOnOtpView = find.byType(OtpView).evaluate().isNotEmpty;
      final isOnHomeInitial = find.byType(JarDetailView).evaluate().isNotEmpty;

      if (isOnOtpView) {
        // OTP verification flow - test the actual input and navigation
        expect(find.byType(OtpView), findsOneWidget);
        print('📱 On OTP page, testing OTP input...');

        // Look for OTP-specific elements
        expect(
          find.text('Enter OTP'),
          findsOneWidget,
          reason: 'Should find "Enter OTP" text on the page',
        );

        // Debug: Check the verification bloc state
        final verificationBloc = BlocProvider.of<VerificationBloc>(
          tester.element(find.byType(OtpView)),
        );
        final currentState = verificationBloc.state;
        print('🔍 Current verification state: $currentState');
        if (currentState is VerificationCodeSent) {
          print('🔍 OTP in state: ${currentState.otpCode}');
        }

        // Wait a moment for the OTP input to be ready
        await tester.pump(const Duration(milliseconds: 500));

        // Find the OTP input fields
        final otpFields = find.byType(TextFormField);
        expect(otpFields, findsWidgets, reason: 'Should find OTP input fields');

        // Enter the test OTP (which should match the generated OTP in test mode: 123456)
        const testOtp = '123456';

        // Try entering the complete OTP in the first field
        try {
          await tester.enterText(otpFields.first, testOtp);
          await tester.pumpAndSettle();
          print('🔧 Entered OTP: $testOtp in first field');
        } catch (e) {
          // Enter digits individually in each field
          final fieldCount = tester.widgetList(otpFields).length;
          for (int i = 0; i < fieldCount && i < testOtp.length; i++) {
            final fieldFinder = otpFields.at(i);
            await tester.enterText(fieldFinder, testOtp[i]);
            await tester.pump(const Duration(milliseconds: 100));
            print('🔧 Entered digit: ${testOtp[i]} in field $i');
          }
          await tester.pumpAndSettle();
        }

        // Allow time for VerificationSuccess -> RequestLogin -> AuthAuthenticated -> navigation
        bool navigated = false;
        for (int i = 0; i < 8; i++) {
          await tester.pump(const Duration(milliseconds: 250));
          await tester.pumpAndSettle();
          if (find.byType(JarDetailView).evaluate().isNotEmpty) {
            navigated = true;
            break;
          }
        }
        expect(
          navigated,
          isTrue,
          reason: 'Should navigate to home after OTP verification and login',
        );
      } else if (isOnHomeInitial) {
        // Direct login success flow (no OTP required)
        expect(
          find.byType(JarDetailView),
          findsOneWidget,
          reason:
              'Should have navigated directly to home after successful login',
        );

        // Should not be on login page anymore
        expect(find.byKey(const Key('phone_number')), findsNothing);
        expect(find.byKey(const Key('login_button')), findsNothing);
      } else {
        throw Exception(
          'Expected to be either on OTP view or Home view after login, but found neither',
        );
      }
    });
  });

  group('Login Error Scenarios', () {
    testWidgets('Navigate to register view if phone number does not exist', (
      tester,
    ) async {
      // Override the user existence endpoint to return user not found
      MockInterceptor.overrideEndpoint(BackendConfig.checkUserExistence, (
        options,
      ) {
        return Response(
          requestOptions: options,
          data: {
            'success':
                true, // Changed to true so repository processes it correctly
            'exists': false, // User doesn't exist
            'message': 'Phone number not found',
          },
          statusCode: 200, // Changed to 200 for successful API call
        );
      });

      // Start with the LoginView
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(create: (context) => JarSummaryBloc()),
            BlocProvider(create: (context) => JarListBloc()),
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
            home: const LoginView(),
            routes: {
              '/jar_detail': (context) => const JarDetailView(),
              '/register':
                  (context) =>
                      const RegisterView(), // Assuming you have a RegisterView
              '/home': (context) => const JarDetailView(), // Add home route
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Fill the number input with non-existing phone
      final phoneNumber = find.byKey(const Key('phone_number'));
      await tester.enterText(phoneNumber, '999999999');
      await tester.pumpAndSettle();

      // Tap login
      final loginButton = find.byKey(const Key('login_button'));
      await tester.tap(loginButton);
      await tester.pumpAndSettle();

      // Wait for error response and potential navigation
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pumpAndSettle();

      // ✅ Navigation to RegisterView should now work
      expect(
        find.byType(RegisterView),
        findsOneWidget,
        reason:
            'Should have navigated to RegisterView when shouldRegister: true',
      );

      // Clear the override for next test
      MockInterceptor.clearEndpointOverride(BackendConfig.checkUserExistence);
    });

    testWidgets('User want to login without phone number', (tester) async {
      // Start with the LoginView
      await tester.pumpWidget(
        MultiBlocProvider(
          providers: [
            BlocProvider(create: (context) => AuthBloc()),
            BlocProvider(create: (context) => VerificationBloc()),
            BlocProvider(create: (context) => JarSummaryBloc()),
            BlocProvider(create: (context) => JarListBloc()),
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
            home: const LoginView(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap login without entering phone number
      final loginButton = find.byKey(const Key('login_button'));
      await tester.tap(loginButton);
      await tester.pumpAndSettle();

      // Check for error message
      expect(
        find.textContaining('Please enter a phone number'),
        findsOneWidget,
      );
    });
  });
}
