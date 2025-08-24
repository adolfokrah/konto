import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:konto/core/widgets/goal_progress_card.dart';
import 'package:konto/l10n/app_localizations.dart';

void main() {
  group('GoalProgressCard Tests', () {
    Widget createTestWidget(Widget child) {
      return MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [Locale('en'), Locale('fr')],
        locale: const Locale('en'),
        home: Scaffold(body: child),
      );
    }

    testWidgets(
      'should show "Goal Reached" when current amount >= goal amount',
      (WidgetTester tester) async {
        final deadline = DateTime.now().add(
          const Duration(days: 5),
        ); // Future date

        await tester.pumpWidget(
          createTestWidget(
            GoalProgressCard(
              currentAmount: 1500.0, // Greater than goal
              goalAmount: 1000.0,
              currency: 'usd',
              deadline: deadline,
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Should show "Goal Reached" instead of days left
        expect(find.text('Goal Reached'), findsOneWidget);
        expect(find.textContaining('days left'), findsNothing);
      },
    );

    testWidgets(
      'should show "Goal Reached" when current amount equals goal amount',
      (WidgetTester tester) async {
        final deadline = DateTime.now().add(
          const Duration(days: 5),
        ); // Future date

        await tester.pumpWidget(
          createTestWidget(
            GoalProgressCard(
              currentAmount: 1000.0, // Equal to goal
              goalAmount: 1000.0,
              currency: 'usd',
              deadline: deadline,
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Should show "Goal Reached" instead of days left
        expect(find.text('Goal Reached'), findsOneWidget);
        expect(find.textContaining('days left'), findsNothing);
      },
    );

    testWidgets(
      'should show days left when current amount < goal amount and not overdue',
      (WidgetTester tester) async {
        final deadline = DateTime.now().add(
          const Duration(days: 5),
        ); // Future date

        await tester.pumpWidget(
          createTestWidget(
            GoalProgressCard(
              currentAmount: 500.0, // Less than goal
              goalAmount: 1000.0,
              currency: 'usd',
              deadline: deadline,
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Should show days left
        expect(find.textContaining('days left'), findsOneWidget);
        expect(find.text('Goal Reached'), findsNothing);
        expect(find.text('Overdue'), findsNothing);
      },
    );

    testWidgets(
      'should show "Overdue" when current amount < goal amount and past deadline',
      (WidgetTester tester) async {
        final deadline = DateTime.now().subtract(
          const Duration(days: 2),
        ); // Past date

        await tester.pumpWidget(
          createTestWidget(
            GoalProgressCard(
              currentAmount: 500.0, // Less than goal
              goalAmount: 1000.0,
              currency: 'usd',
              deadline: deadline,
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Should show "Overdue" since deadline passed and goal not reached
        expect(find.text('Overdue'), findsOneWidget);
        expect(find.text('Goal Reached'), findsNothing);
        expect(find.textContaining('days left'), findsNothing);
      },
    );

    testWidgets(
      'should show "Goal Reached" even when past deadline if amount >= goal',
      (WidgetTester tester) async {
        final deadline = DateTime.now().subtract(
          const Duration(days: 2),
        ); // Past date

        await tester.pumpWidget(
          createTestWidget(
            GoalProgressCard(
              currentAmount: 1200.0, // Greater than goal
              goalAmount: 1000.0,
              currency: 'usd',
              deadline: deadline,
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Should show "Goal Reached" even though deadline passed
        expect(find.text('Goal Reached'), findsOneWidget);
        expect(find.text('Overdue'), findsNothing);
      },
    );

    testWidgets('should show French translation "Objectif Atteint"', (
      WidgetTester tester,
    ) async {
      final deadline = DateTime.now().add(
        const Duration(days: 5),
      ); // Future date

      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en'), Locale('fr')],
          locale: const Locale('fr'), // French locale
          home: Scaffold(
            body: GoalProgressCard(
              currentAmount: 1500.0, // Greater than goal
              goalAmount: 1000.0,
              currency: 'eur',
              deadline: deadline,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Should show French translation
      expect(find.text('Objectif Atteint'), findsOneWidget);
    });
  });
}
