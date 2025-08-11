import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:konto/features/authentication/presentation/views/login_view.dart';
import 'package:konto/features/authentication/presentation/views/register_view.dart';
import 'package:konto/features/verification/presentation/pages/otp_view.dart';
import 'package:konto/features/home/presentation/views/home_view.dart';
import '../config/test_config.dart';
import '../utils/test_utils.dart';

void main() {
  group('Authentication End-to-End Tests', () {
    
    setUp(() async {
      // Clear any existing user data before each test
      TestConfig.isTestMode = true;
      await TestUtils.clearUserData();
    });

    tearDown(() {
      TestUtils.resetTestState();
    });

    group('Registration Flow', () {
      testWidgets('Complete registration flow with OTP', (WidgetTester tester) async {
        // Start with the full app
        await tester.pumpWidget(TestUtils.createFullTestApp());
        await TestUtils.waitForAsync(tester);

        // Should start at startup screen, then navigate to login (no auto-login data)
        await TestUtils.waitForWidget<LoginView>(tester);
        expect(find.byType(LoginView), findsOneWidget);

        // Navigate to registration
        await TestUtils.tapButtonWithText(tester, 'Register');
        await TestUtils.waitForWidget<RegisterView>(tester);
        
        // Fill out registration form
        await TestUtils.enterTextByKey(tester, 'fullName', TestConfig.testFullName);
        await TestUtils.enterTextByKey(tester, 'email', TestConfig.testEmail);
        await TestUtils.enterTextByKey(tester, 'phoneNumber', TestConfig.testPhoneNumber);
        
        // Select country (Ghana)
        await tester.tap(find.text('Select Country'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Ghana'));
        await tester.pumpAndSettle();

        // Submit registration form
        await TestUtils.tapButtonWithText(tester, 'Continue');
        await TestUtils.waitForAsync(tester);

        // Should navigate to OTP view
        await TestUtils.waitForWidget<OtpView>(tester);
        expect(find.byType(OtpView), findsOneWidget);

        // Enter the test OTP
        await TestUtils.enterTextByKey(tester, 'otpInput', TestConfig.testOtp);
        await TestUtils.tapButtonWithText(tester, 'Verify');
        await TestUtils.waitForAsync(tester);

        // Should navigate to home view after successful registration
        await TestUtils.waitForWidget<HomeView>(tester);
        expect(find.byType(HomeView), findsOneWidget);
        expect(find.text(TestConfig.testFullName), findsOneWidget);
      });

      testWidgets('Registration with invalid OTP shows error', (WidgetTester tester) async {
        await tester.pumpWidget(TestUtils.createFullTestApp());
        await TestUtils.waitForAsync(tester);

        // Navigate to registration and fill form
        await TestUtils.waitForWidget<LoginView>(tester);
        await TestUtils.tapButtonWithText(tester, 'Register');
        await TestUtils.waitForWidget<RegisterView>(tester);
        
        await TestUtils.enterTextByKey(tester, 'fullName', TestConfig.testFullName);
        await TestUtils.enterTextByKey(tester, 'email', TestConfig.testEmail);
        await TestUtils.enterTextByKey(tester, 'phoneNumber', TestConfig.testPhoneNumber);
        
        await tester.tap(find.text('Select Country'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Ghana'));
        await tester.pumpAndSettle();

        await TestUtils.tapButtonWithText(tester, 'Continue');
        await TestUtils.waitForWidget<OtpView>(tester);

        // Enter wrong OTP
        await TestUtils.enterTextByKey(tester, 'otpInput', '000000');
        await TestUtils.tapButtonWithText(tester, 'Verify');
        await TestUtils.waitForAsync(tester);

        // Should show error message
        expect(find.textContaining('Invalid OTP'), findsOneWidget);
        expect(find.byType(OtpView), findsOneWidget); // Still on OTP screen
      });
    });

    group('Login Flow', () {
      testWidgets('Complete login flow for existing user', (WidgetTester tester) async {
        // First register a user (setup)
        await _registerTestUser(tester);
        
        // Clear user data to simulate logged out state
        await TestUtils.clearUserData();
        
        // Start app again
        await tester.pumpWidget(TestUtils.createFullTestApp());
        await TestUtils.waitForAsync(tester);

        // Should be at login view
        await TestUtils.waitForWidget<LoginView>(tester);
        
        // Enter phone number
        await TestUtils.enterTextByKey(tester, 'phoneNumber', TestConfig.testPhoneNumber);
        
        // Select country
        await tester.tap(find.text('Select Country'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Ghana'));
        await tester.pumpAndSettle();

        // Submit phone number
        await TestUtils.tapButtonWithText(tester, 'Continue');
        await TestUtils.waitForAsync(tester);

        // Should navigate to OTP view
        await TestUtils.waitForWidget<OtpView>(tester);
        
        // Enter correct OTP
        await TestUtils.enterTextByKey(tester, 'otpInput', TestConfig.testOtp);
        await TestUtils.tapButtonWithText(tester, 'Verify');
        await TestUtils.waitForAsync(tester);

        // Should navigate to home view
        await TestUtils.waitForWidget<HomeView>(tester);
        expect(find.text(TestConfig.testFullName), findsOneWidget);
      });

      testWidgets('Login with non-existent phone number shows registration', (WidgetTester tester) async {
        await tester.pumpWidget(TestUtils.createFullTestApp());
        await TestUtils.waitForAsync(tester);

        await TestUtils.waitForWidget<LoginView>(tester);
        
        // Enter a phone number that doesn't exist
        await TestUtils.enterTextByKey(tester, 'phoneNumber', '9999999999');
        
        await tester.tap(find.text('Select Country'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Ghana'));
        await tester.pumpAndSettle();

        await TestUtils.tapButtonWithText(tester, 'Continue');
        await TestUtils.waitForAsync(tester);

        // Should navigate to registration view
        await TestUtils.waitForWidget<RegisterView>(tester);
        expect(find.byType(RegisterView), findsOneWidget);
      });
    });

    group('Auto-Login Flow', () {
      testWidgets('Auto-login with valid stored credentials', (WidgetTester tester) async {
        // First complete a registration to have stored credentials
        await _registerTestUser(tester);
        
        // Restart the app to test auto-login
        await tester.pumpWidget(TestUtils.createFullTestApp());
        await TestUtils.waitForAsync(tester);

        // Should automatically navigate to home view without login
        await TestUtils.waitForWidget<HomeView>(tester, timeout: const Duration(seconds: 15));
        expect(find.byType(HomeView), findsOneWidget);
        expect(find.text(TestConfig.testFullName), findsOneWidget);
      });

      testWidgets('Auto-login with no stored credentials shows login', (WidgetTester tester) async {
        // Ensure no stored credentials
        await TestUtils.clearUserData();
        
        await tester.pumpWidget(TestUtils.createFullTestApp());
        await TestUtils.waitForAsync(tester);

        // Should navigate to login view
        await TestUtils.waitForWidget<LoginView>(tester);
        expect(find.byType(LoginView), findsOneWidget);
      });
    });

    group('Sign Out Flow', () {
      testWidgets('Sign out from home view returns to login', (WidgetTester tester) async {
        // First login a user
        await _registerTestUser(tester);
        
        // Should be at home view
        expect(find.byType(HomeView), findsOneWidget);
        
        // Tap sign out button
        await tester.tap(find.byIcon(Icons.logout));
        await tester.pumpAndSettle();
        
        // Confirm sign out dialog
        await TestUtils.tapButtonWithText(tester, 'Sign Out');
        await TestUtils.waitForAsync(tester);
        
        // Should navigate back to login view
        await TestUtils.waitForWidget<LoginView>(tester);
        expect(find.byType(LoginView), findsOneWidget);
      });
    });
  });
}

/// Helper function to register a test user
Future<void> _registerTestUser(WidgetTester tester) async {
  await tester.pumpWidget(TestUtils.createFullTestApp());
  await TestUtils.waitForAsync(tester);

  await TestUtils.waitForWidget<LoginView>(tester);
  await TestUtils.tapButtonWithText(tester, 'Register');
  await TestUtils.waitForWidget<RegisterView>(tester);
  
  await TestUtils.enterTextByKey(tester, 'fullName', TestConfig.testFullName);
  await TestUtils.enterTextByKey(tester, 'email', TestConfig.testEmail);
  await TestUtils.enterTextByKey(tester, 'phoneNumber', TestConfig.testPhoneNumber);
  
  await tester.tap(find.text('Select Country'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Ghana'));
  await tester.pumpAndSettle();

  await TestUtils.tapButtonWithText(tester, 'Continue');
  await TestUtils.waitForWidget<OtpView>(tester);

  await TestUtils.enterTextByKey(tester, 'otpInput', TestConfig.testOtp);
  await TestUtils.tapButtonWithText(tester, 'Verify');
  await TestUtils.waitForWidget<HomeView>(tester);
}
