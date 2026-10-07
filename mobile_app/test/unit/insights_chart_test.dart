import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:Hoga/features/insights/presentation/widgets/insights_widgets.dart';

void main() {
  Future<void> pump(WidgetTester tester, Widget child) => tester.pumpWidget(
    MaterialApp(home: Scaffold(body: SizedBox(width: 360, child: child))),
  );

  testWidgets('period chart shows the labels it is given', (tester) async {
    await pump(
      tester,
      const InsightsWeekdayBars(
        values: [20, 80, 100, 0, 0],
        labels: ['1-7', '8-14', '15-21', '22-28', '29-31'],
        highlight: 2,
      ),
    );
    for (final l in ['1-7', '8-14', '15-21', '22-28', '29-31']) {
      expect(find.text(l), findsOneWidget);
    }
    expect(find.text('Mon'), findsNothing);
  });

  testWidgets('12 monthly bars fit a phone width', (tester) async {
    const months = [
      'Nov',
      'Dec',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
    ];
    await pump(
      tester,
      InsightsWeekdayBars(values: List.filled(12, 10), labels: months),
    );
    expect(find.text('Oct'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
