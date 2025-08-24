import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:konto/l10n/app_localizations.dart';

void main() {
  group('ContributionView Localization Tests', () {
    testWidgets('should have English failedToFetchContribution message', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('en'),
          home: Scaffold(
            body: Builder(
              builder:
                  (context) => Text(
                    AppLocalizations.of(context)!.failedToFetchContribution,
                  ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Failed to fetch contribution.'), findsOneWidget);
    });

    testWidgets('should have French failedToFetchContribution message', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('fr'),
          home: Scaffold(
            body: Builder(
              builder:
                  (context) => Text(
                    AppLocalizations.of(context)!.failedToFetchContribution,
                  ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(
        find.text('Échec de la récupération de la contribution.'),
        findsOneWidget,
      );
    });
  });
}
