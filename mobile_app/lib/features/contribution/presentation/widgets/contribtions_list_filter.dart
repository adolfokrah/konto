import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/filter_options.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/date_range_picker.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

/// Localized labels for the filter option keys, shared by the sheet and the
/// active-filter chips on the Activity screen.
class FilterLabels {
  FilterLabels._();

  static String date(AppLocalizations l, String key) {
    // A custom date range is stored as its own label ("1/10/2026 - 6/10/2026")
    if (key.contains(' - ')) return key;
    return switch (key) {
      'dateAll' => l.dateAll,
      'dateToday' => l.dateToday,
      'dateYesterday' => l.dateYesterday,
      'dateLast7Days' => l.dateLast7Days,
      'dateLast30Days' => l.dateLast30Days,
      'dateCustomRange' => l.dateCustomRange,
      _ => key,
    };
  }

  static String paymentMethod(AppLocalizations l, String value) {
    final option = FilterOptions.paymentMethods.where((m) => m.value == value);
    final key = option.isEmpty ? value : option.first.label;
    return switch (key) {
      'mobileMoneyPayment' => l.mobileMoneyPayment,
      'cashPayment' => l.cashPayment,
      'bankTransferPayment' => l.bankTransferPayment,
      'cardPayment' => l.cardPayment,
      'applePayPayment' => l.applePayPayment,
      _ => key,
    };
  }

  static String status(AppLocalizations l, String value) {
    final option = FilterOptions.statuses.where((s) => s.value == value);
    final key = option.isEmpty ? value : option.first.label;
    return switch (key) {
      'statusPending' => l.statusPending,
      'statusCompleted' => l.statusCompleted,
      'statusFailed' => l.statusFailed,
      'statusTransferred' => l.statusTransferred,
      _ => key,
    };
  }

  static String transactionType(AppLocalizations l, String value) {
    final option = FilterOptions.transactionTypes.where(
      (t) => t.value == value,
    );
    final key = option.isEmpty ? value : option.first.label;
    return switch (key) {
      'typeContribution' => l.typeContribution,
      'typePayout' => l.typePayout,
      'typeRefund' => l.typeRefund,
      _ => key,
    };
  }
}

class ContributionsListFilter extends StatefulWidget {
  final String? contributor;
  const ContributionsListFilter({super.key, this.contributor});

  static void show(BuildContext context, {String? contributor}) {
    HapticUtils.heavy();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (modalContext) => ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.90,
            ),
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
  List<String> _pendingTransactionTypes = [];
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
      _pendingTransactionTypes = List.from(st.selectedTransactionTypes ?? []);
      _pendingDate = st.selectedDate;
      _pendingStartDate = st.startDate;
      _pendingEndDate = st.endDate;
    }
  }

  void _toggle(List<String> list, String value) {
    HapticUtils.selection();
    setState(() {
      if (list.contains(value)) {
        list.remove(value);
      } else {
        list.add(value);
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
        transactionTypes: _pendingTransactionTypes,
        selectedDate: _pendingDate,
        startDate: _pendingStartDate,
        endDate: _pendingEndDate,
      ),
    );
    Navigator.pop(context);
  }

  void _clearAll() {
    setState(() {
      _pendingPaymentMethods.clear();
      _pendingStatuses.clear();
      _pendingCollectors.clear();
      _pendingTransactionTypes.clear();
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
        'bank',
        'card',
        'apple-pay',
      ];
      _pendingStatuses = ['pending', 'completed', 'failed'];
      _pendingTransactionTypes = ['contribution', 'payout'];
      _pendingCollectors = List.from(allCollectorIds);
      _pendingDate = _pendingDate ?? FilterOptions.defaultDateOption;
    });
  }

  bool get _hasPending =>
      _pendingPaymentMethods.isNotEmpty ||
      _pendingStatuses.isNotEmpty ||
      _pendingCollectors.isNotEmpty ||
      _pendingTransactionTypes.isNotEmpty ||
      _pendingDate != null ||
      _pendingStartDate != null ||
      _pendingEndDate != null;

  void _showCustomDateRangePicker(BuildContext context) async {
    final dateRange = await DateRangePicker.showDateRangePicker(
      context: context,
      initialStartDate: _pendingStartDate,
      initialEndDate: _pendingEndDate,
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

  Widget _section(String title, List<Widget> chips) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CollectCap(title),
        const SizedBox(height: 6),
        Wrap(spacing: 6, runSpacing: 6, children: chips),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, jarState) {
        // Accepted collectors, shown to the jar creator only
        final authState = context.read<AuthBloc>().state;
        List<({String id, String name})> collectors = [];
        bool isCreator = false;
        if (jarState is JarSummaryLoaded) {
          isCreator =
              authState is AuthAuthenticated &&
              jarState.jarData.creator.id == authState.user.id;
          collectors =
              (jarState.jarData.invitedCollectors ?? [])
                  .where((c) => c.status == 'accepted')
                  .map((c) => (id: c.collector.id, name: c.collector.fullName))
                  .toList();
        }
        final allCollectorIds = collectors.map((c) => c.id).toList();

        return BlocBuilder<FilterContributionsBloc, FilterContributionsState>(
          builder: (context, state) {
            if (state is! FilterContributionsLoaded) return Container();

            final selectedDate =
                _pendingDate ?? FilterOptions.defaultDateOption;
            final isCustom = selectedDate.contains(' - ');

            return CollectSheet(
              title: 'Filters',
              scrollable: true,
              trailing: DsLink(
                _hasPending ? 'Reset' : localizations.selectAll,
                onTap: () {
                  if (_hasPending) {
                    _clearAll();
                  } else {
                    _selectAll(allCollectorIds);
                  }
                },
              ),
              children: [
                _section(localizations.date, [
                  for (final option in FilterOptions.dateOptions)
                    if (option == FilterOptions.customDateRangeOption)
                      CollectChip(
                        label:
                            isCustom
                                ? selectedDate
                                : FilterLabels.date(localizations, option),
                        selected: isCustom,
                        trailingIcon: Icons.calendar_today_rounded,
                        onTap: () => _showCustomDateRangePicker(context),
                      )
                    else
                      CollectChip(
                        label: FilterLabels.date(localizations, option),
                        selected: selectedDate == option,
                        onTap: () => _updateDate(dateKey: option),
                      ),
                ]),
                _section(localizations.transactionType, [
                  for (final type in FilterOptions.transactionTypes)
                    CollectChip(
                      label: FilterLabels.transactionType(
                        localizations,
                        type.value,
                      ),
                      selected: _pendingTransactionTypes.contains(type.value),
                      onTap:
                          () => _toggle(_pendingTransactionTypes, type.value),
                    ),
                ]),
                _section(localizations.status, [
                  for (final status in FilterOptions.statuses)
                    CollectChip(
                      label: FilterLabels.status(localizations, status.value),
                      selected: _pendingStatuses.contains(status.value),
                      onTap: () => _toggle(_pendingStatuses, status.value),
                    ),
                ]),
                _section(localizations.paymentMethod, [
                  for (final method in FilterOptions.paymentMethods)
                    CollectChip(
                      label: FilterLabels.paymentMethod(
                        localizations,
                        method.value,
                      ),
                      selected: _pendingPaymentMethods.contains(method.value),
                      onTap:
                          () => _toggle(_pendingPaymentMethods, method.value),
                    ),
                ]),
                if (isCreator && collectors.isNotEmpty)
                  _section(localizations.collector, [
                    for (final c in collectors)
                      CollectChip(
                        label: c.name,
                        selected: _pendingCollectors.contains(c.id),
                        onTap: () => _toggle(_pendingCollectors, c.id),
                      ),
                  ]),
                const SizedBox(height: 2),
                AppButton.filled(
                  text: localizations.filter,
                  onPressed: _applyFilters,
                ),
              ],
            );
          },
        );
      },
    );
  }
}
