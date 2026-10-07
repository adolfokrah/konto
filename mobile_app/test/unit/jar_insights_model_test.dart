import 'package:flutter_test/flutter_test.dart';
import 'package:Hoga/features/insights/data/models/jar_insights_model.dart';

JarInsights _insights({
  double goal = 20000,
  double totalAllTime = 10000,
  String? deadline = '2025-10-25T00:00:00.000',
  String createdAt = '2025-10-05T00:00:00.000',
  int payments = 12,
}) => JarInsights.fromJson({
  'period': 'month',
  'total': 7940,
  'previousTotal': 5925,
  'changePct': 34,
  'currency': 'ghs',
  'paymentsCount': payments,
  'paymentsCountAllTime': payments,
  'byWeekday': [10, 20, 30, 40, 50, 100, 60],
  'bestWeekday': {'index': 5, 'multipleOfAverage': 2.4},
  'methodMix': [
    {'key': 'mtn', 'amount': 3800, 'pct': 48},
    {'key': 'cash', 'amount': 950, 'pct': 12},
  ],
  'topCollectors': [
    {'id': 'u1', 'name': 'Ama', 'amount': 6120, 'count': 40},
  ],
  'averageGift': 84.3,
  'contributorsCount': 148,
  'totalAllTime': totalAllTime,
  'goalAmount': goal,
  'deadline': deadline,
  'createdAt': createdAt,
});

void main() {
  group('JarInsights.fromJson', () {
    test('parses the endpoint payload', () {
      final i = _insights();
      expect(i.period, InsightsPeriod.month);
      expect(i.currency, 'GHS');
      expect(i.changePct, 34);
      expect(i.byWeekday.length, 7);
      expect(i.bestWeekdayIndex, 5);
      expect(i.bestWeekdayMultiple, 2.4);
      expect(i.methodMix.first.key, 'mtn');
      expect(i.topCollectors.single.name, 'Ama');
      expect(i.hasEnoughData, isTrue);
      expect(i.hasGoal, isTrue);
    });

    test('needs five payments before showing insights', () {
      expect(_insights(payments: 4).hasEnoughData, isFalse);
    });

    test('tolerates missing fields', () {
      final i = JarInsights.fromJson({'period': 'week'});
      expect(i.period, InsightsPeriod.week);
      expect(i.byWeekday, List.filled(7, 0.0));
      expect(i.bestWeekdayIndex, isNull);
      expect(i.changePct, isNull);
    });
  });

  group('goalForecastFor', () {
    final now = DateTime(2025, 10, 15, 12);

    test('projects the daily average to the deadline', () {
      final (f, gap) = goalForecastFor(_insights(), now: now);
      expect(gap, isNull);
      // 10,000 over 10 days, 10 days left -> 20,000
      expect(f!.daysElapsed, 10);
      expect(f.daysLeft, 10);
      expect(f.projected, closeTo(20000, 0.01));
      expect(f.onTrack, isTrue);
      expect(f.pctOfGoal.round(), 100);
    });

    test('flags a jar that is behind', () {
      final (f, _) = goalForecastFor(_insights(totalAllTime: 5000), now: now);
      expect(f!.onTrack, isFalse);
      expect(f.pctOfGoal.round(), 50);
    });

    test('explains when there is no forecast', () {
      expect(
        goalForecastFor(_insights(goal: 0), now: now).$2,
        GoalForecastGap.noGoal,
      );
      expect(
        goalForecastFor(_insights(deadline: null), now: now).$2,
        GoalForecastGap.noDeadline,
      );
      expect(
        goalForecastFor(
          _insights(deadline: '2025-10-01T00:00:00.000'),
          now: now,
        ).$2,
        GoalForecastGap.deadlinePassed,
      );
      expect(
        goalForecastFor(
          _insights(createdAt: '2025-10-14T00:00:00.000'),
          now: now,
        ).$2,
        GoalForecastGap.notEnoughData,
      );
    });
  });

  test('reads money out, defaulting to zero for older servers', () {
    final withPayouts = JarInsights.fromJson({
      'period': 'all',
      'total': 139,
      'paymentsCount': 5,
      'paymentsCountAllTime': 5,
      'transferredOut': 15,
      'transfersCount': 1,
    });
    expect(withPayouts.transferredOut, 15);
    expect(withPayouts.transfersCount, 1);
    // Payouts never count toward the 5-payment threshold.
    expect(withPayouts.hasEnoughData, isTrue);

    final older = JarInsights.fromJson({'period': 'all', 'total': 10});
    expect(older.transferredOut, 0);
    expect(older.transfersCount, 0);
  });
}
