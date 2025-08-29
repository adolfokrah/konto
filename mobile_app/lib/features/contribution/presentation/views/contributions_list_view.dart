import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/date_utils.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/contribution_list_item.dart';
import 'package:konto/core/widgets/icon_button.dart';
import 'package:konto/core/widgets/searh_input.dart';
import 'package:konto/core/widgets/small_button.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:konto/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:konto/features/contribution/presentation/widgets/contribtions_list_filter.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

/// A stateless widget that displays a scrollable list of contributions
/// grouped by date sections with scroll-to-load pagination
class ContributionsListView extends StatefulWidget {
  const ContributionsListView({super.key});

  @override
  State<ContributionsListView> createState() => _ContributionsListViewState();
}

class _ContributionsListViewState extends State<ContributionsListView> {
  final ScrollController _scrollController = ScrollController();

  // Pagination state
  bool _isLoadingMore = false;
  int _currentPage = 1;

  // Search functionality
  Timer? _debounceTimer;
  String _currentSearchQuery = '';
  static const Duration _debounceDuration = Duration(milliseconds: 500);

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
      if (page == 1) {
        context.read<FilterContributionsBloc>().add(ClearAllFilters());
      }

      String? currentUserId;
      if (authState is AuthAuthenticated) {
        currentUserId = authState.user.id;
      }

      context.read<ContributionsListBloc>().add(
        FetchContributions(
          jarId: jarSummaryState.jarData.id,
          page: page,
          contributor: contributor?.isNotEmpty == true ? contributor : null,
          currentUserId: currentUserId,
          jarCreatorId: jarSummaryState.jarData.creator.id,
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

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text('Transactions'),
        centerTitle: false,
        elevation: 0,
      ),
      body: SafeArea(
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Search Bar that slides away on scroll
            SliverAppBar(
              automaticallyImplyLeading: false,
              elevation: 0,
              floating: true,
              snap: false,
              pinned: false,
              backgroundColor: Theme.of(context).scaffoldBackgroundColor,
              flexibleSpace: _buildSearchBar(localizations),
              expandedHeight: 90,
              toolbarHeight: 90,
            ),

            // Contributions List
            _buildSliverContributionsList(localizations),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(AppLocalizations localizations) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.spacingM),
      child: Row(
        children: [
          // Search Field
          Expanded(
            child: SearchInput(
              hintText: localizations.searchContributions,
              onChanged: _onSearchChanged,
            ),
          ),
          const SizedBox(width: 13),
          // Filter Button
          AppIconButton(
            onPressed: () {
              ContributionsListFilter.show(
                context,
                contributor: _currentSearchQuery,
              );
            },
            icon: Icons.tune,
            size: const Size(50, 50),
          ),
        ],
      ),
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
            child: Center(child: CircularProgressIndicator()),
          );
        }

        if (state is ContributionsListError) {
          return SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(state.message),
                  const SizedBox(height: AppSpacing.spacingM),
                  AppSmallButton(
                    onPressed: () => _fetchContributions(),
                    child: Text(
                      localizations.retry,
                      style: AppTextStyles.titleRegularM,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        if (state is ContributionsListLoaded) {
          if (state.contributions.isEmpty) {
            return SliverFillRemaining(
              child: Center(
                child: Text(
                  localizations.noContributionsFound,
                  style: AppTextStyles.titleRegularM,
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
            padding: EdgeInsets.all(AppSpacing.spacingM),
            child: Center(child: CircularProgressIndicator()),
          );
        }

        final group = groupedContributions[index];
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingM),
          child: _buildDateGroup(group, localizations),
        );
      }, childCount: groupedContributions.length + (_isLoadingMore ? 1 : 0)),
    );
  }

  Widget _buildDateGroup(
    ContributionDateGroup group,
    AppLocalizations localizations,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Date Header
        Padding(
          padding: const EdgeInsets.only(
            left: 4,
            bottom: AppSpacing.spacingXs,
            top: AppSpacing.spacingM,
          ),
          child: Text(group.dateLabel, style: AppTextStyles.titleMedium),
        ),

        // Contributions Card
        AppCard(
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.spacingS,
            vertical: AppSpacing.spacingXs,
          ),
          child: Column(
            children:
                group.contributions.asMap().entries.map((entry) {
                  final contribution = entry.value;
                  return Column(
                    children: [
                      _buildContributionItem(contribution, localizations),
                    ],
                  );
                }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildContributionItem(
    ContributionModel contribution,
    AppLocalizations localizations,
  ) {
    // Get currency from jar - handle both String and object types
    String currency = 'ghc'; // Default fallback
    if (contribution.jar is Map) {
      currency = contribution.jar['currency'] ?? 'ghc';
    } else if (contribution.jar is String) {
      // If jar is just a String ID, we can't get the currency, use default
      currency = 'ghc';
    }

    return ContributionListItem(
      contributionId: contribution.id,
      contributorName: contribution.contributor ?? 'Konto',
      amount: contribution.amountContributed,
      currency: currency,
      timestamp: contribution.createdAt ?? DateTime.now(),
      paymentMethod: contribution.paymentMethod,
      isAnonymous:
          contribution.contributor == null &&
          contribution.contributorPhoneNumber == null,
      paymentStatus: contribution.paymentStatus,
      viaPaymentLink: contribution.viaPaymentLink,
    );
  }

  List<ContributionDateGroup> _groupContributionsByDate(
    List<ContributionModel> contributions,
    AppLocalizations localizations,
  ) {
    final Map<String, List<ContributionModel>> grouped = {};

    for (final contribution in contributions) {
      final date = contribution.createdAt ?? DateTime.now();
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

/// Data class for grouping contributions by date
class ContributionDateGroup {
  final String dateLabel;
  final List<ContributionModel> contributions;

  const ContributionDateGroup({
    required this.dateLabel,
    required this.contributions,
  });
}
