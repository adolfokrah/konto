import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/collaborators/presentation/views/collectors_view.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/views/jars_list_view.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_actions.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_activity_row.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_balance_breakdown.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_goal_card.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_info_sheet.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_report_sheet.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_more_menu.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_completion_alert.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

/// Home tab: the dashboard of the current jar (switch jars from the name row).
class JarDetailView extends StatefulWidget {
  const JarDetailView({super.key});

  @override
  State<JarDetailView> createState() => _JarDetailViewState();
}

class _JarDetailViewState extends State<JarDetailView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Same jar: refreshes silently; another jar: shows loading.
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    final localizations = AppLocalizations.of(context)!;
    final jarSummaryReloadBloc = context.read<JarSummaryReloadBloc>();

    // Trigger the reload and wait for completion
    // This should refresh data in the background without affecting UI state
    jarSummaryReloadBloc.add(ReloadJarSummaryRequested());

    try {
      // Wait for the reload to complete by listening for state changes
      await jarSummaryReloadBloc.stream
          .firstWhere(
            (state) =>
                state is JarSummaryReloaded || state is JarSummaryReloadError,
          )
          .timeout(
            const Duration(seconds: 20), // Add timeout to prevent hanging
          );
    } catch (e) {
      // Handle timeout or other errors
      if (context.mounted) {
        AppSnackBar.show(
          context,
          message: localizations.refreshTimedOut,
          type: SnackBarType.error,
        );
      }
    }
  }

  void _onRefetch() {
    // Trigger jar summary request with loading indicator
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
  }

  void _handleWithdraw(BuildContext context, JarSummaryModel jarData) =>
      JarActions.withdraw(context, jarData);

  // ------------------------------------------------------------ actions

  void _contribute(BuildContext context, JarSummaryModel jarData) =>
      JarActions.contribute(context, jarData);

  void _request(BuildContext context, JarSummaryModel jarData) =>
      JarActions.request(context, jarData);

  Future<void> _showCollectorInfo(
    BuildContext context,
    JarSummaryModel jarData,
  ) async {
    final result = await JarInfoSheet.show(context: context, jarData: jarData);
    if (!context.mounted) return;
    if (result == 'leave') {
      context.read<UpdateJarBloc>().add(LeaveJarRequested(jarId: jarData.id));
    } else if (result == 'report') {
      final reported = await JarReportSheet.show(
        context: context,
        jarId: jarData.id,
      );
      if (reported == true && context.mounted) {
        AppSnackBar.show(
          context,
          message: 'Report submitted successfully',
          type: SnackBarType.success,
        );
      }
    }
  }

  Future<void> _confirmReopen(
    BuildContext context,
    JarSummaryModel jarData,
  ) async {
    final l = AppLocalizations.of(context)!;
    final ok = await JarConfirmSheet.show(
      context: context,
      icon: Icons.lock_open_rounded,
      tone: DsTone.positive,
      title: l.reopenJar,
      message: l.reopenJarMessage,
      confirmText: l.reopen,
    );
    if (ok == true && context.mounted) {
      context.read<UpdateJarBloc>().add(
        UpdateJarRequested(jarId: jarData.id, updates: {'status': 'open'}),
      );
    }
  }

  void _openContributionsList(BuildContext context) {
    // Clear all contribution filters before navigating
    try {
      context.read<FilterContributionsBloc>().add(ClearAllFilters());
    } catch (_) {
      // Bloc not found in context; ignore.
    }
    context.go(AppRoutes.contributionsList);
  }

  // ------------------------------------------------------------ build

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<JarSummaryBloc, JarSummaryState>(
          listener: (context, state) {
            if (state is JarSummaryLoaded) {
              context.read<JarListBloc>().add(LoadJarList());
            }
          },
        ),
        BlocListener<JarSummaryReloadBloc, JarSummaryReloadState>(
          listener: (context, state) {
            if (state is JarSummaryReloadError) {
              AppSnackBar.show(
                context,
                message: state.message,
                type: SnackBarType.error,
              );
            }
            // JarSummaryReloaded state is handled automatically by the bloc
            // which calls UpdateJarSummaryRequested on the main bloc without flicker
          },
        ),
        BlocListener<UpdateJarBloc, UpdateJarState>(
          listenWhen: (previous, current) => current is UpdateJarSuccess,
          listener: (context, state) {
            context.read<JarSummaryReloadBloc>().add(
              ReloadJarSummaryRequested(),
            );
          },
        ),
        BlocListener<UpdateJarBloc, UpdateJarState>(
          listenWhen:
              (previous, current) =>
                  current is LeaveJarSuccess || current is LeaveJarFailure,
          listener: (context, state) {
            if (state is LeaveJarSuccess) {
              AppSnackBar.show(
                context,
                message: 'You have left the jar',
                type: SnackBarType.success,
              );
              // Refresh jar list and jar details
              context.read<JarListBloc>().add(LoadJarList());
              context.read<JarSummaryReloadBloc>().add(
                ReloadJarSummaryRequested(),
              );
            } else if (state is LeaveJarFailure) {
              AppSnackBar.show(
                context,
                message: state.errorMessage,
                type: SnackBarType.error,
              );
            }
          },
        ),
      ],
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          return Scaffold(
            backgroundColor: AppColors.cream,
            body: SafeArea(
              bottom: false,
              child: RefreshIndicator(
                color: AppColors.navy,
                backgroundColor: AppColors.surfaceWhite,
                onRefresh: _onRefresh,
                child: CustomScrollView(
                  controller: _scrollController,
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    SliverToBoxAdapter(child: _buildHeader(context, state)),
                    _buildSliverBody(context, state),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  /// Back, share and settings (mockup jar screen).
  Widget _buildHeader(BuildContext context, JarSummaryState state) {
    final jarData = state is JarSummaryLoaded ? state.jarData : null;
    final broken = jarData?.status == JarStatus.broken;
    final blocked =
        jarData == null ||
        broken ||
        jarData.status == JarStatus.sealed ||
        jarData.status == JarStatus.frozen;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
      child: Row(
        children: [
          JarNavButton(
            key: const Key('jar_back_button'),
            icon: Icons.arrow_back_ios_new_rounded,
            onTap: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go(AppRoutes.home);
              }
            },
          ),
          const Spacer(),
          if (jarData != null) ...[
            JarNavButton(
              key: const Key('request_button_qr_code'),
              icon: Icons.ios_share_rounded,
              onTap: blocked ? null : () => _request(context, jarData),
            ),
            const SizedBox(width: 8),
            JarNavButton(
              key: const Key('info_button'),
              icon:
                  jarData.isCreator
                      ? Icons.settings_outlined
                      : Icons.info_outline_rounded,
              // A broken jar is read-only: no settings.
              onTap:
                  broken
                      ? null
                      : jarData.isCreator
                      ? () => context.push(AppRoutes.jarInfo)
                      : () => _showCollectorInfo(context, jarData),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSliverBody(BuildContext context, JarSummaryState state) {
    final localizations = AppLocalizations.of(context)!;

    if (state is JarSummaryLoading) {
      return const SliverToBoxAdapter(child: JarDetailSkeleton());
    } else if (state is JarSummaryError) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: DsCard(
              child: DsEmptyState(
                icon: Icons.error_outline_rounded,
                tone: DsTone.negative,
                title: 'Couldn\'t load your jar',
                message: state.message,
                actionLabel: localizations.retry,
                onAction: _onRefetch,
              ),
            ),
          ),
        ),
      );
    } else if (state is JarSummaryLoaded) {
      final jarData = state.jarData;
      return SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 32),
        sliver: SliverToBoxAdapter(
          child: BlocBuilder<AuthBloc, AuthState>(
            builder: (context, authState) {
              final isCreator =
                  authState is AuthAuthenticated &&
                  jarData.creator.id == authState.user.id;
              return _buildDashboard(context, jarData, isCreator);
            },
          ),
        ),
      );
    }

    // No jar yet
    return SliverFillRemaining(
      hasScrollBody: false,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              JarActions.needsSetup(context)
                  ? const JarSetupCard()
                  : DsCard(
                    child: DsEmptyState(
                      icon: Icons.savings_outlined,
                      tone: DsTone.lime,
                      title: localizations.createNewJar,
                      message: localizations.createNewJarMessage,
                      actionLabel: localizations.createNewJar,
                      onAction: () => JarActions.createJar(context),
                    ),
                  ),
        ),
      ),
    );
  }

  Widget _buildDashboard(
    BuildContext context,
    JarSummaryModel jarData,
    bool isCreator,
  ) {
    final localizations = AppLocalizations.of(context)!;
    final sealed = jarData.status == JarStatus.sealed;
    final frozen = jarData.status == JarStatus.frozen;
    final broken = jarData.status == JarStatus.broken;
    final blocked = sealed || frozen || broken;
    final b = jarData.balanceBreakDown;

    final children = <Widget>[
      _identityRow(context, jarData, isCreator),
      if (broken)
        const DsNote(
          tone: DsTone.neutral,
          icon: Icons.block_rounded,
          title: 'This jar is broken',
          text:
              'It no longer takes payments, transfers or collectors. Its statement stays here.',
        ),
      if (frozen)
        DsNote(
          tone: DsTone.negative,
          icon: Icons.ac_unit_rounded,
          title: 'Frozen by Hogapay',
          text:
              jarData.freezeReason != null && jarData.freezeReason!.isNotEmpty
                  ? '${jarData.freezeReason!} Contributions, transfers, and withdrawals are disabled. Contact support.'
                  : 'Contributions, transfers, and withdrawals are disabled. Contact support.',
        ),
      if (sealed)
        DsNote(
          tone: DsTone.pending,
          icon: Icons.lock_outline_rounded,
          title: 'This jar is sealed',
          text:
              isCreator
                  ? 'No new payments. You can still transfer the balance.'
                  : 'No new payments for now.',
        ),
      _balanceCard(context, jarData, isCreator),
      _quickActions(context, jarData, isCreator),
      if (!isCreator)
        const DsNote(
          tone: DsTone.neutral,
          icon: Icons.lock_outline_rounded,
          text: 'Only the organizer can transfer money or change settings.',
        ),
      if (isCreator && !blocked)
        JarGoalCard(
          currentAmount: b.totalContributedAmount,
          goalAmount: jarData.goalAmount,
          currency: jarData.currency,
          deadline: jarData.deadline,
          createdAt: jarData.createdAt,
        ),
      if (isCreator && !blocked) JarCompletionAlert(jarData: jarData),
      DsSectionHeader(
        isCreator ? 'Statement' : 'Your collections',
        action: jarData.contributions.isNotEmpty ? localizations.seeAll : null,
        onAction: () => _openContributionsList(context),
      ),
      if (jarData.contributions.isEmpty)
        DsCard(
          padding: EdgeInsets.zero,
          child: _emptyStatement(context, jarData, blocked),
        )
      else
        DsListCard(
          children: [
            for (final c in jarData.contributions)
              JarActivityRow(contribution: c, creatorId: jarData.creator.id),
          ],
        ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) const SizedBox(height: 14),
          children[i],
        ],
        // Keeps the jar-photo upload listener alive (the More tile became
        // Team; photos are changed from jar settings).
        if (isCreator) JarMoreMenu(jarId: jarData.id, hidden: true),
      ],
    );
  }

  /// "No payments yet" card with a Share link action (mockup `.es`).
  Widget _emptyStatement(
    BuildContext context,
    JarSummaryModel jarData,
    bool blocked,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 26, horizontal: 18),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const DsIconTile(Icons.format_list_bulleted_rounded, size: 56),
          const SizedBox(height: 12),
          Text(
            'No payments yet',
            style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Record cash, send a MoMo request, or share your link to get started.',
            style: DsText.small,
            textAlign: TextAlign.center,
          ),
          if (!blocked) ...[
            const SizedBox(height: 14),
            DsSmallButton(
              label: 'Share link',
              icon: Icons.ios_share_rounded,
              onTap: () => _request(context, jarData),
            ),
          ],
        ],
      ),
    );
  }

  /// Photo, name, status tag and "category · currency"; tapping it opens the
  /// jar switcher.
  Widget _identityRow(
    BuildContext context,
    JarSummaryModel jarData,
    bool isCreator,
  ) {
    final imageUrl =
        jarData.image?.url != null
            ? ImageUtils.constructImageUrl(jarData.image!.url!)
            : null;

    final DsTag tag;
    if (!isCreator) {
      tag = DsTag(AppLocalizations.of(context)!.collector);
    } else {
      tag = switch (jarData.status) {
        JarStatus.open => const DsTag('Open', tone: DsTone.positive),
        JarStatus.sealed => const DsTag('Sealed'),
        JarStatus.frozen => const DsTag('Frozen', tone: DsTone.negative),
        JarStatus.broken => const DsTag('Broken'),
      };
    }

    final now = DateTime.now();
    final createdToday =
        jarData.createdAt.year == now.year &&
        jarData.createdAt.month == now.month &&
        jarData.createdAt.day == now.day;
    final subtitle =
        !isCreator
            ? 'Organized by ${jarData.creator.fullName}'
            : jarData.contributions.isEmpty && createdToday
            ? 'Created today'
            : [
              if (jarData.jarGroup != null && jarData.jarGroup!.isNotEmpty)
                jarData.jarGroup!,
              jarData.currency.toUpperCase(),
            ].join(' · ');

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => JarsListView.showModal(context),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Row(
          children: [
            JarThumb(imageUrl: imageUrl, size: 48),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    jarData.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: DsText.section.copyWith(fontSize: 19),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      tag,
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: DsText.caption,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Balance card. Owner: balance, Available / Clearing, a 10-day chart
  /// (the summary's chartData is daily totals for the last 10 days).
  /// Collector: what they've collected and how many payments.
  Widget _balanceCard(
    BuildContext context,
    JarSummaryModel jarData,
    bool isCreator,
  ) {
    final b = jarData.balanceBreakDown;
    final cur = jarData.currency;
    final blocked =
        jarData.status == JarStatus.sealed ||
        jarData.status == JarStatus.frozen ||
        jarData.status == JarStatus.broken;
    final points = jarData.chartData ?? const <double>[];
    final hasChart = points.length >= 2 && points.any((p) => p > 0);

    Widget figure(String label, double value, {Color? color}) => Text.rich(
      TextSpan(
        children: [
          TextSpan(text: '$label ', style: DsText.small.copyWith(fontSize: 13)),
          TextSpan(
            text: CurrencyUtils.formatAmount(value, cur),
            style: DsText.small.copyWith(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color ?? AppColors.navy,
            ),
          ),
        ],
      ),
    );

    if (!isCreator) {
      final payments =
          b.cash.totalCount + b.mobileMoney.totalCount + b.card.totalCount;
      return DsCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('You\'ve collected', style: DsText.caption),
            const SizedBox(height: 4),
            DsMoney(
              b.totalContributedAmount,
              currency: cur.toUpperCase(),
              size: 36,
            ),
            const SizedBox(height: 4),
            Text(
              '$payments ${payments == 1 ? 'payment' : 'payments'}',
              style: DsText.caption,
            ),
          ],
        ),
      );
    }

    final hasMoney = b.totalContributedAmount > 0;
    final today = DateTime.now();
    final firstDay = today.subtract(Duration(days: points.length - 1));

    return DsCard(
      onTap: () => JarBalanceBreakdown.show(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Balance', style: DsText.caption),
          const SizedBox(height: 4),
          DsMoney(
            b.totalContributedAmount,
            currency: cur.toUpperCase(),
            size: 38,
          ),
          if (hasMoney) ...[
            const SizedBox(height: 4),
            Wrap(
              spacing: 12,
              runSpacing: 4,
              children: [
                figure('Available', b.totalAmountTobeTransferred),
                figure('Clearing', b.upcomingBalance, color: AppColors.pending),
              ],
            ),
          ],
          // Sealed and frozen jars show the balance only (mockup).
          if (!blocked) ...[
            const SizedBox(height: 10),
            if (hasChart) ...[
              SizedBox(
                height: 110,
                width: double.infinity,
                child: CustomPaint(painter: _BalanceChartPainter(points)),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Text(
                    DateFormat('d MMM').format(firstDay),
                    style: DsText.caption,
                  ),
                  const Spacer(),
                  Text('Today', style: DsText.caption),
                ],
              ),
            ] else if (!hasMoney) ...[
              SizedBox(
                height: 70,
                width: double.infinity,
                child: CustomPaint(painter: _DashedLinePainter()),
              ),
              const SizedBox(height: 4),
              Center(
                child: Text(
                  'Your chart starts with the first payment',
                  style: DsText.caption,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _quickActions(
    BuildContext context,
    JarSummaryModel jarData,
    bool isCreator,
  ) {
    final l = AppLocalizations.of(context)!;
    final sealed = jarData.status == JarStatus.sealed;
    final frozen = jarData.status == JarStatus.frozen;
    // Broken jars are read-only: every action is off.
    final broken = jarData.status == JarStatus.broken;
    final blocked = sealed || frozen || broken;
    final b = jarData.balanceBreakDown;
    final transferable =
        !frozen &&
        !broken &&
        (b.totalAmountTobeTransferred > 0 || b.upcomingBalance > 0);

    final collect = DsQuickAction(
      key: const Key('contribute_button'),
      icon: Icons.add_rounded,
      label: 'Collect',
      primary: !sealed && !broken,
      onTap: blocked ? null : () => _contribute(context, jarData),
    );
    final request = DsQuickAction(
      key: const Key('request_button'),
      icon: Icons.qr_code_2_rounded,
      label: l.request,
      onTap: blocked ? null : () => _request(context, jarData),
    );

    final List<Widget> tiles;
    if (!isCreator) {
      tiles = [
        collect,
        request,
        DsQuickAction(
          icon: Icons.info_outline_rounded,
          label: l.about,
          onTap: broken ? null : () => _showCollectorInfo(context, jarData),
        ),
      ];
    } else {
      tiles = [
        collect,
        request,
        DsQuickAction(
          key: const Key('withdraw_button'),
          icon: Icons.send_rounded,
          label: 'Transfer',
          primary: sealed,
          onTap: transferable ? () => _handleWithdraw(context, jarData) : null,
        ),
        if (sealed)
          DsQuickAction(
            icon: Icons.lock_open_rounded,
            label: l.reopen,
            onTap: () => _confirmReopen(context, jarData),
          )
        else
          DsQuickAction(
            key: const Key('team_button'),
            icon: Icons.group_outlined,
            label: 'Team',
            onTap: frozen || broken ? null : () => CollectorsView.show(context),
          ),
      ];
    }

    return Row(
      children: [
        for (var i = 0; i < tiles.length; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          Expanded(child: tiles[i]),
        ],
      ],
    );
  }
}

/// Cumulative takings over the chart window (chartData is completed
/// contributions per day for the last 10 days), drawn as a straight-segment
/// line with a soft fill and a lime end dot.
class _BalanceChartPainter extends CustomPainter {
  final List<double> daily;
  _BalanceChartPainter(this.daily);

  @override
  void paint(Canvas canvas, Size size) {
    final values = <double>[];
    var running = 0.0;
    for (final d in daily) {
      running += d;
      values.add(running);
    }
    final maxV = values.last <= 0 ? 1.0 : values.last;
    const top = 8.0;
    final bottom = size.height - 4;
    final dx = size.width / (values.length - 1);
    Offset at(int i) => Offset(
      (i * dx).clamp(0, size.width - 7),
      bottom - (values[i] / maxV) * (bottom - top),
    );

    final line = Path()..moveTo(at(0).dx, at(0).dy);
    for (var i = 1; i < values.length; i++) {
      line.lineTo(at(i).dx, at(i).dy);
    }
    final fill =
        Path.from(line)
          ..lineTo(at(values.length - 1).dx, size.height)
          ..lineTo(0, size.height)
          ..close();
    canvas.drawPath(
      fill,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.navy.withValues(alpha: 0.14),
            AppColors.navy.withValues(alpha: 0),
          ],
        ).createShader(Offset.zero & size),
    );
    canvas.drawPath(
      line,
      Paint()
        ..color = AppColors.navy
        ..strokeWidth = 2.4
        ..style = PaintingStyle.stroke
        ..strokeJoin = StrokeJoin.round
        ..strokeCap = StrokeCap.round,
    );
    final end = at(values.length - 1);
    canvas.drawCircle(end, 6, Paint()..color = AppColors.lime);
    canvas.drawCircle(
      end,
      6,
      Paint()
        ..color = AppColors.navy
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke,
    );
  }

  @override
  bool shouldRepaint(covariant _BalanceChartPainter oldDelegate) =>
      oldDelegate.daily != daily;
}

/// Dashed baseline shown before a jar's first payment.
class _DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = const Color(0xFFE2D9CC)
          ..strokeWidth = 2
          ..strokeCap = StrokeCap.round;
    final y = size.height - 10;
    double x = 0;
    while (x < size.width) {
      canvas.drawLine(
        Offset(x, y),
        Offset((x + 4).clamp(0, size.width), y),
        paint,
      );
      x += 9;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
