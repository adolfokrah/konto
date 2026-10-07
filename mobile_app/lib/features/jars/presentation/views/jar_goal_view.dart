import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/currency_text_field.dart';
import 'package:Hoga/core/widgets/date_range_picker.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

/// Goal: big target amount, quick picks, and a deadline card.
class JarGoalView extends StatefulWidget {
  const JarGoalView({super.key});

  @override
  State<JarGoalView> createState() => _JarGoalViewState();
}

class _JarGoalViewState extends State<JarGoalView>
    with TickerProviderStateMixin {
  static const _quickTargets = [10000.0, 20000.0, 50000.0];

  late TextEditingController _amountController;
  final FocusNode _focusNode = FocusNode();
  DateTime? _selectedDeadline;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    // Auto-focus the input field when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    if (_isInitialized) _amountController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _selectDeadline(BuildContext context) async {
    final DateTime now = DateTime.now();

    // Always use existing deadline if available, otherwise default to 7 days from now
    final DateTime initialDate =
        _selectedDeadline ?? now.add(const Duration(days: 7));

    // Allow past dates if we have an existing deadline in the past
    final DateTime minimumDate =
        _selectedDeadline != null && _selectedDeadline!.isBefore(now)
            ? _selectedDeadline!
            : now;

    final DateTime? selectedDate = await DateRangePicker.showSingleDatePicker(
      context: context,
      initialDate: initialDate,
      minimumDate: minimumDate,
      maximumDate: DateTime.now().add(const Duration(days: 365 * 5)),
      title: 'Goal deadline',
    );

    if (selectedDate != null) {
      setState(() {
        _selectedDeadline = selectedDate;
      });
    }
  }

  double _currentAmount(String symbol) {
    final field = CurrencyTextField(
      controller: _amountController,
      currencySymbol: symbol,
    );
    return field.getNumericValue();
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocListener<UpdateJarBloc, UpdateJarState>(
      listener: (context, state) {
        if (state is UpdateJarSuccess) {
          context.pop();
          context.read<JarSummaryReloadBloc>().add(ReloadJarSummaryRequested());
        } else if (state is UpdateJarFailure) {
          AppSnackBar.showError(
            context,
            message: localizations.failedToUpdateJarGoal,
          );
        }
      },
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is! JarSummaryLoaded) {
            return Scaffold(
              backgroundColor: AppColors.cream,
              appBar: JarTopBar(title: localizations.goal),
              body: const SizedBox.shrink(),
            );
          }

          final jarData = state.jarData;
          final symbol = CurrencyUtils.getCurrencySymbol(jarData.currency);

          // Initialize controllers with jar data if not already done
          if (!_isInitialized) {
            final initialAmount =
                jarData.goalAmount > 0
                    ? '$symbol${jarData.goalAmount.toStringAsFixed(2)}'
                    : symbol;
            _amountController = TextEditingController(text: initialAmount);
            _amountController.addListener(() => setState(() {}));

            // Initialize selected deadline from jar data
            if (jarData.deadline != null) {
              _selectedDeadline = jarData.deadline;
            }

            _isInitialized = true;
          }

          final current = _currentAmount(symbol);

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: JarTopBar(
              title: localizations.goal,
              actions: [
                if (jarData.goalAmount > 0)
                  JarBarLink(
                    localizations.removeGoal.split(' ').first,
                    destructive: true,
                    onTap: () {
                      // Remove goal by setting goalAmount to 0 and deadline to null
                      context.read<UpdateJarBloc>().add(
                        UpdateJarRequested(
                          jarId: jarData.id,
                          updates: {'goalAmount': 0.0, 'deadline': null},
                        ),
                      );
                    },
                  ),
              ],
            ),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              children: [
                Text(
                  'Target',
                  style: DsText.caption,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                // Large amount display
                CurrencyTextField(
                  controller: _amountController,
                  focusNode: _focusNode,
                  currencySymbol: symbol,
                ),
                const SizedBox(height: 4),
                Text(
                  jarData.name,
                  style: DsText.small,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 6,
                  children: [
                    for (final t in _quickTargets)
                      JarChip(
                        label: '${(t / 1000).toStringAsFixed(0)}k',
                        selected: current == t,
                        onTap: () {
                          final text = '$symbol ${t.toStringAsFixed(0)}';
                          _amountController.value = TextEditingValue(
                            text: text,
                            selection: TextSelection.collapsed(
                              offset: text.length,
                            ),
                          );
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 20),
                BlocBuilder<UpdateJarBloc, UpdateJarState>(
                  builder: (context, jarUpdateState) {
                    return DsCard(
                      onTap: () {
                        if (jarUpdateState is UpdateJarInProgress) return;
                        _selectDeadline(context);
                      },
                      child: Row(
                        children: [
                          const DsIconTile(
                            Icons.calendar_today_outlined,
                            tone: DsTone.lime,
                            size: 40,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  localizations.deadline,
                                  style: DsText.caption,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _selectedDeadline != null
                                      ? DateFormat(
                                        'EEE, d MMMM',
                                        localizations.localeName,
                                      ).format(_selectedDeadline!)
                                      : localizations
                                          .tapCalendarButtonToSetDeadline,
                                  style: DsText.rowTitle,
                                ),
                              ],
                            ),
                          ),
                          DsLink(_selectedDeadline != null ? 'Change' : 'Set'),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
            bottomNavigationBar: JarFooter(
              children: [
                BlocBuilder<UpdateJarBloc, UpdateJarState>(
                  builder: (context, jarUpdateState) {
                    return JarPrimaryButton(
                      label: localizations.continueText,
                      loading: jarUpdateState is UpdateJarInProgress,
                      onTap: () {
                        if (jarUpdateState is UpdateJarInProgress) {
                          return;
                        }
                        final amount = _currentAmount(symbol);

                        if (amount <= 0) {
                          // Handle empty or invalid amount
                          return;
                        }

                        context.read<UpdateJarBloc>().add(
                          UpdateJarRequested(
                            jarId: jarData.id,
                            updates: {
                              'goalAmount': amount,
                              if (_selectedDeadline != null)
                                'deadline': _selectedDeadline,
                            },
                          ),
                        );
                      },
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
