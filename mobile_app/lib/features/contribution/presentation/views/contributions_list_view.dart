import 'dart:async';

import 'package:Hoga/features/contribution/presentation/widgets/export_to_pdf.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/filter_options.dart';
import 'package:Hoga/core/utils/date_utils.dart';
import 'package:Hoga/core/utils/payment_status_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/contribution/data/models/contribution_model.dart';
import 'package:Hoga/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/contribution/presentation/views/contribution_view.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/contribution/presentation/widgets/contribtions_list_filter.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_actions.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';

/// Activity tab: a statement for the current jar, searchable and filterable,
/// grouped by day, with scroll-to-load pagination.
class ContributionsListView extends StatefulWidget {
  const ContributionsListView({super.key});

  @override
  State<ContributionsListView> createState() => _ContributionsListViewState();
}

class _ContributionsListViewState extends State<ContributionsListView> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  // Pagination state
  bool _isLoadingMore = false;
  int _currentPage = 1;

  // Search functionality
  Timer? _debounceTimer;
  String _currentSearchQuery = '';
  static const Duration _debounceDuration = Duration(milliseconds: 500);
  bool _isInitialLoad = true;

  @override
  void initState() {
    super.initState();

    // Setup scroll listener for pagination
    _scrollController.addListener(_onScroll);

    // Fetch initial contributions
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchContributions();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onScroll() {
    // Handle pagination
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final state = context.read<ContributionsListBloc>().state;
      if (state is ContributionsListLoaded &&
          state.hasNextPage &&
          !_isLoadingMore) {
        _loadNextPage();
      }
    }
  }

  void _fetchContributions({int page = 1, String? contributor}) {
    final jarSummaryState = context.read<JarSummaryBloc>().state;
    final authState = context.read<AuthBloc>().state;

    if (jarSummaryState is JarSummaryLoaded) {
      // Only clear filters on the very first load if no filters are already active
      if (_isInitialLoad && page == 1) {
        final currentFilterState =
            context.read<FilterContributionsBloc>().state;
        if (currentFilterState is FilterContributionsLoaded &&
            !currentFilterState.hasFilters) {
          context.read<FilterContributionsBloc>().add(ClearAllFilters());
        }
        _isInitialLoad = false;
      }

      String? currentUserId;
      if (authState is AuthAuthenticated) {
        currentUserId = authState.user.id;
      }

      // Check if current user is an admin collector on this jar
      final isAdminCollector =
          currentUserId != null &&
          (jarSummaryState.jarData.invitedCollectors?.any(
                (ic) =>
                    ic.collector.id == currentUserId &&
                    ic.role == 'admin' &&
                    ic.status == 'accepted',
              ) ??
              false);

      context.read<ContributionsListBloc>().add(
        FetchContributions(
          jarId: jarSummaryState.jarData.id,
          page: page,
          contributor: contributor?.isNotEmpty == true ? contributor : null,
          currentUserId: currentUserId,
          jarCreatorId: jarSummaryState.jarData.creator.id,
          isAdminCollector: isAdminCollector,
        ),
      );
    }
  }

  void _onSearchChanged(String query) {
    // Cancel previous timer
    _debounceTimer?.cancel();

    // Update current search query
    _currentSearchQuery = query;

    // Start new timer
    _debounceTimer = Timer(_debounceDuration, () {
      // Reset pagination and fetch with search query
      setState(() {
        _currentPage = 1;
        _isLoadingMore = false;
      });

      _fetchContributions(page: 1, contributor: query);
    });
  }

  void _loadNextPage() {
    final state = context.read<ContributionsListBloc>().state;
    if (state is ContributionsListLoaded && state.hasNextPage) {
      setState(() {
        _isLoadingMore = true;
        _currentPage = state.nextPage ?? state.page + 1;
      });

      _fetchContributions(page: _currentPage, contributor: _currentSearchQuery);
    }
  }

  /// "No results" action: drop the search and every filter.
  void _clearSearchAndFilters() {
    _debounceTimer?.cancel();
    _searchController.clear();
    _currentSearchQuery = '';
    setState(() {
      _currentPage = 1;
      _isLoadingMore = false;
    });
    final filterState = context.read<FilterContributionsBloc>().state;
    if (filterState is FilterContributionsLoaded && filterState.hasFilters) {
      // The filter listener refetches with the (now empty) search.
      context.read<FilterContributionsBloc>().add(ClearAllFilters());
    } else {
      _fetchContributions(page: 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return MultiBlocListener(
      listeners: [
        BlocListener<FilterContributionsBloc, FilterContributionsState>(
          listener: (context, state) {
            // When filters change, refetch contributions
            if (state is FilterContributionsLoaded) {
              _fetchContributions(page: 1, contributor: _currentSearchQuery);
            }
          },
        ),
        // The feed follows the current jar: refetch when it changes (here via
        // the jar chip, or on Home / Jars).
        BlocListener<JarSummaryBloc, JarSummaryState>(
          listenWhen:
              (prev, curr) =>
                  curr is JarSummaryLoaded &&
                  (prev is! JarSummaryLoaded ||
                      prev.jarData.id != curr.jarData.id),
          listener: (context, state) {
            setState(() {
              _currentPage = 1;
              _isLoadingMore = false;
            });
            final filterState = context.read<FilterContributionsBloc>().state;
            if (filterState is FilterContributionsLoaded &&
                filterState.hasFilters) {
              // Collector filters belong to the old jar; the filter listener
              // refetches once they're cleared.
              context.read<FilterContributionsBloc>().add(ClearAllFilters());
            } else {
              _fetchContributions(page: 1, contributor: _currentSearchQuery);
            }
          },
        ),
      ],
      child: Scaffold(
        backgroundColor: AppColors.cream,
        body: SafeArea(
          bottom: false,
          child: RefreshIndicator(
            color: AppColors.navy,
            onRefresh: () async {
              setState(() {
                _currentPage = 1;
                _isLoadingMore = false;
              });
              _fetchContributions(page: 1, contributor: _currentSearchQuery);
            },
            child: CustomScrollView(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(child: _buildHeader(localizations)),
                _buildSliverContributionsList(localizations),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _switchJar() async {
    final listBloc = context.read<JarListBloc>();
    if (listBloc.state is! JarListLoaded) {
      listBloc.add(LoadJarList());
      try {
        await listBloc.stream
            .firstWhere((s) => s is JarListLoaded || s is JarListError)
            .timeout(const Duration(seconds: 20));
      } catch (_) {}
    }
    final listState = listBloc.state;
    if (listState is! JarListLoaded || !mounted) return;
    final seen = <String>{};
    final jars = [
      for (final g in listState.jars.groups)
        for (final j in g.jars)
          if (seen.add(j.id)) j,
    ];
    if (jars.isEmpty) return;
    final summary = context.read<JarSummaryBloc>().state;
    final picked = await JarActions.pickJar(
      context,
      title: 'Show activity for',
      jars: jars,
      selectedId: summary is JarSummaryLoaded ? summary.jarData.id : null,
    );
    if (picked == null || !mounted) return;
    if (summary is JarSummaryLoaded && summary.jarData.id == picked.id) return;
    context.read<JarSummaryBloc>().add(
      SetCurrentJarRequested(jarId: picked.id),
    );
  }

  /// Which jar this feed is for, and its money in and out (mockup chips and
  /// In / Out card). The totals are the jar's, so they show only unfiltered.
  Widget _buildJarContext() {
    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, state) {
        if (state is! JarSummaryLoaded) return const SizedBox.shrink();
        final jar = state.jarData;
        final imageUrl =
            jar.image?.url != null
                ? ImageUtils.constructImageUrl(jar.image!.url!)
                : null;
        return BlocBuilder<FilterContributionsBloc, FilterContributionsState>(
          builder: (context, filterState) {
            final filtered =
                _currentSearchQuery.isNotEmpty ||
                (filterState is FilterContributionsLoaded &&
                    filterState.hasFilters);
            final b = jar.balanceBreakDown;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                _JarChip(
                  key: const Key('activity_jar_chip'),
                  name: jar.name,
                  imageUrl: imageUrl,
                  onTap: _switchJar,
                ),
                if (!filtered) ...[
                  const SizedBox(height: 12),
                  DsCard(
                    padding: EdgeInsets.zero,
                    child: IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: _Flow(
                              label: 'In',
                              amount: b.totalContributedAmount,
                              positive: true,
                            ),
                          ),
                          const VerticalDivider(
                            width: 1,
                            thickness: 1,
                            color: AppColors.line,
                          ),
                          Expanded(
                            child: _Flow(
                              label: 'Out',
                              amount: b.totalTransfers,
                              positive: false,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildHeader(AppLocalizations localizations) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Activity',
                  style: DsText.display.copyWith(fontSize: 31),
                ),
              ),
              const ExportToPdf(),
            ],
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: Row(
              children: [
                Expanded(
                  child: CollectSearchField(
                    controller: _searchController,
                    hint: localizations.searchContributions,
                    onChanged: _onSearchChanged,
                  ),
                ),
                const SizedBox(width: 8),
                BlocBuilder<FilterContributionsBloc, FilterContributionsState>(
                  builder: (context, state) {
                    final active =
                        state is FilterContributionsLoaded && state.hasFilters;
                    return Stack(
                      clipBehavior: Clip.none,
                      children: [
                        SizedBox(
                          width: 44,
                          height: 44,
                          child: CollectBoxButton(
                            icon: Icons.tune_rounded,
                            onTap: () {
                              ContributionsListFilter.show(
                                context,
                                contributor: _currentSearchQuery,
                              );
                            },
                          ),
                        ),
                        if (active)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: AppColors.navy,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.lime,
                                  width: 1.5,
                                ),
                              ),
                            ),
                          ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          _buildJarContext(),
          _buildActiveFilterChips(localizations),
        ],
      ),
    );
  }

  /// Lime chips for each active filter; tapping one removes it.
  Widget _buildActiveFilterChips(AppLocalizations localizations) {
    return BlocBuilder<FilterContributionsBloc, FilterContributionsState>(
      builder: (context, state) {
        if (state is! FilterContributionsLoaded || !state.hasFilters) {
          return const SizedBox.shrink();
        }
        final methods = state.selectedPaymentMethods ?? const <String>[];
        final statuses = state.selectedStatuses ?? const <String>[];
        final types = state.selectedTransactionTypes ?? const <String>[];
        final collectors = state.selectedCollectors ?? const <String>[];
        final date = state.selectedDate;
        final hasDate = date != null && date != FilterOptions.defaultDateOption;

        void apply({
          List<String>? m,
          List<String>? s,
          List<String>? t,
          List<String>? c,
          bool clearDate = false,
        }) {
          context.read<FilterContributionsBloc>().add(
            ApplyFilters(
              paymentMethods: m ?? methods,
              statuses: s ?? statuses,
              collectors: c ?? collectors,
              transactionTypes: t ?? types,
              selectedDate: clearDate ? null : date,
              startDate: clearDate ? null : state.startDate,
              endDate: clearDate ? null : state.endDate,
            ),
          );
        }

        // Collector ids to names, from the loaded jar.
        final jarState = context.read<JarSummaryBloc>().state;
        String collectorName(String id) {
          if (jarState is JarSummaryLoaded) {
            for (final ic in jarState.jarData.invitedCollectors ?? []) {
              if (ic.collector.id == id) return ic.collector.fullName;
            }
          }
          return localizations.collector;
        }

        final chips = <Widget>[
          if (hasDate)
            CollectChip(
              label: FilterLabels.date(localizations, date),
              soft: true,
              trailingIcon: Icons.close_rounded,
              onTap: () => apply(clearDate: true),
            ),
          for (final v in types)
            CollectChip(
              label: FilterLabels.transactionType(localizations, v),
              soft: true,
              trailingIcon: Icons.close_rounded,
              onTap: () => apply(t: [...types]..remove(v)),
            ),
          for (final v in statuses)
            CollectChip(
              label: FilterLabels.status(localizations, v),
              soft: true,
              trailingIcon: Icons.close_rounded,
              onTap: () => apply(s: [...statuses]..remove(v)),
            ),
          for (final v in methods)
            CollectChip(
              label: FilterLabels.paymentMethod(localizations, v),
              soft: true,
              trailingIcon: Icons.close_rounded,
              onTap: () => apply(m: [...methods]..remove(v)),
            ),
          for (final v in collectors)
            CollectChip(
              label: collectorName(v),
              soft: true,
              trailingIcon: Icons.close_rounded,
              onTap: () => apply(c: [...collectors]..remove(v)),
            ),
        ];
        return Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Wrap(spacing: 6, runSpacing: 6, children: chips),
        );
      },
    );
  }

  Widget _buildSliverContributionsList(AppLocalizations localizations) {
    return BlocConsumer<ContributionsListBloc, ContributionsListState>(
      listener: (context, state) {
        if (state is ContributionsListLoaded) {
          setState(() {
            _isLoadingMore = false;
          });
        }
      },
      builder: (context, state) {
        if (state is ContributionsListLoading && _currentPage == 1) {
          return const SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: CircularProgressIndicator(color: AppColors.navy),
            ),
          );
        }

        if (state is ContributionsListError) {
          return SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: DsEmptyState(
                icon: Icons.wifi_off_rounded,
                tone: DsTone.negative,
                title: localizations.failedToFetchContribution,
                message: state.message,
                actionLabel: localizations.retry,
                onAction: () => _fetchContributions(),
              ),
            ),
          );
        }

        if (state is ContributionsListLoaded) {
          if (state.contributions.isEmpty) {
            final filterState = context.read<FilterContributionsBloc>().state;
            final filtered =
                _currentSearchQuery.isNotEmpty ||
                (filterState is FilterContributionsLoaded &&
                    filterState.hasFilters);
            return SliverFillRemaining(
              hasScrollBody: false,
              child: Align(
                alignment: const Alignment(0, -0.4),
                child:
                    filtered
                        ? DsEmptyState(
                          icon: Icons.search_off_rounded,
                          title: 'No payments match',
                          message:
                              'Try another name or number, or clear filters.',
                          actionLabel: 'Clear filters',
                          onAction: _clearSearchAndFilters,
                        )
                        : DsEmptyState(
                          icon: Icons.receipt_long_outlined,
                          tone: DsTone.lime,
                          title: localizations.noContributionsFound,
                          message:
                              'Every payment in or out of this jar will be listed here, with receipts and exports.',
                        ),
              ),
            );
          }

          return _buildSliverGroupedContributions(state, localizations);
        }

        return const SliverToBoxAdapter(child: SizedBox.shrink());
      },
    );
  }

  Widget _buildSliverGroupedContributions(
    ContributionsListLoaded state,
    AppLocalizations localizations,
  ) {
    // Group contributions by date
    final groupedContributions = _groupContributionsByDate(
      state.contributions,
      localizations,
    );

    return SliverList(
      delegate: SliverChildBuilderDelegate((context, index) {
        if (index == groupedContributions.length) {
          // Loading indicator for pagination
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Center(
              child: CircularProgressIndicator(color: AppColors.navy),
            ),
          );
        }

        final group = groupedContributions[index];
        // A day's total is only shown once every payment of that day is
        // loaded (the last group may continue on the next page).
        final complete =
            index < groupedContributions.length - 1 || !state.hasNextPage;
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: _buildDateGroup(group, localizations, showTotal: complete),
        );
      }, childCount: groupedContributions.length + (_isLoadingMore ? 1 : 0)),
    );
  }

  Widget _buildDateGroup(
    ContributionDateGroup group,
    AppLocalizations localizations, {
    required bool showTotal,
  }) {
    // Net of completed payments that day: money in minus transfers/refunds.
    double net = 0;
    for (final c in group.contributions) {
      if (c.paymentStatus != 'completed') continue;
      net += c.isTransfer ? -c.amountContributed.abs() : c.amountContributed;
    }
    final netLabel =
        '${net > 0
            ? '+'
            : net < 0
            ? '−'
            : ''}${DsMoney.group(net)}.${((net.abs() * 100).round() % 100).toString().padLeft(2, '0')}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CollectCap(
          group.dateLabel,
          trailing: showTotal ? netLabel : null,
          trailingColor: net > 0 ? AppColors.positive : null,
        ),
        const SizedBox(height: 6),
        DsListCard(
          children: [
            for (final contribution in group.contributions)
              _ActivityRow(contribution: contribution),
          ],
        ),
      ],
    );
  }

  List<ContributionDateGroup> _groupContributionsByDate(
    List<ContributionModel> contributions,
    AppLocalizations localizations,
  ) {
    final Map<String, List<ContributionModel>> grouped = {};

    for (final contribution in contributions) {
      final date = contribution.createdAt;
      String dateKey;

      if (AppDateUtils.isToday(date)) {
        dateKey = localizations.today;
      } else if (AppDateUtils.isYesterday(date)) {
        dateKey = localizations.yesterday;
      } else {
        dateKey = AppDateUtils.formatDateOnly(date, localizations);
      }

      grouped.putIfAbsent(dateKey, () => []).add(contribution);
    }

    // Convert to sorted list
    final sortedEntries =
        grouped.entries.toList()..sort((a, b) {
          // Today first, then Yesterday, then chronological order
          if (a.key == 'Today') return -1;
          if (b.key == 'Today') return 1;
          if (a.key == 'Yesterday') return -1;
          if (b.key == 'Yesterday') return 1;

          // For other dates, get the first contribution's date for comparison
          final aDate = a.value.isNotEmpty ? a.value.first.createdAt : null;
          final bDate = b.value.isNotEmpty ? b.value.first.createdAt : null;

          if (aDate == null || bDate == null) return 0;
          return bDate.compareTo(aDate); // Most recent first
        });

    return sortedEntries
        .map(
          (entry) => ContributionDateGroup(
            dateLabel: entry.key,
            contributions: entry.value,
          ),
        )
        .toList();
  }
}

/// One statement line: method tile, name, time and collector, signed amount
/// with a status tag when it isn't completed.
class _ActivityRow extends StatelessWidget {
  final ContributionModel contribution;

  const _ActivityRow({required this.contribution});

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final c = contribution;
    final isAnonymous =
        c.contributor == null && c.contributorPhoneNumber == null;
    final name =
        isAnonymous
            ? (c.isCash ? 'Anonymous · cash' : 'Anonymous')
            : (c.contributor ?? c.contributorPhoneNumber ?? 'Hogapay');

    final collectorName = c.collector?.fullName;
    final collectorFirst =
        (collectorName != null &&
                collectorName.isNotEmpty &&
                collectorName != 'Unknown User')
            ? collectorName.split(' ').first
            : null;
    final subtitle = [
      AppDateUtils.formatTimeOnly(c.createdAt, localizations),
      if (c.isContribution && collectorFirst != null)
        c.viaPaymentLink ? 'via $collectorFirst' : 'by $collectorFirst',
      if (c.isPayout) localizations.typePayout,
      if (c.isRefund) localizations.typeRefund,
    ].join(' · ');

    final status = c.paymentStatus.toLowerCase();
    final failed = status == 'failed' || status == 'rejected';
    final completed = status == 'completed' || status == 'transferred';
    final out = c.isTransfer;
    final amount = c.amountContributed.abs();
    final amountText =
        '${out ? '−' : '+'}${DsMoney.group(amount)}.${((amount * 100).round() % 100).toString().padLeft(2, '0')}';
    final amountColor =
        failed
            ? AppColors.muted
            : (!out && completed)
            ? AppColors.positive
            : AppColors.navy;

    final amountWidget = Text(
      amountText,
      style: TextStyle(
        fontFamily: 'Chillax',
        fontWeight: FontWeight.w600,
        fontSize: 15.5,
        color: amountColor,
        decoration: failed ? TextDecoration.lineThrough : null,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    );

    return DsRow(
      onTap: () => ContributionView.show(context, c.id),
      leading: PaymentMethodTile(
        paymentMethod: c.paymentMethod,
        phone: c.contributorPhoneNumber,
        isPayout: c.isPayout,
        isRefund: c.isRefund,
      ),
      title: name,
      subtitle: subtitle,
      trailing:
          completed
              ? amountWidget
              : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  amountWidget,
                  const SizedBox(height: 3),
                  paymentStatusTag(
                    status,
                    PaymentStatusUtils.getPaymentStatusLabel(
                      c.paymentStatus,
                      localizations,
                    ),
                  ),
                ],
              ),
    );
  }
}

/// Data class for grouping contributions by date
class ContributionDateGroup {
  final String dateLabel;
  final List<ContributionModel> contributions;

  const ContributionDateGroup({
    required this.dateLabel,
    required this.contributions,
  });
}

/// Current jar as a chip: thumbnail, name, chevron. Tap to switch.
class _JarChip extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final VoidCallback onTap;

  const _JarChip({
    super.key,
    required this.name,
    required this.imageUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.limeSoft,
      borderRadius: BorderRadius.circular(100),
      child: InkWell(
        borderRadius: BorderRadius.circular(100),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(5, 5, 12, 5),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(100),
                child: JarThumb(imageUrl: imageUrl, size: 24),
              ),
              const SizedBox(width: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 220),
                child: Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.rowTitle.copyWith(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                  ),
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

/// One half of the In / Out card.
class _Flow extends StatelessWidget {
  final String label;
  final double amount;
  final bool positive;

  const _Flow({
    required this.label,
    required this.amount,
    required this.positive,
  });

  @override
  Widget build(BuildContext context) {
    final whole = amount.abs().toStringAsFixed(2);
    final parts = whole.split('.');
    final b = StringBuffer();
    for (var i = 0; i < parts[0].length; i++) {
      if (i > 0 && (parts[0].length - i) % 3 == 0) b.write(',');
      b.write(parts[0][i]);
    }
    final text = '${positive ? '+' : '−'}$b.${parts[1]}';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: DsText.caption),
          const SizedBox(height: 2),
          Text(
            text,
            style: TextStyle(
              fontFamily: 'Chillax',
              fontWeight: FontWeight.w600,
              fontSize: 18,
              fontFeatures: const [FontFeature.tabularFigures()],
              color: positive ? AppColors.positive : AppColors.navy,
            ),
          ),
        ],
      ),
    );
  }
}
