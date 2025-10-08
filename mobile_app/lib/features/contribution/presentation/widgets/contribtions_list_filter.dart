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
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class ContributionsListFilter extends StatefulWidget {
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

  @override
  State<ContributionsListFilter> createState() =>
      _ContributionsListFilterState();
}

class _ContributionsListFilterState extends State<ContributionsListFilter> {
  List<String> _pendingPaymentMethods = [];
  List<String> _pendingStatuses = [];
  List<String> _pendingCollectors = [];
  String? _pendingDate;
  DateTime? _pendingStartDate;
  DateTime? _pendingEndDate;

  @override
  void initState() {
    super.initState();
    final st = context.read<FilterContributionsBloc>().state;
    if (st is FilterContributionsLoaded) {
      _pendingPaymentMethods = List.from(st.selectedPaymentMethods ?? []);
      _pendingStatuses = List.from(st.selectedStatuses ?? []);
      _pendingCollectors = List.from(st.selectedCollectors ?? []);
      _pendingDate = st.selectedDate;
      _pendingStartDate = st.startDate;
      _pendingEndDate = st.endDate;
    }
  }

  void _togglePaymentMethod(String method) {
    setState(() {
      if (_pendingPaymentMethods.contains(method)) {
        _pendingPaymentMethods.remove(method);
      } else {
        _pendingPaymentMethods.add(method);
      }
    });
  }

  void _toggleStatus(String status) {
    setState(() {
      if (_pendingStatuses.contains(status)) {
        _pendingStatuses.remove(status);
      } else {
        _pendingStatuses.add(status);
      }
    });
  }

  void _toggleCollector(String id) {
    setState(() {
      if (_pendingCollectors.contains(id)) {
        _pendingCollectors.remove(id);
      } else {
        _pendingCollectors.add(id);
      }
    });
  }

  void _updateDate({required String dateKey, DateTime? start, DateTime? end}) {
    setState(() {
      _pendingDate = dateKey;
      _pendingStartDate = start;
      _pendingEndDate = end;
    });
  }

  void _applyFilters() {
    context.read<FilterContributionsBloc>().add(
      ApplyFilters(
        paymentMethods: _pendingPaymentMethods,
        statuses: _pendingStatuses,
        collectors: _pendingCollectors,
        selectedDate: _pendingDate,
        startDate: _pendingStartDate,
        endDate: _pendingEndDate,
      ),
    );
    Navigator.pop(context);
  }

  void _clearAll(List<String> allCollectorIds) {
    setState(() {
      _pendingPaymentMethods.clear();
      _pendingStatuses.clear();
      _pendingCollectors.clear();
      _pendingDate = null;
      _pendingStartDate = null;
      _pendingEndDate = null;
    });
  }

  void _selectAll(List<String> allCollectorIds) {
    setState(() {
      _pendingPaymentMethods = [
        'mobile-money',
        'cash',
        'bank-transfer',
        'card',
        'apple-pay',
      ];
      _pendingStatuses = ['pending', 'completed', 'failed', 'transferred'];
      _pendingCollectors = List.from(allCollectorIds);
      _pendingDate = _pendingDate ?? FilterOptions.defaultDateOption;
    });
  }

  void _showDateOptions(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    final currentSelected = _pendingDate ?? FilterOptions.defaultDateOption;

    // Translated date options
    final translatedDateOptions = [
      localizations.dateAll,
      localizations.dateToday,
      localizations.dateYesterday,
      localizations.dateLast7Days,
      localizations.dateLast30Days,
      localizations.dateCustomRange,
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder:
          (modalContext) => Padding(
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
                          translatedDateOptions.asMap().entries.map((entry) {
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
                                  _updateDate(dateKey: originalOption);
                                  Navigator.pop(modalContext);
                                }
                              },
                              trailing:
                                  currentSelected == originalOption
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
      _updateDate(
        dateKey: customRange,
        start: dateRange.startDate,
        end: dateRange.endDate,
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
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.spacingM,
                    vertical: AppSpacing.spacingM,
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
                            onTap: () {
                              final hasPending =
                                  _pendingPaymentMethods.isNotEmpty ||
                                  _pendingStatuses.isNotEmpty ||
                                  _pendingCollectors.isNotEmpty ||
                                  _pendingDate != null ||
                                  _pendingStartDate != null ||
                                  _pendingEndDate != null;
                              if (hasPending) {
                                _clearAll(allCollectorIds);
                              } else {
                                _selectAll(allCollectorIds);
                              }
                            },
                            child: Text(
                              (_pendingPaymentMethods.isNotEmpty ||
                                      _pendingStatuses.isNotEmpty ||
                                      _pendingCollectors.isNotEmpty ||
                                      _pendingDate != null ||
                                      _pendingStartDate != null ||
                                      _pendingEndDate != null)
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
                                  final isSelected = _pendingPaymentMethods
                                      .contains(method.value);
                                  final isLast =
                                      index ==
                                      FilterOptions.paymentMethods.length - 1;

                                  return Padding(
                                    padding: EdgeInsets.only(
                                      bottom: isLast ? 0 : AppSpacing.spacingS,
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
                              ...List.generate(FilterOptions.statuses.length, (
                                index,
                              ) {
                                final status = FilterOptions.statuses[index];
                                final isSelected = _pendingStatuses.contains(
                                  status.value,
                                );
                                final isLast =
                                    index == FilterOptions.statuses.length - 1;

                                return Padding(
                                  padding: EdgeInsets.only(
                                    bottom: isLast ? 0 : AppSpacing.spacingS,
                                  ),
                                  child: _buildStatusCard(
                                    context,
                                    status,
                                    isSelected,
                                  ),
                                );
                              }),

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
                                                        _pendingCollectors
                                                            .contains(
                                                              collector.id,
                                                            );

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
                                                                    alpha: 0.6,
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
                                                          () =>
                                                              _toggleCollector(
                                                                collector.id,
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
                                      style: TextStyles.titleMediumXs.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurface
                                            .withValues(alpha: 0.6),
                                      ),
                                    ),
                                    subtitle: Text(
                                      _getTranslatedDateOption(
                                        context,
                                        _pendingDate ??
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
                        onPressed: _applyFilters,
                      ),
                    ],
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
        case 'cardPayment':
          return localizations.cardPayment;
        case 'applePayPayment':
          return localizations.applePayPayment;
        default:
          return labelKey;
      }
    }

    return GestureDetector(
      onTap: () => _togglePaymentMethod(method.value),
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
      onTap: () => _toggleStatus(status.value),
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
