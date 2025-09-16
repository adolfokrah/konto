import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/filter_options.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/core/widgets/date_range_picker.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class ContributionsListFilter extends StatelessWidget {
  final String? contributor;
  const ContributionsListFilter({super.key, this.contributor});

  static void show(BuildContext context, {String? contributor}) {
    HapticUtils.heavy();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder:
          (modalContext) => SizedBox(
            height: MediaQuery.of(context).size.height * 0.90,
            child: ContributionsListFilter(contributor: contributor),
          ),
    );
  }

  void _applyFilters(BuildContext context) {
    final jarSummaryState = context.read<JarSummaryBloc>().state;
    if (jarSummaryState is JarSummaryLoaded) {
      context.read<ContributionsListBloc>().add(
        FetchContributions(
          jarId: jarSummaryState.jarData.id,
          page: 1,
          contributor: contributor?.isNotEmpty == true ? contributor : null,
        ),
      );
    }
    Navigator.pop(context);
  }

  void _showDateOptions(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder:
          (
            modalContext,
          ) => BlocBuilder<FilterContributionsBloc, FilterContributionsState>(
            bloc: context.read<FilterContributionsBloc>(),
            builder: (builderContext, state) {
              final selectedDate =
                  state is FilterContributionsLoaded
                      ? state.selectedDate ?? FilterOptions.defaultDateOption
                      : FilterOptions.defaultDateOption;

              // Get translated date options
              final translatedDateOptions = [
                localizations.dateAll,
                localizations.dateToday,
                localizations.dateYesterday,
                localizations.dateLast7Days,
                localizations.dateLast30Days,
                localizations.dateCustomRange,
              ];

              return Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom,
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.spacingM,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const DragHandle(),
                      const SizedBox(height: AppSpacing.spacingM),
                      Text(
                        localizations.selectDateRange,
                        style: TextStyles.titleBoldLg,
                      ),
                      const SizedBox(height: AppSpacing.spacingM),
                      AppCard(
                        child: Column(
                          children:
                              translatedDateOptions.asMap().entries.map((
                                entry,
                              ) {
                                final index = entry.key;
                                final translatedOption = entry.value;
                                final originalOption =
                                    FilterOptions.dateOptions[index];

                                return ListTile(
                                  title: Text(
                                    translatedOption,
                                    style: TextStyles.titleMediumM,
                                  ),
                                  onTap: () {
                                    if (originalOption == 'dateCustomRange') {
                                      Navigator.pop(modalContext);
                                      _showCustomDateRangePicker(context);
                                    } else {
                                      context
                                          .read<FilterContributionsBloc>()
                                          .add(
                                            UpdateDateRange(
                                              selectedDate: originalOption,
                                            ),
                                          );
                                      Navigator.pop(modalContext);
                                    }
                                  },
                                  trailing:
                                      selectedDate == originalOption
                                          ? const Icon(Icons.check, size: 18)
                                          : null,
                                );
                              }).toList(),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.spacingL),
                    ],
                  ),
                ),
              );
            },
          ),
    );
  }

  void _showCustomDateRangePicker(BuildContext context) async {
    final dateRange = await DateRangePicker.showDateRangePicker(
      context: context,
    );

    if (dateRange != null) {
      final customRange =
          '${_formatDate(dateRange.startDate)} - ${_formatDate(dateRange.endDate)}';
      context.read<FilterContributionsBloc>().add(
        UpdateDateRange(
          selectedDate: customRange,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        ),
      );
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _getTranslatedDateOption(BuildContext context, String dateOptionKey) {
    final localizations = AppLocalizations.of(context)!;

    // If it's a custom date range (contains " - "), return as is
    if (dateOptionKey.contains(' - ')) {
      return dateOptionKey;
    }

    switch (dateOptionKey) {
      case 'dateAll':
        return localizations.dateAll;
      case 'dateToday':
        return localizations.dateToday;
      case 'dateYesterday':
        return localizations.dateYesterday;
      case 'dateLast7Days':
        return localizations.dateLast7Days;
      case 'dateLast30Days':
        return localizations.dateLast30Days;
      case 'dateCustomRange':
        return localizations.dateCustomRange;
      default:
        return dateOptionKey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, jarState) {
        // Extract accepted collector IDs
        List<String> allCollectorIds = [];
        if (jarState is JarSummaryLoaded) {
          final invitedCollectors =
              jarState.jarData.invitedCollectors
                  ?.where(
                    (collector) =>
                        collector.status == 'accepted' &&
                        collector.collector != null,
                  )
                  .toList() ??
              [];
          allCollectorIds =
              invitedCollectors
                  .map((collectorModel) => collectorModel.collector!.id)
                  .toList();
        }

        return BlocBuilder<FilterContributionsBloc, FilterContributionsState>(
          builder: (context, state) {
            if (state is FilterContributionsLoaded) {
              return Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(AppRadius.radiusM),
                    topRight: Radius.circular(AppRadius.radiusM),
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.spacingM,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Drag handle
                        const DragHandle(),
                        const SizedBox(height: AppSpacing.spacingM),

                        // Header with title and select all
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              localizations.jarFilter,
                              style: TextStyles.titleBoldLg,
                            ),
                            GestureDetector(
                              onTap:
                                  () => context
                                      .read<FilterContributionsBloc>()
                                      .add(
                                        state.hasFilters
                                            ? ClearAllFilters()
                                            : SelectAllFilters(allCollectorIds),
                                      ),
                              child: Text(
                                state.hasFilters
                                    ? localizations.clearAll
                                    : localizations.selectAll,
                                style: TextStyles.titleMediumM,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.spacingM),

                        Flexible(
                          child: SingleChildScrollView(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Payment Method Section
                                Text(
                                  localizations.paymentMethod,
                                  style: TextStyles.titleMedium,
                                ),
                                const SizedBox(height: AppSpacing.spacingS),

                                // Payment Methods List
                                ...List.generate(
                                  FilterOptions.paymentMethods.length,
                                  (index) {
                                    final method =
                                        FilterOptions.paymentMethods[index];
                                    final isSelected =
                                        state.selectedPaymentMethods?.contains(
                                          method.value,
                                        ) ??
                                        false;
                                    final isLast =
                                        index ==
                                        FilterOptions.paymentMethods.length - 1;

                                    return Padding(
                                      padding: EdgeInsets.only(
                                        bottom:
                                            isLast ? 0 : AppSpacing.spacingS,
                                      ),
                                      child: _buildPaymentMethodCard(
                                        context,
                                        method,
                                        isSelected,
                                      ),
                                    );
                                  },
                                ),

                                const SizedBox(height: AppSpacing.spacingM),

                                // Status Section
                                Text(
                                  localizations.status,
                                  style: TextStyles.titleMedium,
                                ),
                                const SizedBox(height: AppSpacing.spacingS),

                                // Status List
                                ...List.generate(
                                  FilterOptions.statuses.length,
                                  (index) {
                                    final status =
                                        FilterOptions.statuses[index];
                                    final isSelected =
                                        state.selectedStatuses?.contains(
                                          status.value,
                                        ) ??
                                        false;
                                    final isLast =
                                        index ==
                                        FilterOptions.statuses.length - 1;

                                    return Padding(
                                      padding: EdgeInsets.only(
                                        bottom:
                                            isLast ? 0 : AppSpacing.spacingS,
                                      ),
                                      child: _buildStatusCard(
                                        context,
                                        status,
                                        isSelected,
                                      ),
                                    );
                                  },
                                ),

                                // Collectors Section (only for jar creators)
                                BlocBuilder<AuthBloc, AuthState>(
                                  builder: (context, authState) {
                                    return BlocBuilder<
                                      JarSummaryBloc,
                                      JarSummaryState
                                    >(
                                      builder: (context, jarState) {
                                        if (jarState is JarSummaryLoaded) {
                                          // Check if current user is the creator of the jar
                                          final isCreator =
                                              authState is AuthAuthenticated &&
                                              jarState.jarData.creator.id ==
                                                  authState.user.id;

                                          // Only show collectors section if user is the creator
                                          if (!isCreator) {
                                            return Container();
                                          }

                                          final invitedCollectors =
                                              jarState.jarData.invitedCollectors
                                                  ?.where(
                                                    (collector) =>
                                                        collector.status ==
                                                            'accepted' &&
                                                        collector.collector !=
                                                            null,
                                                  )
                                                  .toList() ??
                                              [];

                                          if (invitedCollectors.isEmpty) {
                                            return Container();
                                          }

                                          return Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              const SizedBox(
                                                height: AppSpacing.spacingM,
                                              ),

                                              // Collector Section
                                              Text(
                                                localizations.collector,
                                                style: TextStyles.titleMedium,
                                              ),
                                              const SizedBox(
                                                height: AppSpacing.spacingS,
                                              ),

                                              // Collectors List
                                              AppCard(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      vertical:
                                                          AppSpacing.spacingXs,
                                                    ),
                                                child: Column(
                                                  children: List.generate(
                                                    invitedCollectors.length,
                                                    (index) {
                                                      final collectorModel =
                                                          invitedCollectors[index];
                                                      final collector =
                                                          collectorModel
                                                              .collector!;
                                                      final isSelected =
                                                          state
                                                              .selectedCollectors
                                                              ?.contains(
                                                                collector.id,
                                                              ) ??
                                                          false;

                                                      return ListTile(
                                                        leading:
                                                            ContributorAvatar(
                                                              contributorName:
                                                                  collector
                                                                      .fullName,
                                                              showStatusOverlay:
                                                                  false,
                                                            ),
                                                        title: Text(
                                                          collector.fullName,
                                                          style:
                                                              TextStyles
                                                                  .titleMediumM,
                                                        ),
                                                        subtitle: Text(
                                                          collector.phoneNumber,
                                                          style: TextStyles
                                                              .titleRegularXs
                                                              .copyWith(
                                                                color: Theme.of(
                                                                      context,
                                                                    )
                                                                    .colorScheme
                                                                    .onSurface
                                                                    .withValues(
                                                                      alpha:
                                                                          0.6,
                                                                    ),
                                                              ),
                                                        ),
                                                        trailing: Icon(
                                                          isSelected
                                                              ? Icons.check_box
                                                              : Icons
                                                                  .check_box_outline_blank,
                                                          size: 15,
                                                        ),
                                                        onTap:
                                                            () => context
                                                                .read<
                                                                  FilterContributionsBloc
                                                                >()
                                                                .add(
                                                                  ToggleCollector(
                                                                    collector
                                                                        .id,
                                                                  ),
                                                                ),
                                                      );
                                                    },
                                                  ),
                                                ),
                                              ),
                                            ],
                                          );
                                        }
                                        return Container();
                                      },
                                    );
                                  },
                                ),

                                const SizedBox(height: AppSpacing.spacingM),

                                // Date Section
                                Text(
                                  localizations.date,
                                  style: TextStyles.titleMedium,
                                ),
                                const SizedBox(height: AppSpacing.spacingS),

                                GestureDetector(
                                  onTap: () => _showDateOptions(context),
                                  child: AppCard(
                                    padding: EdgeInsets.zero,
                                    child: ListTile(
                                      title: Text(
                                        localizations.selectDate,
                                        style: TextStyles.titleMediumXs
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .onSurface
                                                  .withValues(alpha: 0.6),
                                            ),
                                      ),
                                      subtitle: Text(
                                        _getTranslatedDateOption(
                                          context,
                                          state.selectedDate ??
                                              FilterOptions.defaultDateOption,
                                        ),
                                        style: TextStyles.titleMediumS,
                                      ),
                                      trailing: const Icon(
                                        Icons.keyboard_arrow_down,
                                        size: 15,
                                      ),
                                    ),
                                  ),
                                ),

                                const SizedBox(height: AppSpacing.spacingM),
                              ],
                            ),
                          ),
                        ),

                        // Filter Button
                        AppButton.filled(
                          text: localizations.filter,
                          onPressed: () => _applyFilters(context),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }
            return Container();
          },
        );
      },
    );
  }

  Widget _buildPaymentMethodCard(
    BuildContext context,
    PaymentMethodOption method,
    bool isSelected,
  ) {
    final localizations = AppLocalizations.of(context)!;

    String getTranslatedLabel(String labelKey) {
      switch (labelKey) {
        case 'mobileMoneyPayment':
          return localizations.mobileMoneyPayment;
        case 'cashPayment':
          return localizations.cashPayment;
        case 'bankTransferPayment':
          return localizations.bankTransferPayment;
        default:
          return labelKey;
      }
    }

    return GestureDetector(
      onTap:
          () => context.read<FilterContributionsBloc>().add(
            TogglePaymentMethod(method.value),
          ),
      child: AppCard(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingXs),
        child: ListTile(
          leading: CircleAvatar(
            radius: 25,
            backgroundColor: Theme.of(context).colorScheme.surface,
            child: Icon(
              method.icon,
              size: 18,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          title: Text(
            getTranslatedLabel(method.label),
            style: TextStyles.titleMediumM,
          ),
          trailing: Icon(
            isSelected ? Icons.check_box : Icons.check_box_outline_blank,
            size: 16,
          ),
        ),
      ),
    );
  }

  Widget _buildStatusCard(
    BuildContext context,
    StatusOption status,
    bool isSelected,
  ) {
    final localizations = AppLocalizations.of(context)!;

    String getTranslatedLabel(String labelKey) {
      switch (labelKey) {
        case 'statusPending':
          return localizations.statusPending;
        case 'statusCompleted':
          return localizations.statusCompleted;
        case 'statusFailed':
          return localizations.statusFailed;
        case 'statusTransferred':
          return localizations.statusTransferred;
        default:
          return labelKey;
      }
    }

    return GestureDetector(
      onTap:
          () => context.read<FilterContributionsBloc>().add(
            ToggleStatus(status.value),
          ),
      child: AppCard(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingXs),
        child: ListTile(
          title: Text(
            getTranslatedLabel(status.label),
            style: TextStyles.titleMediumM,
          ),
          trailing: Icon(
            isSelected ? Icons.check_box : Icons.check_box_outline_blank,
            size: 16,
          ),
        ),
      ),
    );
  }
}
