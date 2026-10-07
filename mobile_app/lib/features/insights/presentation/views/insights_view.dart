import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/main_shell.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/collaborators/presentation/views/collectors_view.dart';
import 'package:Hoga/features/insights/data/models/jar_insights_model.dart';
import 'package:Hoga/features/insights/logic/bloc/insights_bloc.dart';
import 'package:Hoga/features/insights/presentation/widgets/insights_widgets.dart';
import 'package:Hoga/features/jars/data/models/jar_list_model.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_actions.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_settings_widgets.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/route.dart';

/// Insights tab: how the current jar is doing — best day to share, how people
/// pay, who collects most, the average gift and the goal forecast.
class InsightsView extends StatelessWidget {
  const InsightsView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<InsightsBloc>(
      create: (_) => getIt<InsightsBloc>(),
      child: const _InsightsBody(),
    );
  }
}

class _InsightsBody extends StatefulWidget {
  const _InsightsBody();

  @override
  State<_InsightsBody> createState() => _InsightsBodyState();
}

class _InsightsBodyState extends State<_InsightsBody> {
  @override
  void initState() {
    super.initState();
    final summary = context.read<JarSummaryBloc>().state;
    if (summary is JarSummaryLoaded) {
      context.read<InsightsBloc>().add(
        InsightsRequested(jarId: summary.jarData.id),
      );
    } else if (summary is JarSummaryInitial) {
      context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
    }
  }

  // ------------------------------------------------------------ actions

  /// The user's jars, once each (a jar can sit in more than one group).
  List<JarListItem>? _loadedJars() {
    final listState = context.read<JarListBloc>().state;
    if (listState is! JarListLoaded) return null;
    final seen = <String>{};
    return [
      for (final g in listState.jars.groups)
        for (final j in g.jars)
          if (seen.add(j.id)) j,
    ];
  }

  Future<void> _switchJar(String currentId) async {
    final listBloc = context.read<JarListBloc>();
    if (listBloc.state is! JarListLoaded) {
      listBloc.add(LoadJarList());
      try {
        await listBloc.stream
            .firstWhere((s) => s is JarListLoaded || s is JarListError)
            .timeout(const Duration(seconds: 20));
      } catch (_) {}
    }
    if (!mounted) return;
    final jars = _loadedJars();
    if (jars == null || jars.isEmpty) return;
    final picked = await JarActions.pickJar(
      context,
      title: 'Show insights for',
      jars: jars,
      selectedId: currentId,
    );
    if (!mounted || picked == null || picked.id == currentId) return;
    context.read<JarSummaryBloc>().add(
      SetCurrentJarRequested(jarId: picked.id),
    );
  }

  Future<void> _refresh() async {
    final bloc = context.read<InsightsBloc>();
    if (bloc.state.jarId == null) return;
    bloc.add(const InsightsRefreshed());
    try {
      await bloc.stream
          .firstWhere((s) => s.status != InsightsStatus.loading)
          .timeout(const Duration(seconds: 20));
    } catch (_) {}
  }

  String? _currentUserId() {
    final auth = context.read<AuthBloc>().state;
    return auth is AuthAuthenticated ? auth.user.id : null;
  }

  // ------------------------------------------------------------ build

  @override
  Widget build(BuildContext context) {
    return BlocListener<JarSummaryBloc, JarSummaryState>(
      // Follow the current jar; refresh when its total moves (new payment).
      listenWhen:
          (prev, curr) =>
              curr is JarSummaryLoaded &&
              (prev is! JarSummaryLoaded ||
                  prev.jarData.id != curr.jarData.id ||
                  prev.jarData.balanceBreakDown.totalContributedAmount !=
                      curr.jarData.balanceBreakDown.totalContributedAmount),
      listener: (context, state) {
        final jar = (state as JarSummaryLoaded).jarData;
        final bloc = context.read<InsightsBloc>();
        if (bloc.state.jarId == jar.id) {
          bloc.add(const InsightsRefreshed());
        } else {
          bloc.add(InsightsRequested(jarId: jar.id));
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.cream,
        body: SafeArea(
          bottom: false,
          child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
            builder: (context, summary) {
              final jar = summary is JarSummaryLoaded ? summary.jarData : null;
              return RefreshIndicator(
                color: AppColors.navy,
                onRefresh: _refresh,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.fromLTRB(
                    20,
                    12,
                    20,
                    MainShell.scrollBottom(context),
                  ),
                  children: [
                    _header(jar),
                    const SizedBox(height: 16),
                    ..._body(summary, jar),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _header(JarSummaryModel? jar) {
    final imageUrl =
        jar?.image?.url != null
            ? ImageUtils.constructImageUrl(jar!.image!.url!)
            : null;
    return Row(
      children: [
        Expanded(
          child: Text('Insights', style: DsText.display.copyWith(fontSize: 31)),
        ),
        if (jar != null)
          InsightsJarChip(
            key: const Key('insights_jar_chip'),
            name: jar.name,
            imageUrl: imageUrl,
            onTap: () => _switchJar(jar.id),
          ),
      ],
    );
  }

  List<Widget> _body(JarSummaryState summary, JarSummaryModel? jar) {
    if (summary is JarSummaryError) {
      return [
        DsEmptyState(
          icon: Icons.error_outline_rounded,
          tone: DsTone.negative,
          title: 'Couldn\'t load your jar',
          message: summary.message,
          actionLabel: 'Retry',
          onAction:
              () =>
                  context.read<JarSummaryBloc>().add(GetJarSummaryRequested()),
        ),
      ];
    }
    if (summary is JarSummaryInitial) {
      JarActions.watchSetup(context);
      if (JarActions.needsSetup(context)) {
        return [const JarSetupCard()];
      }
      return [
        DsEmptyState(
          icon: Icons.insights_rounded,
          title: 'No jar yet',
          message: 'Create a jar to see how it\'s doing.',
          actionLabel: 'Create jar',
          onAction: () => JarActions.createJar(context),
        ),
      ];
    }
    if (jar == null) return [_loading()];

    return [
      BlocBuilder<InsightsBloc, InsightsState>(
        builder: (context, state) {
          final insights = state.jarId == jar.id ? state.insights : null;
          switch (state.status) {
            case InsightsStatus.forbidden:
              return const DsEmptyState(
                icon: Icons.lock_outline_rounded,
                title: 'Insights are for organizers',
                message:
                    'Only the jar\'s organizer and admins can see its insights. '
                    'Your own collections are in Activity.',
              );
            case InsightsStatus.error when insights == null:
              return DsEmptyState(
                icon: Icons.error_outline_rounded,
                tone: DsTone.negative,
                title: 'Couldn\'t load insights',
                message:
                    state.message ?? 'Check your connection and try again.',
                actionLabel: 'Retry',
                onAction:
                    () => context.read<InsightsBloc>().add(
                      InsightsRequested(jarId: jar.id),
                    ),
              );
            default:
              break;
          }
          if (insights == null) return _loading();
          if (!insights.hasEnoughData) {
            return _notEnoughData(jar, insights.paymentsCountAllTime);
          }
          return AnimatedOpacity(
            duration: const Duration(milliseconds: 150),
            opacity: state.status == InsightsStatus.loading ? 0.5 : 1,
            child: _content(jar, state, insights),
          );
        },
      ),
    ];
  }

  /// First load: period tabs, total + weekday bars, a breakdown card and the
  /// two stat tiles.
  Widget _loading() => DsSkeleton(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const DsSkeletonBox(height: 40, radius: 12),
        const SizedBox(height: 12),
        DsSkeletonCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const DsSkeletonLine(width: 150, height: 10),
              const SizedBox(height: 10),
              const DsSkeletonLine(width: 180, height: 30),
              const SizedBox(height: 18),
              SizedBox(
                height: 110,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (final h in const [
                      0.45,
                      0.7,
                      0.35,
                      0.9,
                      0.55,
                      0.8,
                      0.4,
                    ])
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: DsSkeletonBox(height: 110 * h, radius: 8),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        const DsSkeletonCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DsSkeletonLine(width: 120, height: 14),
              SizedBox(height: 14),
              DsSkeletonLine(height: 10),
              SizedBox(height: 10),
              DsSkeletonLine(width: 200, height: 10),
            ],
          ),
        ),
        const SizedBox(height: 12),
        const Row(
          children: [
            Expanded(child: DsSkeletonCard()),
            SizedBox(width: 8),
            Expanded(child: DsSkeletonCard()),
          ],
        ),
      ],
    ),
  );

  Widget _notEnoughData(JarSummaryModel jar, int completed) {
    final left = JarInsights.minPayments - completed;
    return DsCard(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
      child: Column(
        children: [
          const InsightsPlaceholderBars(),
          const SizedBox(height: 14),
          Text(
            'Insights appear after ${JarInsights.minPayments} completed payments',
            textAlign: TextAlign.center,
            style: DsText.section,
          ),
          const SizedBox(height: 6),
          Text(
            'You\'ll see your best days to share, how people pay and who\'s collecting most.',
            textAlign: TextAlign.center,
            style: DsText.small,
          ),
          const SizedBox(height: 12),
          // Progress, and what counts: Activity also lists failed / pending
          // payments and transfers, which don't.
          DsTag(
            '$completed of ${JarInsights.minPayments} completed',
            tone: DsTone.lime,
          ),
          const SizedBox(height: 6),
          Text(
            left == 1
                ? '1 more completed payment to go. Failed or pending payments and transfers don\'t count.'
                : '$left more completed payments to go. Failed or pending payments and transfers don\'t count.',
            textAlign: TextAlign.center,
            style: DsText.caption,
          ),
          const SizedBox(height: 14),
          DsSmallButton(
            key: const Key('insights_share_jar'),
            label: 'Share jar',
            icon: Icons.ios_share_rounded,
            onTap: () => JarActions.request(context, jar),
          ),
        ],
      ),
    );
  }

  String _periodLabel(JarInsights insights) {
    switch (insights.period) {
      case InsightsPeriod.week:
        return 'Collected in the last 7 days';
      case InsightsPeriod.month:
        final start = insights.rangeStart?.toUtc() ?? DateTime.now();
        return 'Collected in ${DateFormat('MMMM').format(start)}';
      case InsightsPeriod.all:
        return 'Collected all time';
    }
  }

  Widget _content(
    JarSummaryModel jar,
    InsightsState state,
    JarInsights insights,
  ) {
    final userId = _currentUserId();
    final change = insights.changePct;
    final best = insights.bestWeekdayIndex;
    final multiple = insights.bestWeekdayMultiple;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        JarSegmented<InsightsPeriod>(
          key: const Key('insights_period'),
          options: [for (final p in InsightsPeriod.values) (p, p.label)],
          value: state.period,
          onChanged:
              (p) => context.read<InsightsBloc>().add(InsightsPeriodChanged(p)),
        ),
        const SizedBox(height: 12),

        // Total + weekday bars
        DsCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_periodLabel(insights), style: DsText.caption),
                        const SizedBox(height: 2),
                        DsMoney(insights.total, currency: null, size: 30),
                        const SizedBox(height: 4),
                        // Money out over the same period, beside money in.
                        Text.rich(
                          key: const Key('insights_transferred_out'),
                          TextSpan(
                            style: DsText.caption,
                            children: [
                              const TextSpan(text: 'Transferred out '),
                              TextSpan(
                                text:
                                    '${insights.currency.toUpperCase()} ${NumberFormat('#,##0.00').format(insights.transferredOut)}',
                                style: const TextStyle(
                                  color: AppColors.navy,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (insights.transfersCount > 0)
                                TextSpan(
                                  text:
                                      ' · ${insights.transfersCount} ${insights.transfersCount == 1 ? 'transfer' : 'transfers'}',
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (change != null)
                    DsTag(
                      '${change >= 0 ? '↑' : '↓'} ${change.abs()}%',
                      tone: change >= 0 ? DsTone.positive : DsTone.negative,
                    ),
                ],
              ),
              const SizedBox(height: 16),
              InsightsWeekdayBars(values: insights.byWeekday, highlight: best),
              if (best != null && multiple != null) ...[
                const SizedBox(height: 12),
                Text.rich(
                  TextSpan(
                    style: DsText.caption,
                    children: [
                      TextSpan(text: '${insightsWeekdayLong[best]}s bring in '),
                      TextSpan(
                        text: '${insightsMultiple(multiple)}×',
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const TextSpan(text: ' your average day.'),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        if (insights.hasGoal) ...[
          const SizedBox(height: 12),
          _goalForecastRow(insights),
        ],

        if (insights.methodMix.isNotEmpty) ...[
          const SizedBox(height: 12),
          DsCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('How people pay', style: DsText.section),
                const SizedBox(height: 12),
                InsightsMethodMix(mix: insights.methodMix),
              ],
            ),
          ),
        ],

        if (insights.topCollectors.isNotEmpty) ...[
          const SizedBox(height: 12),
          _topCollectors(insights, userId),
        ],

        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: InsightsStatTile(
                label: 'Average gift',
                value: DsMoney(insights.averageGift, currency: null, size: 20),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: InsightsStatTile(
                label: 'Contributors',
                value: Text(
                  DsMoney.group(insights.contributorsCount.toDouble()),
                  style: DsText.section.copyWith(fontSize: 20),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _goalForecastRow(JarInsights insights) {
    final (forecast, gap) = goalForecastFor(insights);
    final String subtitle;
    DsTone tone = DsTone.neutral;
    if (forecast != null) {
      final pct = forecast.pctOfGoal.round();
      subtitle =
          forecast.onTrack
              ? 'On track · $pct% of goal'
              : 'Behind · $pct% of goal';
      tone = forecast.onTrack ? DsTone.positive : DsTone.pending;
    } else {
      subtitle = goalForecastGapText(gap);
    }
    return DsCard(
      key: const Key('insights_goal_forecast'),
      padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
      onTap: () => context.push(AppRoutes.goalForecast, extra: insights),
      child: Row(
        children: [
          const DsIconTile(Icons.flag_outlined, tone: DsTone.lime, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Goal forecast', style: DsText.rowTitle),
                const SizedBox(height: 2),
                forecast != null
                    ? DsTag(subtitle, tone: tone)
                    : Text(subtitle, style: DsText.caption),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.navy),
        ],
      ),
    );
  }

  Widget _topCollectors(JarInsights insights, String? userId) {
    final top = insights.topCollectors.first.amount;
    return DsCard(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text('Top collectors', style: DsText.section),
              ),
              DsLink(
                'All',
                key: const Key('insights_collectors_all'),
                onTap: () => CollectorsView.show(context),
              ),
            ],
          ),
          const SizedBox(height: 6),
          for (var i = 0; i < insights.topCollectors.length; i++)
            _collectorRow(
              i + 1,
              insights.topCollectors[i],
              top,
              isYou: insights.topCollectors[i].id == userId,
            ),
        ],
      ),
    );
  }

  Widget _collectorRow(
    int rank,
    InsightsCollector c,
    double top, {
    required bool isYou,
  }) {
    final name = c.name.isEmpty ? 'Collector' : c.name;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(width: 14, child: Text('$rank', style: DsText.caption)),
          const SizedBox(width: 8),
          _InitialsAvatar(name: name),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isYou ? '$name (you)' : name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.rowTitle.copyWith(fontSize: 14),
                ),
                const SizedBox(height: 4),
                DsProgress(top > 0 ? c.amount / top : 0, height: 4),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            DsMoney.group(c.amount),
            style: DsText.section.copyWith(
              fontSize: 14,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}

/// Explanation shown when there's no forecast to draw.
String goalForecastGapText(GoalForecastGap? gap) => switch (gap) {
  GoalForecastGap.noDeadline => 'Add a deadline to see a forecast',
  GoalForecastGap.deadlinePassed => 'The deadline has passed',
  GoalForecastGap.noGoal => 'Set a goal to see a forecast',
  _ => 'Not enough data yet',
};

class _InitialsAvatar extends StatelessWidget {
  final String name;
  const _InitialsAvatar({required this.name});

  static const _palette = [
    AppColors.limeSoft,
    AppColors.infoSoft,
    AppColors.pendingSoft,
    AppColors.positiveSoft,
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: _palette[name.hashCode.abs() % _palette.length],
        shape: BoxShape.circle,
      ),
      child: Text(
        JarInitialsAvatar.initials(name),
        style: const TextStyle(
          fontFamily: 'Supreme',
          fontWeight: FontWeight.w700,
          fontSize: 11.5,
          color: AppColors.navy,
        ),
      ),
    );
  }
}
