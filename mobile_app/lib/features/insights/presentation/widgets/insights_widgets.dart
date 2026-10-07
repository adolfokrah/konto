import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/insights/data/models/jar_insights_model.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';

const insightsWeekdayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const insightsWeekdayLong = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/// "2.4" or "3" — one decimal, dropped when whole.
String insightsMultiple(double v) {
  final r = (v * 10).round() / 10;
  return r == r.roundToDouble() ? r.toStringAsFixed(0) : r.toStringAsFixed(1);
}

/// Current jar chip next to the big title: thumbnail, name, chevron.
class InsightsJarChip extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final VoidCallback onTap;

  const InsightsJarChip({
    super.key,
    required this.name,
    required this.imageUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceWhite,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: AppColors.line),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(6, 6, 10, 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: JarThumb(imageUrl: imageUrl, size: 22),
              ),
              const SizedBox(width: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 150),
                child: Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.rowTitle.copyWith(fontSize: 13.5),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                size: 18,
                color: AppColors.navy,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Seven bars, Mon..Sun, the best day in lime.
class InsightsWeekdayBars extends StatelessWidget {
  final List<double> values;
  final int? highlight;
  final double height;

  const InsightsWeekdayBars({
    super.key,
    required this.values,
    this.highlight,
    this.height = 120,
  });

  @override
  Widget build(BuildContext context) {
    final max = values.fold<double>(0, (m, v) => v > m ? v : m);
    return SizedBox(
      height: height,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var i = 0; i < 7; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            Expanded(
              child: Semantics(
                label:
                    '${insightsWeekdayLong[i]}: ${DsMoney.group(i < values.length ? values[i] : 0)}',
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, c) {
                          final v = i < values.length ? values[i] : 0.0;
                          final frac = max > 0 ? v / max : 0.0;
                          // A stub keeps empty days visible.
                          final h = (c.maxHeight * frac).clamp(
                            4.0,
                            c.maxHeight,
                          );
                          return Align(
                            alignment: Alignment.bottomCenter,
                            child: Container(
                              height: h,
                              decoration: BoxDecoration(
                                color:
                                    i == highlight
                                        ? AppColors.lime
                                        : AppColors.beige,
                                borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(6),
                                  bottom: Radius.circular(3),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      insightsWeekdayShort[i],
                      style: DsText.caption.copyWith(fontSize: 10.5),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Faded placeholder bars for the empty state.
class InsightsPlaceholderBars extends StatelessWidget {
  const InsightsPlaceholderBars({super.key});

  @override
  Widget build(BuildContext context) {
    const heights = [0.2, 0.35, 0.25, 0.5, 0.4];
    return Opacity(
      opacity: 0.5,
      child: SizedBox(
        width: 180,
        height: 70,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            for (var i = 0; i < heights.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(
                child: FractionallySizedBox(
                  heightFactor: heights[i],
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: AppColors.beige,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(6),
                        bottom: Radius.circular(3),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Colour and label for each payment-mix bucket.
(Color, String) insightsMethodStyle(String key) => switch (key) {
  'mtn' => (AppColors.mtnYellow, 'MTN MoMo'),
  'telecel' => (AppColors.telecelRed, 'Telecel'),
  'airteltigo' => (const Color(0xFF1D4ED8), 'AirtelTigo'),
  'card' => (AppColors.info, 'Card'),
  'cash' => (AppColors.positive, 'Cash'),
  _ => (AppColors.faint, 'Other'),
};

/// "How people pay": one stacked bar and a legend row per method.
class InsightsMethodMix extends StatelessWidget {
  final List<InsightsMethodShare> mix;

  const InsightsMethodMix({super.key, required this.mix});

  @override
  Widget build(BuildContext context) {
    final total = mix.fold<double>(0, (s, m) => s + m.amount);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: SizedBox(
            height: 12,
            child:
                total <= 0
                    ? const ColoredBox(color: AppColors.fill)
                    : Row(
                      children: [
                        for (var i = 0; i < mix.length; i++) ...[
                          if (i > 0)
                            const SizedBox(
                              width: 2,
                              child: ColoredBox(color: AppColors.surfaceWhite),
                            ),
                          Expanded(
                            // flex needs ints; per-mille keeps small slices.
                            flex: (mix[i].amount / total * 1000).round().clamp(
                              1,
                              1000,
                            ),
                            child: ColoredBox(
                              color: insightsMethodStyle(mix[i].key).$1,
                            ),
                          ),
                        ],
                      ],
                    ),
          ),
        ),
        const SizedBox(height: 14),
        for (final m in mix)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: insightsMethodStyle(m.key).$1,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    insightsMethodStyle(m.key).$2,
                    style: DsText.small.copyWith(color: AppColors.navy),
                  ),
                ),
                Text(
                  '${m.pct}%',
                  style: DsText.rowTitle.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// Small stat tile: label and a number.
class InsightsStatTile extends StatelessWidget {
  final String label;
  final Widget value;

  const InsightsStatTile({super.key, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return DsCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: DsText.caption),
          const SizedBox(height: 4),
          value,
        ],
      ),
    );
  }
}

/// Goal forecast line: collected so far (solid) to today, then the
/// projection (dashed) to the deadline, under a dashed goal line.
class GoalForecastChart extends StatelessWidget {
  final GoalForecast forecast;
  final String goalLabel;

  const GoalForecastChart({
    super.key,
    required this.forecast,
    required this.goalLabel,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 130,
      width: double.infinity,
      child: CustomPaint(
        painter: _ForecastPainter(forecast: forecast, goalLabel: goalLabel),
      ),
    );
  }
}

class _ForecastPainter extends CustomPainter {
  final GoalForecast forecast;
  final String goalLabel;

  _ForecastPainter({required this.forecast, required this.goalLabel});

  static const _labelStyle = TextStyle(
    fontFamily: 'Supreme',
    fontSize: 10,
    color: AppColors.muted,
  );

  void _dashed(Canvas canvas, Offset a, Offset b, Paint p, double dash) {
    final d = b - a;
    final len = d.distance;
    if (len == 0) return;
    final dir = d / len;
    for (var t = 0.0; t < len; t += dash * 2) {
      final end = (t + dash).clamp(0.0, len);
      canvas.drawLine(a + dir * t, a + dir * end, p);
    }
  }

  @override
  void paint(Canvas canvas, Size size) {
    const top = 26.0;
    const bottom = 18.0; // room for "Today"
    final chartH = size.height - top - bottom;
    final maxV = [
      forecast.goal,
      forecast.projected,
    ].reduce((a, b) => a > b ? a : b);
    double y(double v) => top + chartH * (1 - (maxV > 0 ? v / maxV : 0));

    final totalDays = forecast.daysElapsed + forecast.daysLeft;
    final todayX = size.width * forecast.daysElapsed / totalDays;

    // Goal line and label.
    final goalY = y(forecast.goal);
    _dashed(
      canvas,
      Offset(0, goalY),
      Offset(size.width, goalY),
      Paint()
        ..color = AppColors.navy
        ..strokeWidth = 1,
      4,
    );
    final tp = TextPainter(
      text: TextSpan(text: goalLabel, style: _labelStyle),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(0, (goalY - tp.height - 3).clamp(0, size.height)));

    final line =
        Paint()
          ..color = AppColors.navy
          ..strokeWidth = 2.4
          ..strokeCap = StrokeCap.round
          ..style = PaintingStyle.stroke;
    final start = Offset(0, y(0));
    final today = Offset(todayX, y(forecast.collected));
    final end = Offset(size.width, y(forecast.projected));
    canvas.drawLine(start, today, line);
    _dashed(canvas, today, end, line, 5);

    // Today marker.
    _dashed(
      canvas,
      Offset(todayX, today.dy + 6),
      Offset(todayX, size.height - bottom),
      Paint()
        ..color = AppColors.line
        ..strokeWidth = 1,
      2.5,
    );
    canvas.drawCircle(today, 6, Paint()..color = AppColors.lime);
    canvas.drawCircle(
      today,
      6,
      Paint()
        ..color = AppColors.navy
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
    final todayTp = TextPainter(
      text: TextSpan(
        text: 'Today',
        style: _labelStyle.copyWith(color: AppColors.ink2),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    final tx = (todayX - todayTp.width / 2).clamp(
      0.0,
      size.width - todayTp.width,
    );
    todayTp.paint(canvas, Offset(tx, size.height - todayTp.height));
  }

  @override
  bool shouldRepaint(covariant _ForecastPainter old) =>
      old.forecast != forecast || old.goalLabel != goalLabel;
}
