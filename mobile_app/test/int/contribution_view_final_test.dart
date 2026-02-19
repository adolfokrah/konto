import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'package:Hoga/features/contribution/logic/bloc/fetch_contribution_bloc.dart';
import 'package:Hoga/features/contribution/presentation/views/contribution_view.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/core/di/service_locator.dart';
import '../lib/test_setup.dart';
import '../lib/api_mock_interceptor.dart';
import '../lib/test_router.dart';

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
      '{"id": "test-user-123", "email": "test@example.com", "firstName": "Test", "lastName": "User", "phoneNumber": "+1234567890", "countryCode": "US", "country": "United States", "kycStatus": "verified"}',
    );
  });

  tearDownAll(() {
    TestSetup.reset();
  });

  group('ContributionView Widget Tests', () {
    setUp(() {
      MockInterceptor.clearOverrides();
    });

    testWidgets('should render without crashing', (WidgetTester tester) async {
      final testWidget = MultiBlocProvider(
        providers: [
          BlocProvider.value(value: getIt<FetchContributionBloc>()),
          BlocProvider.value(value: getIt<JarSummaryBloc>()),
        ],
        child: MaterialApp.router(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('en'),
          routerConfig: createTestRouter(
            initialRoute: '/',
            routes: {
              '/': (context) => const ContributionView(),
            },
          ),
        ),
      );

      await tester.pumpWidget(testWidget);
      await tester.pump();

      expect(find.byType(ContributionView), findsOneWidget);
      expect(find.byType(DraggableScrollableSheet), findsOneWidget);
    });

    testWidgets('should show loading state when fetching data', (
      WidgetTester tester,
    ) async {
      final testWidget = MultiBlocProvider(
        providers: [
          BlocProvider.value(
            value:
                getIt<FetchContributionBloc>()
                  ..add(FetchContributionById('contrib-123')),
          ),
          BlocProvider.value(value: getIt<JarSummaryBloc>()),
        ],
        child: MaterialApp.router(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('en'),
          routerConfig: createTestRouter(
            initialRoute: '/',
            routes: {
              '/': (context) => const ContributionView(),
            },
          ),
        ),
      );

      await tester.pumpWidget(testWidget);
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should show error state when fetch fails', (
      WidgetTester tester,
    ) async {
      // Mock API to return error
      MockInterceptor.overrideEndpoint(
        '/transactions/contrib-123',
        (options) =>
            throw DioException(
              requestOptions: options,
              message: 'Contribution not found',
              type: DioExceptionType.badResponse,
              response: Response(
                requestOptions: options,
                statusCode: 404,
                data: {'message': 'Contribution not found'},
              ),
            ),
      );

      final testWidget = MultiBlocProvider(
        providers: [
          BlocProvider.value(
            value:
                getIt<FetchContributionBloc>()
                  ..add(FetchContributionById('contrib-123')),
          ),
          BlocProvider.value(value: getIt<JarSummaryBloc>()),
        ],
        child: MaterialApp.router(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('en'),
          routerConfig: createTestRouter(
            initialRoute: '/',
            routes: {
              '/': (context) => const ContributionView(),
            },
          ),
        ),
      );

      await tester.pumpWidget(testWidget);
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Failed to fetch contribution.'), findsOneWidget);
    });

    testWidgets('should show localized content', (WidgetTester tester) async {
      // Test English locale
      final englishWidget = MultiBlocProvider(
        providers: [
          BlocProvider.value(value: getIt<FetchContributionBloc>()),
          BlocProvider.value(value: getIt<JarSummaryBloc>()),
        ],
        child: MaterialApp.router(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('en'),
          routerConfig: createTestRouter(
            initialRoute: '/',
            routes: {
              '/': (context) => Scaffold(
                appBar: AppBar(title: const Text('Test')),
                body: Builder(
                  builder: (context) {
                    final localizations = AppLocalizations.of(context)!;
                    return Center(
                      child: Column(
                        children: [
                          Text(localizations.paymentMethod),
                          Text(localizations.status),
                          Text(localizations.charges),
                          Text(localizations.contributor),
                          Text(localizations.collector),
                        ],
                      ),
                    );
                  },
                ),
              ),
            },
          ),
        ),
      );

      await tester.pumpWidget(englishWidget);
      await tester.pumpAndSettle();

      // Verify English translations
      expect(find.text('Payment Method'), findsOneWidget);
      expect(find.text('Status'), findsOneWidget);
      expect(find.text('Charges'), findsOneWidget);
      expect(find.text('Contributor'), findsOneWidget);
      expect(find.text('Collector'), findsOneWidget);
    });

    testWidgets('should show French localized content', (
      WidgetTester tester,
    ) async {
      // Test French locale
      final frenchWidget = MultiBlocProvider(
        providers: [
          BlocProvider.value(value: getIt<FetchContributionBloc>()),
          BlocProvider.value(value: getIt<JarSummaryBloc>()),
        ],
        child: MaterialApp.router(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('fr'),
          routerConfig: createTestRouter(
            initialRoute: '/',
            routes: {
              '/': (context) => Scaffold(
                appBar: AppBar(title: const Text('Test')),
                body: Builder(
                  builder: (context) {
                    final localizations = AppLocalizations.of(context)!;
                    return Center(
                      child: Column(
                        children: [
                          Text(localizations.paymentMethod),
                          Text(localizations.status),
                          Text(localizations.charges),
                          Text(localizations.contributor),
                          Text(localizations.collector),
                        ],
                      ),
                    );
                  },
                ),
              ),
            },
          ),
        ),
      );

      await tester.pumpWidget(frenchWidget);
      await tester.pumpAndSettle();

      // Verify French translations
      expect(find.text('Méthode de paiement'), findsOneWidget);
      expect(find.text('Statut'), findsOneWidget);
      expect(find.text('Frais'), findsOneWidget);
      expect(find.text('Contributeur'), findsOneWidget);
      expect(find.text('Collecteur'), findsOneWidget);
    });
  });

  group('ContributionView Functionality Tests', () {
    setUp(() {
      MockInterceptor.clearOverrides();
    });

    testWidgets('should handle different BLoC states correctly', (
      WidgetTester tester,
    ) async {
      final testWidget = MultiBlocProvider(
        providers: [
          BlocProvider.value(value: getIt<FetchContributionBloc>()),
          BlocProvider.value(value: getIt<JarSummaryBloc>()),
        ],
        child: MaterialApp.router(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('en'),
          routerConfig: createTestRouter(
            initialRoute: '/',
            routes: {
              '/': (context) => const ContributionView(),
            },
          ),
        ),
      );

      await tester.pumpWidget(testWidget);
      await tester.pump();

      // Initial state: should not be loading since no event was triggered
      expect(find.byType(CircularProgressIndicator), findsNothing);

      // Should show the DraggableScrollableSheet structure
      expect(find.byType(DraggableScrollableSheet), findsOneWidget);
    });
  });
}
