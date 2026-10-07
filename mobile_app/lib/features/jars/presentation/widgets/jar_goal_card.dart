import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

/// Goal card on the jar dashboard: percentage, "x of y", progress bar,
/// deadline and (when it can be worked out) a pace forecast. With no goal it
/// becomes a one-line prompt to set one.
class JarGoalCard extends StatelessWidget {
  final double currentAmount;
  final double goalAmount;
  final String currency;
  final DateTime? deadline;

  /// When the jar was created; with [deadline] it gives the pace forecast.
  final DateTime? createdAt;

  const JarGoalCard({
    super.key,
    required this.currentAmount,
    required this.goalAmount,
    required this.currency,
    this.deadline,
    this.createdAt,
  });

  /// Straight-line projection: the average collected per day since the jar
  /// was created, carried on to the deadline. Null when there isn't enough
  /// to go on (no deadline, deadline passed, nothing collected yet, or the
  /// jar is less than three days old) or the goal is already reached.
  double? _forecast(int? daysLeft) {
    if (deadline == null || createdAt == null || daysLeft == null) return null;
    if (daysLeft <= 0 || currentAmount <= 0 || currentAmount >= goalAmount) {
      return null;
    }
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final start = DateTime(createdAt!.year, createdAt!.month, createdAt!.day);
    final elapsed = today.difference(start).inDays;
    if (elapsed < 3) return null;
    return currentAmount + currentAmount / elapsed * daysLeft;
  }

  int? _daysLeft() {
    if (deadline == null) return null;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final end = DateTime(deadline!.year, deadline!.month, deadline!.day);
    return end.difference(today).inDays;
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    if (goalAmount <= 0) {
      return DsCard(
        key: const Key('goalProgressCardEditIcon'),
        onTap: () => context.push(AppRoutes.jarGoal),
        child: Row(
          children: [
            const DsIconTile(Icons.flag_outlined, tone: DsTone.lime),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l.setGoal, style: DsText.rowTitle),
                  const SizedBox(height: 2),
                  Text(l.noGoalSetYet, style: DsText.caption),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.faint),
          ],
        ),
      );
    }

    final progress = (currentAmount / goalAmount).clamp(0.0, 1.0);
    final pct = (currentAmount / goalAmount * 100);
    final days = _daysLeft();
    String? right;
    if (currentAmount >= goalAmount) {
      right = l.goalReached;
    } else if (deadline != null) {
      final date = DateFormat('d MMM', l.localeName).format(deadline!);
      right =
          days! < 0
              ? 'Ended $date'
              : days == 0
              ? 'Ends today'
              : 'Ends $date · $days ${days == 1 ? 'day' : 'days'}';
    }
    final forecast = _forecast(days);

    return DsCard(
      key: const Key('goalProgressCardEditIcon'),
      onTap: () => context.push(AppRoutes.jarGoal),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  l.goal,
                  style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              if (right != null) Text(right, style: DsText.caption),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${pct >= 100 ? 100 : pct.floor()}%',
                style: const TextStyle(
                  fontFamily: 'Chillax',
                  fontWeight: FontWeight.w600,
                  fontSize: 20,
                  color: AppColors.navy,
                ),
              ),
              const Spacer(),
              Text(
                '${DsMoney.group(currentAmount)} of ${DsMoney.group(goalAmount)}',
                style: DsText.small,
              ),
            ],
          ),
          const SizedBox(height: 8),
          DsProgress(progress, height: 8),
          if (forecast != null) ...[
            const SizedBox(height: 8),
            Text.rich(
              TextSpan(
                children: [
                  const TextSpan(text: 'At this pace you\'ll reach '),
                  TextSpan(
                    text:
                        '${currency.toUpperCase()} ${DsMoney.group(forecast)}',
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const TextSpan(text: ' by the deadline.'),
                ],
              ),
              style: DsText.caption,
            ),
          ],
        ],
      ),
    );
  }
}
