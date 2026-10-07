import 'package:Hoga/features/jars/presentation/widgets/payment_method_contribution_item.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/contribution_chart.dart';
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
    final blocked =
        jarData == null ||
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
              onTap:
                  jarData.isCreator
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
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: JarLoading(),
      );
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
          child: DsCard(
            child: DsEmptyState(
              icon: Icons.savings_outlined,
              tone: DsTone.lime,
              title: localizations.createNewJar,
              message: localizations.createNewJarMessage,
              actionLabel: localizations.createNewJar,
              onAction: () => context.push(AppRoutes.jarCreate),
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
    final blocked = sealed || frozen;
    final b = jarData.balanceBreakDown;

    final children = <Widget>[
      _identityRow(context, jarData, isCreator),
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
      if (isCreator) JarCompletionAlert(jarData: jarData),
      if (isCreator)
        JarGoalCard(
          currentAmount: b.totalContributedAmount,
          goalAmount: jarData.goalAmount,
          currency: jarData.currency,
          deadline: jarData.deadline,
        ),
      if (isCreator) _summaryTiles(context, jarData),
      DsSectionHeader(
        localizations.recentContributions,
        action: jarData.contributions.isNotEmpty ? localizations.seeAll : null,
        onAction: () => _openContributionsList(context),
      ),
      if (jarData.contributions.isEmpty)
        DsCard(
          padding: EdgeInsets.zero,
          child: DsEmptyState(
            icon: Icons.receipt_long_outlined,
            title: localizations.noContributionsYet,
            message: localizations.beTheFirstToContribute,
            actionLabel: localizations.contribute,
            onAction: blocked ? null : () => _contribute(context, jarData),
          ),
        )
      else
        DsListCard(
          children: [
            for (final c in jarData.contributions)
              JarActivityRow(contribution: c),
          ],
        ),
      if (isCreator) _breakdownCard(context, jarData),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) const SizedBox(height: 12),
          children[i],
        ],
        // Keeps the jar-photo upload listener alive when the More tile is
        // replaced (sealed jars show Reopen instead).
        if (isCreator && sealed) JarMoreMenu(jarId: jarData.id, hidden: true),
      ],
    );
  }

  /// Photo, name and status; tapping the name opens the jar switcher.
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
        JarStatus.broken => const DsTag('Closed'),
      };
    }

    final subtitle =
        isCreator
            ? [
              if (jarData.jarGroup != null && jarData.jarGroup!.isNotEmpty)
                jarData.jarGroup!,
              jarData.currency.toUpperCase(),
            ].join(' · ')
            : 'Organized by ${jarData.creator.fullName}';

    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => JarsListView.showModal(context),
            child: Row(
              children: [
                JarThumb(imageUrl: imageUrl, size: 52),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              jarData.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: DsText.section.copyWith(fontSize: 20),
                            ),
                          ),
                          const SizedBox(width: 2),
                          const Icon(
                            Icons.unfold_more_rounded,
                            size: 18,
                            color: AppColors.muted,
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
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
        ),
      ],
    );
  }

  Widget _balanceCard(
    BuildContext context,
    JarSummaryModel jarData,
    bool isCreator,
  ) {
    final b = jarData.balanceBreakDown;
    final cur = jarData.currency;
    final points = jarData.chartData ?? const <double>[];
    final hasChart = points.length >= 2 && points.any((p) => p > 0);

    Widget figure(String label, double value, {Color? color}) => Text.rich(
      TextSpan(
        children: [
          TextSpan(text: '$label ', style: DsText.small),
          TextSpan(
            text: CurrencyUtils.formatAmount(value, cur),
            style: DsText.small.copyWith(
              fontWeight: FontWeight.w700,
              color: color ?? AppColors.navy,
            ),
          ),
        ],
      ),
    );

    return DsCard(
      onTap: isCreator ? () => JarBalanceBreakdown.show(context) : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                isCreator ? 'Total collected' : 'Jar total',
                style: DsText.caption,
              ),
              const Spacer(),
              if (isCreator)
                const Icon(
                  Icons.info_outline_rounded,
                  size: 16,
                  color: AppColors.muted,
                ),
            ],
          ),
          const SizedBox(height: 4),
          DsMoney(
            b.totalContributedAmount,
            currency: cur.toUpperCase(),
            size: 36,
          ),
          if (isCreator) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 14,
              runSpacing: 4,
              children: [
                figure('Available', b.totalAmountTobeTransferred),
                figure('Clearing', b.upcomingBalance, color: AppColors.pending),
              ],
            ),
          ],
          const SizedBox(height: 14),
          if (hasChart)
            ContributionChart(
              dataPoints: points,
              chartColor: AppColors.navy,
              height: 70,
            )
          else
            Column(
              children: [
                SizedBox(
                  height: 40,
                  child: CustomPaint(
                    size: const Size(double.infinity, 40),
                    painter: _DashedLinePainter(),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Your chart starts with the first payment',
                  style: DsText.caption,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
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
    final blocked = sealed || frozen;
    final b = jarData.balanceBreakDown;
    final transferable =
        !frozen && (b.totalAmountTobeTransferred > 0 || b.upcomingBalance > 0);

    final contribute = DsQuickAction(
      key: const Key('contribute_button'),
      icon: Icons.add_rounded,
      label: l.contribute,
      primary: !sealed,
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
        contribute,
        request,
        DsQuickAction(
          icon: Icons.info_outline_rounded,
          label: l.about,
          onTap: () => _showCollectorInfo(context, jarData),
        ),
      ];
    } else {
      final transfer = DsQuickAction(
        key: const Key('withdraw_button'),
        icon: Icons.north_east_rounded,
        label: l.withdraw,
        primary: sealed,
        onTap: transferable ? () => _handleWithdraw(context, jarData) : null,
      );
      tiles = [
        contribute,
        request,
        transfer,
        if (sealed)
          DsQuickAction(
            icon: Icons.lock_open_rounded,
            label: l.reopen,
            onTap: () => _confirmReopen(context, jarData),
          )
        else
          JarMoreMenu(jarId: jarData.id),
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

  /// Collectors and payments count tiles (creator only).
  Widget _summaryTiles(BuildContext context, JarSummaryModel jarData) {
    final l = AppLocalizations.of(context)!;
    final collectors =
        jarData.invitedCollectors
            ?.where((collector) => collector.status == 'accepted')
            .length ??
        0;
    final b = jarData.balanceBreakDown;
    final payments =
        b.cash.totalCount + b.mobileMoney.totalCount + b.card.totalCount;

    Widget tile({
      required IconData icon,
      required String label,
      required String value,
      required VoidCallback onTap,
      IconData trailing = Icons.chevron_right_rounded,
    }) {
      return DsCard(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                DsIconTile(icon, size: 36),
                const Spacer(),
                Icon(trailing, size: 20, color: AppColors.faint),
              ],
            ),
            const SizedBox(height: 14),
            Text(label, style: DsText.caption),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(
                fontFamily: 'Chillax',
                fontWeight: FontWeight.w600,
                fontSize: 24,
                color: AppColors.navy,
              ),
            ),
          ],
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          child: tile(
            icon: Icons.group_outlined,
            label: l.collectors,
            value: '$collectors',
            trailing: Icons.add_rounded,
            onTap: () => CollectorsView.show(context),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: tile(
            icon: Icons.receipt_long_outlined,
            label: l.contributions,
            value: '$payments',
            onTap: () => _openContributionsList(context),
          ),
        ),
      ],
    );
  }

  /// Payment-method split as a stacked bar with a legend (creator only).
  Widget _breakdownCard(BuildContext context, JarSummaryModel jarData) {
    final l = AppLocalizations.of(context)!;
    final b = jarData.balanceBreakDown;
    return DsCard(
      padding: const EdgeInsets.fromLTRB(0, 16, 0, 6),
      onTap: () => JarBalanceBreakdown.show(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'By payment method',
                        style: DsText.rowTitle.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 20,
                      color: AppColors.faint,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                DsMoney(
                  b.totalContributedAmount,
                  currency: jarData.currency.toUpperCase(),
                  size: 24,
                ),
                const SizedBox(height: 12),
                JarStackedBar(
                  parts: [
                    (b.mobileMoney.totalAmount, AppColors.mtnYellow),
                    (b.card.totalAmount, AppColors.info),
                    (b.cash.totalAmount, AppColors.positive),
                  ],
                ),
                const SizedBox(height: 4),
              ],
            ),
          ),
          PaymentMethodContributionItem(
            title: l.mobileMoney,
            subtitle: l.contributionsCount(
              jarData.mobileMoneyContributionCount,
            ),
            amount: b.mobileMoney.totalAmount,
            currency: jarData.currency,
            icon: Icons.phone_android_rounded,
            color: AppColors.mtnYellow,
          ),
          PaymentMethodContributionItem(
            title: l.cardPayment,
            subtitle: l.contributionsCount(b.card.totalCount),
            amount: b.card.totalAmount,
            currency: jarData.currency,
            icon: Icons.credit_card_rounded,
            color: AppColors.info,
          ),
          PaymentMethodContributionItem(
            title: l.cash,
            subtitle: l.contributionsCount(jarData.cashContributionCount),
            amount: b.cash.totalAmount,
            currency: jarData.currency,
            icon: Icons.payments_outlined,
            color: AppColors.positive,
          ),
        ],
      ),
    );
  }
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
    final y = size.height - 4;
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
