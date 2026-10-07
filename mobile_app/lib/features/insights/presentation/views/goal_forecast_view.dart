import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/insights/data/models/jar_insights_model.dart';
import 'package:Hoga/features/insights/presentation/views/insights_view.dart';
import 'package:Hoga/features/insights/presentation/widgets/insights_widgets.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_actions.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';

/// Goal forecast: where the jar should land by its deadline at the current
/// pace, with a tip on when to share. Pushed from the Insights tab.
class GoalForecastView extends StatelessWidget {
  final JarInsights? insights;

  const GoalForecastView({super.key, required this.insights});

  @override
  Widget build(BuildContext context) {
    final data = insights;
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: const JarTopBar(title: 'Goal forecast'),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            if (data == null)
              const DsEmptyState(
                icon: Icons.insights_rounded,
                title: 'Nothing to show',
                message: 'Open the forecast from the Insights tab.',
              )
            else ...[
              _forecastCard(data),
              ..._tip(data),
              const SizedBox(height: 16),
              AppButton.filled(
                key: const Key('goal_forecast_share'),
                text: 'Share jar now',
                icon: Icon(
                  Icons.ios_share_rounded,
                  size: 18,
                  color: AppColors.surfaceWhite,
                ),
                onPressed: () {
                  final s = context.read<JarSummaryBloc>().state;
                  if (s is JarSummaryLoaded) {
                    JarActions.request(context, s.jarData);
                  }
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _forecastCard(JarInsights data) {
    final (forecast, gap) = goalForecastFor(data);
    if (forecast == null) {
      return DsCard(
        child: DsEmptyState(
          icon: Icons.flag_outlined,
          title: goalForecastGapText(gap),
          message: switch (gap) {
            GoalForecastGap.noDeadline =>
              'With a deadline we can tell you whether the jar will reach its goal in time.',
            GoalForecastGap.deadlinePassed =>
              'Set a new deadline to see where the jar is heading.',
            GoalForecastGap.noGoal =>
              'Give the jar a goal to see whether it will get there.',
            _ =>
              'Check back after the jar has been open a few days and has some payments.',
          },
        ),
      );
    }
    final pct = forecast.pctOfGoal.round();
    return DsCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Projected by ${DateFormat('d MMM').format(forecast.deadline)}',
            style: DsText.caption,
          ),
          const SizedBox(height: 2),
          DsMoney(forecast.projected, currency: data.currency, size: 34),
          const SizedBox(height: 6),
          DsTag(
            forecast.onTrack
                ? 'On track · $pct% of goal'
                : 'Behind · $pct% of goal',
            tone: forecast.onTrack ? DsTone.positive : DsTone.pending,
          ),
          const SizedBox(height: 14),
          GoalForecastChart(
            forecast: forecast,
            goalLabel: 'Goal ${DsMoney.group(forecast.goal)}',
          ),
        ],
      ),
    );
  }

  List<Widget> _tip(JarInsights data) {
    final best = data.bestWeekdayIndex;
    final multiple = data.bestWeekdayMultiple;
    if (best == null || multiple == null) return const [];
    final day = insightsWeekdayLong[best];
    return [
      const SizedBox(height: 12),
      DsNote(
        icon: Icons.bolt_rounded,
        title: 'Share on $day evening',
        text:
            '${day}s bring in ${insightsMultiple(multiple)}× your average day, so a share then goes furthest.',
      ),
    ];
  }
}
