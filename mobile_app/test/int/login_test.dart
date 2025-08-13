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
import 'package:konto/features/home/presentation/views/home_view.dart';
import 'package:konto/l10n/app_localizations.dart';
import '../lib/test_setup.dart';
import '../lib/api_mock_interceptor.dart';


  void main() {
    IntegrationTestWidgetsFlutterBinding.ensureInitialized();

    setUpAll(() async {
      await TestSetup.initialize();
    });
    
    tearDownAll(() {
      TestSetup.reset();
    });

    group('Login Flow Test', () {
      testWidgets('User can log in successfully', (tester) async {
        // Start directly with the LoginView for testing
        await tester.pumpWidget(
          MultiBlocProvider(
            providers: [
              BlocProvider(create: (context) => AuthBloc()),
              BlocProvider(create: (context) => VerificationBloc()),
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
                '/home': (context) => const HomeView(),
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

        // Check if the OTP page is displayed by looking for multiple indicators
        // 1. Check if we're on the OTP view
        expect(find.byType(OtpView), findsOneWidget);
        
        // 2. Check that we're no longer on the login page
        expect(find.byKey(const Key('phone_number')), findsNothing);
        expect(find.byKey(const Key('login_button')), findsNothing);
        
        // 3. Look for OTP-specific elements (the actual text will be localized)
        // We can check for common OTP-related text patterns
        expect(find.textContaining('OTP'), findsOneWidget, reason: 'Should find OTP text on the page');

        // Wait a moment for the OTP input to be ready
        await tester.pump(const Duration(milliseconds: 300));
        
        // Find the OTP input fields (should be multiple TextFormField widgets)
        final otpFields = find.byType(TextFormField);
        expect(otpFields, findsWidgets, reason: 'Should find OTP input fields');
        
        // Get the number of OTP fields found
        final fieldCount = tester.widgetList(otpFields).length;
        
        // Enter OTP digits (let's use "123456" as test OTP)
        const testOtp = '123456';
        
        // Method 1: Try entering the complete OTP in the first field (for autofill/paste support)
        try {
          await tester.enterText(otpFields.first, testOtp);
          await tester.pumpAndSettle();
        } catch (e) {
          
          // Method 2: Enter digits individually in each field
          for (int i = 0; i < fieldCount && i < testOtp.length; i++) {
            final fieldFinder = otpFields.at(i);
            await tester.enterText(fieldFinder, testOtp[i]);
            await tester.pump(const Duration(milliseconds: 100));
          }
          await tester.pumpAndSettle();
        }

        // OTP verification happens automatically after filling all fields
        // Allow extra time for the automatic verification, login API call and navigation
        await tester.pump(const Duration(seconds: 3));
        await tester.pumpAndSettle();

        
        // Verify navigation to home view
        // We should no longer be on the OTP view
        expect(find.byType(OtpView), findsNothing, reason: 'Should have navigated away from OTP view');
        
        // Check if we're on the home view (adjust based on your actual home view implementation)
        expect(find.byType(HomeView), findsOneWidget, reason: 'Should have navigated to HomeView');
        
      });
    });

    group('Login Error Scenarios', () {
      testWidgets('Shows error when phone number does not exist', (tester) async {
        // Override the phone existence endpoint to return phone not found
        MockInterceptor.overrideEndpoint(BackendConfig.checkPhoneExistenceEndpoint, (options) {
          return Response(
            requestOptions: options,
            data: {
              'success': true,  // Changed to true so repository processes it correctly
              'exists': false,  // Phone doesn't exist
              'message': 'Phone number not found',
            },
            statusCode: 200,  // Changed to 200 for successful API call
          );
        });

        // Start with the LoginView
        await tester.pumpWidget(
          MultiBlocProvider(
            providers: [
              BlocProvider(create: (context) => AuthBloc()),
              BlocProvider(create: (context) => VerificationBloc()),
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
                '/home': (context) => const HomeView(),
                '/register': (context) => const RegisterView(), // Assuming you have a RegisterView
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
        expect(find.byType(RegisterView), findsOneWidget, 
               reason: 'Should have navigated to RegisterView when shouldRegister: true');

        // Clear the override for next test
        MockInterceptor.clearEndpointOverride(BackendConfig.checkPhoneExistenceEndpoint);
      });
    });
  }
