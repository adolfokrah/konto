/// Time window the Insights tab shows.
enum InsightsPeriod {
  week('week', 'Week'),
  month('month', 'Month'),
  all('all', 'All time');

  final String apiValue;
  final String label;
  const InsightsPeriod(this.apiValue, this.label);
}

/// Payment-mix bucket ('mtn' | 'telecel' | 'airteltigo' | 'card' | 'cash' | 'other').
class InsightsMethodShare {
  final String key;
  final double amount;
  final int pct;

  const InsightsMethodShare({
    required this.key,
    required this.amount,
    required this.pct,
  });

  factory InsightsMethodShare.fromJson(Map<String, dynamic> json) =>
      InsightsMethodShare(
        key: json['key']?.toString() ?? 'other',
        amount: _toDouble(json['amount']),
        pct: _toInt(json['pct']),
      );
}

class InsightsCollector {
  final String id;
  final String name;
  final double amount;
  final int count;

  const InsightsCollector({
    required this.id,
    required this.name,
    required this.amount,
    required this.count,
  });

  factory InsightsCollector.fromJson(Map<String, dynamic> json) =>
      InsightsCollector(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        amount: _toDouble(json['amount']),
        count: _toInt(json['count']),
      );
}

/// Response of `GET /api/jars/:id/insights`.
class JarInsights {
  final InsightsPeriod period;
  final DateTime? rangeStart;
  final DateTime? rangeEnd;
  final double total;
  final double? previousTotal;
  final int? changePct;
  final String currency;
  final int paymentsCount;
  final int paymentsCountAllTime;

  /// Totals Mon..Sun.
  final List<double> byWeekday;

  /// 0 = Monday.
  final int? bestWeekdayIndex;
  final double? bestWeekdayMultiple;
  final List<InsightsMethodShare> methodMix;
  final List<InsightsCollector> topCollectors;
  final double averageGift;
  final int contributorsCount;
  final double totalAllTime;
  final double goalAmount;
  final DateTime? deadline;
  final DateTime? createdAt;

  const JarInsights({
    required this.period,
    this.rangeStart,
    this.rangeEnd,
    required this.total,
    this.previousTotal,
    this.changePct,
    required this.currency,
    required this.paymentsCount,
    required this.paymentsCountAllTime,
    required this.byWeekday,
    this.bestWeekdayIndex,
    this.bestWeekdayMultiple,
    required this.methodMix,
    required this.topCollectors,
    required this.averageGift,
    required this.contributorsCount,
    required this.totalAllTime,
    required this.goalAmount,
    this.deadline,
    this.createdAt,
  });

  factory JarInsights.fromJson(Map<String, dynamic> json) {
    final best = json['bestWeekday'];
    final weekdays = (json['byWeekday'] as List?)?.map(_toDouble).toList();
    return JarInsights(
      period: InsightsPeriod.values.firstWhere(
        (p) => p.apiValue == json['period'],
        orElse: () => InsightsPeriod.month,
      ),
      rangeStart: _toDate(json['rangeStart']),
      rangeEnd: _toDate(json['rangeEnd']),
      total: _toDouble(json['total']),
      previousTotal:
          json['previousTotal'] == null
              ? null
              : _toDouble(json['previousTotal']),
      changePct: json['changePct'] == null ? null : _toInt(json['changePct']),
      currency: (json['currency']?.toString() ?? 'GHS').toUpperCase(),
      paymentsCount: _toInt(json['paymentsCount']),
      paymentsCountAllTime: _toInt(
        json['paymentsCountAllTime'] ?? json['paymentsCount'],
      ),
      byWeekday:
          weekdays != null && weekdays.length == 7
              ? weekdays
              : List.filled(7, 0.0),
      bestWeekdayIndex: best is Map ? _toInt(best['index']) : null,
      bestWeekdayMultiple:
          best is Map ? _toDouble(best['multipleOfAverage']) : null,
      methodMix: [
        for (final m in (json['methodMix'] as List? ?? const []))
          if (m is Map)
            InsightsMethodShare.fromJson(Map<String, dynamic>.from(m)),
      ],
      topCollectors: [
        for (final c in (json['topCollectors'] as List? ?? const []))
          if (c is Map)
            InsightsCollector.fromJson(Map<String, dynamic>.from(c)),
      ],
      averageGift: _toDouble(json['averageGift']),
      contributorsCount: _toInt(json['contributorsCount']),
      totalAllTime: _toDouble(json['totalAllTime']),
      goalAmount: _toDouble(json['goalAmount']),
      deadline: _toDate(json['deadline']),
      createdAt: _toDate(json['createdAt']),
    );
  }

  /// Insights need a few payments before they say anything useful.
  static const minPayments = 5;
  bool get hasEnoughData => paymentsCountAllTime >= minPayments;
  bool get hasGoal => goalAmount > 0;
}

/// Straight-line goal forecast: the average collected per day since the jar
/// was created, carried on to the deadline (same rule as the jar screen).
class GoalForecast {
  final double collected;
  final double projected;
  final double goal;
  final DateTime deadline;

  /// Days since creation and days left, for drawing "Today" on the line.
  final int daysElapsed;
  final int daysLeft;

  const GoalForecast({
    required this.collected,
    required this.projected,
    required this.goal,
    required this.deadline,
    required this.daysElapsed,
    required this.daysLeft,
  });

  double get pctOfGoal => goal > 0 ? projected / goal * 100 : 0;
  bool get onTrack => projected >= goal;
}

/// Why a forecast can't be shown.
enum GoalForecastGap { noGoal, noDeadline, deadlinePassed, notEnoughData }

/// Works out the forecast, or why there isn't one. [now] is for tests.
(GoalForecast?, GoalForecastGap?) goalForecastFor(
  JarInsights insights, {
  DateTime? now,
}) {
  if (!insights.hasGoal) return (null, GoalForecastGap.noGoal);
  final deadline = insights.deadline?.toLocal();
  if (deadline == null) return (null, GoalForecastGap.noDeadline);
  final n = now ?? DateTime.now();
  final today = DateTime(n.year, n.month, n.day);
  final end = DateTime(deadline.year, deadline.month, deadline.day);
  final daysLeft = end.difference(today).inDays;
  if (daysLeft <= 0) return (null, GoalForecastGap.deadlinePassed);
  final created = insights.createdAt?.toLocal();
  if (created == null) return (null, GoalForecastGap.notEnoughData);
  final start = DateTime(created.year, created.month, created.day);
  final elapsed = today.difference(start).inDays;
  final collected = insights.totalAllTime;
  if (elapsed < 3 || collected <= 0) {
    return (null, GoalForecastGap.notEnoughData);
  }
  return (
    GoalForecast(
      collected: collected,
      projected: collected + collected / elapsed * daysLeft,
      goal: insights.goalAmount,
      deadline: deadline,
      daysElapsed: elapsed,
      daysLeft: daysLeft,
    ),
    null,
  );
}

double _toDouble(dynamic v) {
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0;
  return 0;
}

int _toInt(dynamic v) {
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}

DateTime? _toDate(dynamic v) {
  if (v is String && v.isNotEmpty) return DateTime.tryParse(v);
  return null;
}
