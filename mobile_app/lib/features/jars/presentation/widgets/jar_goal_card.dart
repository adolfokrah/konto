import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

/// Goal card on the jar dashboard: percentage, "x of y", progress bar and
/// deadline. With no goal it becomes a one-line prompt to set one.
class JarGoalCard extends StatelessWidget {
  final double currentAmount;
  final double goalAmount;
  final String currency;
  final DateTime? deadline;

  const JarGoalCard({
    super.key,
    required this.currentAmount,
    required this.goalAmount,
    required this.currency,
    this.deadline,
  });

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
          days! < 0 ? '$date · ${l.overdue}' : '$date · ${l.daysLeft(days)}';
    }

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
                  style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              if (right != null) Text(right, style: DsText.caption),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${pct >= 100 ? 100 : pct.floor()}%',
                style: const TextStyle(
                  fontFamily: 'Chillax',
                  fontWeight: FontWeight.w600,
                  fontSize: 26,
                  height: 1,
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
          const SizedBox(height: 10),
          DsProgress(progress),
        ],
      ),
    );
  }
}
