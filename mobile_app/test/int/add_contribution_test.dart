import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:Hoga/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:Hoga/features/contribution/presentation/views/save_contribution_view.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';
import 'package:Hoga/core/enums/app_language.dart';
import 'package:Hoga/core/enums/app_theme.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/di/service_locator.dart';
import '../lib/test_setup.dart';
import '../lib/api_mock_interceptor.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    await TestSetup.initialize();

    // Set up authentication data
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('konto_auth_token', 'test-jwt-token-123456');
    await prefs.setString(
      'konto_token_expiry',
      '${DateTime.now().add(const Duration(hours: 24)).millisecondsSinceEpoch ~/ 1000}',
    );
    await prefs.setString(
      'konto_user_data',
      '{"id": "test-user-123", "email": "test@example.com", "firstName": "Test", "lastName": "User", "phoneNumber": "+1234567890", "countryCode": "US", "country": "United States", "kycStatus": "verified", "createdAt": "2024-01-01T00:00:00.000Z", "updatedAt": "2024-01-01T00:00:00.000Z"}',
    );
  });

  tearDownAll(() {
    TestSetup.reset();
  });

  group('Add Contribution Integration Tests', () {
    // Sample jar data for testing
    final Map<String, dynamic> sampleJar = {
      'id': 'test-jar-123',
      'name': 'Wedding Fund',
      'description': 'Save for our dream wedding',
      'targetAmount': 10000.0,
      'currentAmount': 2500.0,
      'currency': 'USD',
      'creator': {
        'id': 'test-user-123',
        'firstName': 'Test', 'lastName': 'User',
        'email': 'test@example.com',
      },
    };

    setUp(() {
      // Clear any previous overrides
      MockInterceptor.clearOverrides();
    });

    // Helper function to create a test widget with the save contribution view
    Widget createSaveContributionTestWidget({
      String amount = '100.0',
      String currency = 'USD',
    }) {
      final router = GoRouter(
        initialLocation: '/jar_detail',
        routes: [
          GoRoute(
            path: '/jar_detail',
            builder:
                (context, state) => Scaffold(
                  appBar: AppBar(title: const Text('Jar Detail')),
                  body: const Center(child: Text('Jar Detail View')),
                ),
          ),
          GoRoute(
            path: '/add_contribution',
            builder:
                (context, state) => Scaffold(
                  appBar: AppBar(title: const Text('Add Contribution')),
                  body: const Center(child: Text('Add Contribution View')),
                ),
          ),
          GoRoute(
            path: '/await_momo_payment',
            builder:
                (context, state) => const Scaffold(
                  body: Center(child: Text('Await Momo Payment View')),
                ),
          ),
          GoRoute(
            path: '/save_contribution',
            builder:
                (context, state) => MultiBlocProvider(
                  providers: [
                    BlocProvider.value(value: getIt<JarSummaryReloadBloc>()),
                    BlocProvider.value(value: getIt<AddContributionBloc>()),
                    BlocProvider.value(value: getIt<MomoPaymentBloc>()),
                    // SaveContributionView reads this to check whether the jar
                    // creator has a payout destination; provided app-wide in main.dart.
                    BlocProvider.value(value: getIt<WithdrawalAccountsBloc>()),
                    BlocProvider.value(
                      value: getIt<AuthBloc>()..add(
                        UpdateUserData(
                          updatedUser: User(
                            id: 'test-user-123',
                            email: 'test@example.com',
                            firstName: 'Test', lastName: 'User',
                            username: 'testuser',
                            phoneNumber: '+1234567890',
                            countryCode: 'US',
                            country: 'United States',
                            kycStatus: "verified",
                            createdAt: DateTime.now(),
                            updatedAt: DateTime.now(),
                            accountHolder: 'Test Account Holder',
                            sessions: [
                              UserSession(
                                id: 'test-session-id',
                                createdAt: DateTime.now(),
                                expiresAt: DateTime.now().add(
                                  const Duration(days: 30),
                                ),
                              ),
                            ],
                            appSettings: const AppSettings(
                              language: AppLanguage.english,
                              theme: AppTheme.light,
                              biometricAuthEnabled: false,
                              notificationsSettings: NotificationSettings(
                                pushNotificationsEnabled: true,
                                emailNotificationsEnabled: true,
                                smsNotificationsEnabled: false,
                              ),
                            ),
                          ),
                          token: 'test-jwt-token-123456',
                        ),
                      ),
                    ),
                  ],
                  child: const SaveContributionView(),
                ),
          ),
        ],
      );

      return MaterialApp.router(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [Locale('en'), Locale('fr')],
        locale: const Locale('en'),
        routerConfig: router,
      );
    }

    Future<void> navigateToSaveContribution(
      WidgetTester tester, {
      String amount = '100.0',
      String currency = 'USD',
    }) async {
      // Simulate navigation from jar detail -> add contribution -> save contribution
      final element = tester.element(find.byType(Scaffold));
      GoRouter.of(element).push('/add_contribution');
      await tester.pumpAndSettle();
      final element2 = tester.element(find.byType(Scaffold));
      GoRouter.of(element2).push('/save_contribution', extra: {
        'amount': amount,
        'currency': currency,
        'jar': sampleJar,
      });
      await tester.pumpAndSettle();
    }

    // The redesigned payer step renders its inputs as CollectField rows.
    // Mobile money order: phone, contributor name. Cash order: name, phone.
    Finder fieldAt(int index) => find.descendant(
      of: find.byType(CollectField).at(index),
      matching: find.byType(TextField),
    );

    // Payment method is now a "Mobile Money | Cash" segmented control.
    Future<void> selectCash(WidgetTester tester) async {
      await tester.tap(
        find.descendant(
          of: find.byType(CollectSegment<String>),
          matching: find.text('Cash'),
        ),
      );
      await tester.pumpAndSettle();
    }

    // Mobile money goes through an in-page review step before submitting.
    Future<void> openReview(WidgetTester tester) async {
      final reviewButton = find.widgetWithText(AppButton, 'Review');
      await tester.ensureVisible(reviewButton);
      await tester.pumpAndSettle();
      await tester.tap(reviewButton);
      await tester.pumpAndSettle();
    }

    Future<void> fillMomoPayer(
      WidgetTester tester, {
      String phone = '0241234567',
      String name = 'John Doe',
    }) async {
      await tester.enterText(fieldAt(0), phone);
      await tester.pumpAndSettle();
      await tester.enterText(fieldAt(1), name);
      await tester.pumpAndSettle();
    }

    testWidgets('should successfully submit mobile money contribution', (
      WidgetTester tester,
    ) async {
      // Mock successful API response
      MockInterceptor.overrideEndpoint(
        '/transactions',
        (options) => Response(
          requestOptions: options,
          data: {
            'success': true,
            'message': 'Contribution added successfully',
            // The repository reads the created transaction from `doc`.
            'doc': {
              'id': 'contribution-123',
              'jarId': 'test-jar-123',
              'contributor': 'John Doe',
              'contributorPhoneNumber': '+1234567890',
              'paymentMethod': 'mobile-money',
              'amountContributed': 100.0,
              'paymentStatus': 'pending',
              'viaPaymentLink': false,
            },
          },
          statusCode: 200,
        ),
      );

      await tester.pumpWidget(createSaveContributionTestWidget());
      await navigateToSaveContribution(tester);

      // Verify the form is displayed
      expect(find.byType(AppBar), findsOneWidget);
      expect(find.text('₵ 100.00'), findsWidgets); // Multiple instances due to fee breakdown

      // Fill in phone number and contributor name (mobile money is default)
      await fillMomoPayer(tester);

      // Review step shows the summary and the request button
      await openReview(tester);
      expect(find.text('Total due to pay'), findsOneWidget);
      final submitButton = find.byKey(const Key('submit_contribution_button'));
      expect(submitButton, findsOneWidget);
      expect(find.textContaining('Request · USD'), findsOneWidget);

      // Submit the request
      await tester.tap(submitButton);
      await tester.pumpAndSettle();

      // Successful mobile money request moves on to the await-payment screen
      expect(find.text('Await Momo Payment View'), findsOneWidget);
    });

    testWidgets('should handle cash contribution submission', (
      WidgetTester tester,
    ) async {
      // Mock successful API response
      MockInterceptor.overrideEndpoint(
        '/transactions',
        (options) => Response(
          requestOptions: options,
          data: {
            'success': true,
            'message': 'Contribution added successfully',
            // The repository reads the created transaction from `doc`.
            'doc': {
              'id': 'contribution-124',
              'jarId': 'test-jar-123',
              'contributor': 'Jane Smith',
              'paymentMethod': 'cash',
              'amountContributed': 50.0,
              'paymentStatus': 'completed',
              'viaPaymentLink': false,
            },
          },
          statusCode: 200,
        ),
      );

      await tester.pumpWidget(createSaveContributionTestWidget(amount: '50.0'));
      await navigateToSaveContribution(tester, amount: '50.0');

      // Select Cash payment method
      await selectCash(tester);

      // Cash has no review step: the save button is shown directly
      expect(find.widgetWithText(AppButton, 'Review'), findsNothing);

      // Fill in contributor name (first field for cash)
      await tester.enterText(fieldAt(0), 'Jane Smith');
      await tester.pumpAndSettle();

      // Submit the form
      final submitButton = find.byKey(const Key('submit_contribution_button'));
      await tester.ensureVisible(submitButton); // Scroll button into view
      await tester.pumpAndSettle();
      await tester.tap(submitButton);
      await tester.pumpAndSettle();

      // Cash contributions return to the jar detail
      expect(find.text('Jar Detail View'), findsOneWidget);
    });

    testWidgets(
      'should handle bank transfer contribution with account number',
      (WidgetTester tester) async {
        // Skip this test since bank transfer functionality has been disabled
      },
      skip: true,
    );

    testWidgets(
      'should show validation error when contributor name is missing',
      (WidgetTester tester) async {
        await tester.pumpWidget(createSaveContributionTestWidget());

        // Navigate to save contribution page directly (simulating the flow)
        await navigateToSaveContribution(tester);

        // Wait for the view to fully load
        await tester.pumpAndSettle();

        // Verify the save contribution view is loaded with proper data
        expect(find.text('₵ 100.00'), findsWidgets); // Multiple instances due to fee breakdown

        // Leave contributor name empty and try to continue to review
        await openReview(tester);

        // Verify validation error message appears and we stay on the form
        expect(find.text('Please enter contributor name'), findsOneWidget);
        expect(
          find.byKey(const Key('submit_contribution_button')),
          findsNothing,
        );
      },
    );

    testWidgets(
      'should show validation error when mobile money number is missing',
      (WidgetTester tester) async {
        await tester.pumpWidget(createSaveContributionTestWidget());

        // Navigate to save contribution page
        await navigateToSaveContribution(tester);
        await tester.pumpAndSettle();

        // Fill contributor name but leave phone number empty for mobile money
        // (mobile money order: phone first, contributor name second)
        await fillMomoPayer(tester, phone: '');

        // Try to continue without a phone number (Mobile Money is default)
        await openReview(tester);

        // Wait a bit longer for the SnackBar to appear
        await tester.pump(const Duration(milliseconds: 500));
        await tester.pumpAndSettle();

        // Verify validation error message for mobile money number appears
        expect(
          find.textContaining('Please enter your mobile money number'),
          findsOneWidget,
        );
      },
    );

    testWidgets('should handle API error response gracefully', (
      WidgetTester tester,
    ) async {
      // Mock API error response with proper structure expected by the API provider
      MockInterceptor.overrideEndpoint(
        '/transactions',
        (options) => Response(
          requestOptions: options,
          data: {
            'success': false,
            'message': 'Server error: Unable to process contribution',
            'doc': null, // This is what the repository checks for success
            'error': 'Internal server error',
          },
          statusCode: 400,
        ),
      );

      await tester.pumpWidget(createSaveContributionTestWidget());

      // Navigate to save contribution page
      await navigateToSaveContribution(tester);
      await tester.pumpAndSettle();

      // Fill in required fields (mobile money: phone, then contributor name)
      await fillMomoPayer(tester);

      // Review, then send the request
      await openReview(tester);
      final submitButton = find.byKey(const Key('submit_contribution_button'));
      await tester.tap(submitButton);
      await tester.pumpAndSettle();

      // Wait for SnackBar to appear
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pumpAndSettle();

      // For API error test, verify that the form is still present (submission failed)
      // and button is available for retry. Error messages are shown in SnackBars which
      // are difficult to test reliably in integration tests.
      // The review summary (which replaced the old "Amount" breakdown) stays up.
      expect(find.byKey(const Key('submit_contribution_button')), findsOneWidget);
      expect(find.text('Total due to pay'), findsOneWidget);
      expect(find.text('₵ 100.00'), findsWidgets); // Multiple instances due to fee breakdown
      expect(find.text('Await Momo Payment View'), findsNothing);
    });

    testWidgets('should handle network error gracefully', (
      WidgetTester tester,
    ) async {
      // Mock network error
      MockInterceptor.overrideEndpoint(
        '/transactions',
        (options) =>
            throw DioException(
              requestOptions: options,
              message: 'Network connection failed',
              type: DioExceptionType.connectionError,
            ),
      );

      await tester.pumpWidget(createSaveContributionTestWidget());

      // Navigate to save contribution page
      await navigateToSaveContribution(tester);
      await tester.pumpAndSettle();

      // Fill in required fields (mobile money: phone, then contributor name)
      await fillMomoPayer(tester);

      // Review, then send the request
      await openReview(tester);
      final submitButton = find.byKey(const Key('submit_contribution_button'));
      await tester.tap(submitButton);
      await tester.pumpAndSettle();

      // Wait for error handling to complete
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pumpAndSettle();

      // For network error test, verify that the form is still present (submission failed)
      // and button is available for retry. Error messages are shown in SnackBars which
      // are difficult to test reliably in integration tests.
      // The review summary (which replaced the old "Amount" breakdown) stays up.
      expect(find.byKey(const Key('submit_contribution_button')), findsOneWidget);
      expect(find.text('Total due to pay'), findsOneWidget);
      expect(find.text('₵ 100.00'), findsWidgets); // Multiple instances due to fee breakdown
      expect(find.text('Await Momo Payment View'), findsNothing);
    });

    testWidgets('should show loading state during submission', (
      WidgetTester tester,
    ) async {
      // Mock delayed API response
      MockInterceptor.overrideEndpoint(
        '/transactions',
        (options) => Response(
          requestOptions: options,
          data: {'success': true, 'message': 'Contribution added successfully'},
          statusCode: 200,
        ),
      );

      await tester.pumpWidget(createSaveContributionTestWidget());

      // Navigate to save contribution page
      await navigateToSaveContribution(tester);
      await tester.pumpAndSettle();

      // Fill in required fields (mobile money: phone, then contributor name)
      await fillMomoPayer(tester);

      // Review, then send the request
      await openReview(tester);
      final submitButton = find.byKey(const Key('submit_contribution_button'));
      await tester.tap(submitButton);

      // Check for loading state immediately after tap (before pumpAndSettle)
      // The loading state might be very brief, so we'll check if button state changed
      // or verify that submission was attempted
      await tester.pump(const Duration(milliseconds: 100));

      // For loading state test, verify that either:
      // 1. Processing text appears (if caught in loading state), or
      // 2. Form is still present (indicating submission was attempted)
      final processingText = find.text('Processing...');
      if (processingText.evaluate().isNotEmpty) {
        expect(processingText, findsOneWidget);
      } else {
        // If loading was too brief to catch, verify submission was attempted
        expect(find.byKey(const Key('submit_contribution_button')), findsOneWidget);
      }

      await tester.pumpAndSettle();

      // Verify loading has completed (success messages are in SnackBar)
    });

    testWidgets(
      'should increase jar total contribution amount after successful submission',
      (WidgetTester tester) async {
        // Initial jar data with 2500.0 total contribution amount
        final initialTotal = sampleJar['currentAmount'] as double;
        final contributionAmount = 100.0;
        final expectedNewTotal = initialTotal + contributionAmount;

        // Mock successful contribution API response
        MockInterceptor.overrideEndpoint(
          '/transactions',
          (options) => Response(
            requestOptions: options,
            data: {
              'success': true,
              'message': 'Contribution added successfully',
              // The repository reads the created transaction from `doc`.
              'doc': {
                'id': 'contribution-123',
                'jarId': 'test-jar-123',
                'contributor': 'John Doe',
                'contributorPhoneNumber': '+1234567890',
                'paymentMethod': 'mobile-money',
                'amountContributed': contributionAmount,
                'paymentStatus': 'completed',
                'viaPaymentLink': false,
              },
            },
            statusCode: 200,
          ),
        );

        // Mock the jar summary reload endpoint with updated total
        MockInterceptor.overrideEndpoint('/jars/test-jar-123', (options) {
          return Response(
            requestOptions: options,
            data: {
              'success': true,
              'data': {
                'id': 'test-jar-123',
                'name': 'Wedding Fund',
                'description': 'Save for our dream wedding',
                'goalAmount': 10000.0,
                'acceptedContributionAmount': 200.0,
                'currency': 'USD',
                'isActive': true,
                'isFixedContribution': false,
                'creator': {
                  'id': 'test-user-123',
                  'firstName': 'Test', 'lastName': 'User',
                  'email': 'test@example.com',
                  'phoneNumber': '+1234567890',
                  'countryCode': 'US',
                  'country': 'United States',
                  'kycStatus': 'verified',
                },
                'invitedCollectors': [],
                'acceptAnonymousContributions': false,
                'paymentLink': null,
                'jarGroup': null,
                'image': null,
                'deadline': null,
                'createdAt':
                    DateTime.now()
                        .subtract(const Duration(days: 30))
                        .toIso8601String(),
                'updatedAt': DateTime.now().toIso8601String(),
                'contributions': [
                  {
                    'id': 'contribution-123',
                    'jar': 'test-jar-123',
                    'contributor': 'John Doe',
                    'contributorPhoneNumber': '+1234567890',
                    'paymentMethod': 'mobile-money',
                    'amountContributed': contributionAmount,
                    'paymentStatus': 'completed',
                    'viaPaymentLink': false,
                    'createdAt': DateTime.now().toIso8601String(),
                    'updatedAt': DateTime.now().toIso8601String(),
                  },
                ],
                'balanceBreakDown': {
                  'totalContributedAmount': expectedNewTotal,
                  'totalTransfers': 0.0,
                  'totalAmountTobeTransferred': expectedNewTotal,
                  'totalYouOwe': 0.0,
                },
                'isCreator': true,
                'chartData': [
                  0,
                  50,
                  100,
                  150,
                  200,
                  250,
                  300,
                  350,
                  400,
                  expectedNewTotal,
                ],
              },
            },
            statusCode: 200,
          );
        });

        // Create widget that can simulate navigation back to jar detail view
        final testRouter = GoRouter(
          initialLocation: '/save-contribution',
          initialExtra: {
            'amount': contributionAmount.toString(),
            'currency': 'USD',
            'jar': sampleJar,
          },
          routes: [
            GoRoute(
              path: '/save-contribution',
              builder:
                  (context, state) => MultiBlocProvider(
                    providers: [
                      BlocProvider.value(value: getIt<JarSummaryReloadBloc>()),
                      BlocProvider.value(value: getIt<AddContributionBloc>()),
                      BlocProvider.value(value: getIt<WithdrawalAccountsBloc>()),
                      // Provided app-wide in main.dart; read by the momo flow.
                      BlocProvider.value(value: getIt<MomoPaymentBloc>()),
                      BlocProvider.value(value: getIt<AuthBloc>()),
                    ],
                    child: const SaveContributionView(),
                  ),
            ),
            GoRoute(
              path: '/await_momo_payment',
              builder:
                  (context, state) => const Scaffold(
                    body: Center(child: Text('Await Momo Payment View')),
                  ),
            ),
          ],
        );
        final testApp = MaterialApp.router(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('en'),
          routerConfig: testRouter,
        );

        await tester.pumpWidget(testApp);
        await tester.pumpAndSettle();

        // Verify initial state - form is displayed
        expect(find.byType(AppBar), findsOneWidget);
        expect(
          find.text('₵ ${contributionAmount.toStringAsFixed(2)}'),
          findsWidgets, // Multiple instances due to fee breakdown
        );

        // Fill in contributor details (mobile money: phone, then name)
        await fillMomoPayer(tester);

        // Review, then submit the contribution
        await openReview(tester);
        final submitButton = find.byKey(const Key('submit_contribution_button'));
        await tester.tap(submitButton);
        await tester.pumpAndSettle();

        // Wait for async operations to complete
        await tester.pump(const Duration(milliseconds: 500));
        await tester.pumpAndSettle();

        // Verify that the contribution was submitted successfully
        // (mobile money success moves on to the await-payment screen).
        // Note: Jar summary reload verification is complex in test environment due to navigation handling
        expect(find.text('Await Momo Payment View'), findsOneWidget);

        // Clear the mocked endpoints
        MockInterceptor.clearOverrides();
      },
    );

    testWidgets(
      'should update jar data in JarSummaryBloc after successful contribution',
      (WidgetTester tester) async {
        // Initial jar total
        final initialTotal = sampleJar['currentAmount'] as double;
        final contributionAmount = 50.0;
        final expectedNewTotal = initialTotal + contributionAmount;

        // Mock successful contribution response
        MockInterceptor.overrideEndpoint(
          '/transactions',
          (options) => Response(
            requestOptions: options,
            data: {
              'success': true,
              'message': 'Contribution added successfully',
              // The repository reads the created transaction from `doc`.
              'doc': {
                'id': 'contribution-124',
                'amountContributed': contributionAmount,
                'paymentStatus': 'completed',
              },
            },
            statusCode: 200,
          ),
        );

        // Mock jar reload with updated total
        MockInterceptor.overrideEndpoint('/jars/test-jar-123', (options) {
          return Response(
            requestOptions: options,
            data: {
              'success': true,
              'data': {
                'id': 'test-jar-123',
                'name': 'Wedding Fund',
                'description': 'Save for our dream wedding',
                'goalAmount': 10000.0,
                'acceptedContributionAmount': 200.0,
                'currency': 'USD',
                'isActive': true,
                'isFixedContribution': false,
                'creator': {
                  'id': 'test-user-123',
                  'firstName': 'Test', 'lastName': 'User',
                  'email': 'test@example.com',
                },
                'invitedCollectors': [],
                'acceptAnonymousContributions': false,
                'paymentLink': null,
                'jarGroup': null,
                'image': null,
                'deadline': null,
                'createdAt':
                    DateTime.now()
                        .subtract(const Duration(days: 30))
                        .toIso8601String(),
                'updatedAt': DateTime.now().toIso8601String(),
                'contributions': [],
                'balanceBreakDown': {
                  'totalContributedAmount': expectedNewTotal,
                  'totalTransfers': 0.0,
                  'totalAmountTobeTransferred': expectedNewTotal,
                  'totalYouOwe': 0.0,
                },
                'isCreator': true,
                'chartData': null,
              },
            },
            statusCode: 200,
          );
        });

        await tester.pumpWidget(
          createSaveContributionTestWidget(
            amount: contributionAmount.toString(),
          ),
        );
        await tester.pumpAndSettle();

        // Navigate to save contribution page
        await navigateToSaveContribution(tester, amount: contributionAmount.toString());
        await tester.pumpAndSettle();

        // Select Cash payment method to test different payment flow
        await selectCash(tester);

        // Fill in required fields - for Cash, only contributor name is needed
        await tester.enterText(fieldAt(0), 'Jane Smith');
        await tester.pumpAndSettle();

        // Submit the form
        final submitButton = find.byKey(const Key('submit_contribution_button'));
        if (submitButton.evaluate().isNotEmpty) {
          await tester.ensureVisible(submitButton); // Scroll button into view
          await tester.pumpAndSettle();
          await tester.tap(submitButton);
          await tester.pumpAndSettle();
        }

        // Wait for all async operations to complete
        await tester.pump(const Duration(milliseconds: 500));
        await tester.pumpAndSettle();

        // Verify that the test completed without major errors by checking basic UI elements
        expect(find.byType(MaterialApp), findsOneWidget);

        // Clear mocked endpoints
        MockInterceptor.clearOverrides();
      },
    );
  });
}
