import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/currency_text_field.dart';
import 'package:Hoga/core/widgets/date_range_picker.dart';
import 'package:Hoga/core/widgets/icon_button.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class JarGoalView extends StatefulWidget {
  const JarGoalView({super.key});

  @override
  State<JarGoalView> createState() => _JarGoalViewState();
}

class _JarGoalViewState extends State<JarGoalView>
    with TickerProviderStateMixin {
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
    _amountController.dispose();
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
      title: 'Select Deadline',
    );

    if (selectedDate != null) {
      setState(() {
        _selectedDeadline = selectedDate;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          localizations.jarGoal,
          style: TextStyles.titleMediumLg.copyWith(fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
        actions: [
          BlocBuilder<JarSummaryBloc, JarSummaryState>(
            builder: (context, state) {
              if (state is JarSummaryLoaded && state.jarData.goalAmount > 0) {
                return GestureDetector(
                  onTap: () {
                    // Remove goal by setting goalAmount to 0 and deadline to null
                    context.read<UpdateJarBloc>().add(
                      UpdateJarRequested(
                        jarId: state.jarData.id,
                        updates: {'goalAmount': 0.0, 'deadline': null},
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 8.0,
                    ),
                    child: Text(
                      localizations.removeGoal,
                      style: TextStyles.titleMedium.copyWith(
                        color: Theme.of(
                          context,
                        ).textTheme.bodyLarge?.color?.withValues(alpha: 0.7),
                      ),
                    ),
                  ),
                );
              }
              return Container();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: BlocListener<UpdateJarBloc, UpdateJarState>(
          listener: (context, state) {
            if (state is UpdateJarSuccess) {
              Navigator.of(context).pop();
              context.read<JarSummaryReloadBloc>().add(
                ReloadJarSummaryRequested(),
              );
            } else if (state is UpdateJarFailure) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(localizations.failedToUpdateJarGoal)),
              );
            }
          },
          child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
            builder: (context, state) {
              if (state is JarSummaryLoaded) {
                // Initialize controllers with jar data if not already done
                if (!_isInitialized) {
                  final currencySymbol = CurrencyUtils.getCurrencySymbol(
                    state.jarData.currency,
                  );
                  final initialAmount =
                      state.jarData.goalAmount > 0
                          ? '$currencySymbol${state.jarData.goalAmount.toStringAsFixed(2)}'
                          : currencySymbol;
                  _amountController = TextEditingController(
                    text: initialAmount,
                  );

                  // Initialize selected deadline from jar data
                  if (state.jarData.deadline != null) {
                    _selectedDeadline = state.jarData.deadline;
                  }

                  _isInitialized = true;
                }

                return Padding(
                  padding: const EdgeInsets.all(AppSpacing.spacingL),
                  child: Column(
                    children: [
                      // Main content area
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Large amount display
                            CurrencyTextField(
                              controller: _amountController,
                              focusNode: _focusNode,
                              currencySymbol: CurrencyUtils.getCurrencySymbol(
                                state.jarData.currency,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.spacingM),

                            // Jar name
                            Text(
                              state.jarData.name,
                              style: TextStyles.titleMediumLg.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: AppSpacing.spacingM),

                            Text(
                              _selectedDeadline != null
                                  ? '${localizations.deadline}, ${DateFormat('MMM dd, yyyy').format(_selectedDeadline!)}'
                                  : localizations
                                      .tapCalendarButtonToSetDeadline,
                              style: TextStyles.titleRegularSm.copyWith(
                                color: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.color
                                    ?.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Continue button at bottom
                      BlocBuilder<UpdateJarBloc, UpdateJarState>(
                        builder: (context, jarUpdateState) {
                          return Row(
                            children: [
                              AppIconButton(
                                icon: Icons.calendar_month,
                                onPressed: () {
                                  if (jarUpdateState is UpdateJarInProgress) {
                                    return;
                                  }

                                  _selectDeadline(context);
                                },
                              ),
                              const SizedBox(width: AppSpacing.spacingS),
                              Expanded(
                                child: AppButton.filled(
                                  isLoading:
                                      jarUpdateState is UpdateJarInProgress,
                                  text: localizations.continueText,
                                  onPressed: () {
                                    if (jarUpdateState is UpdateJarInProgress) {
                                      return;
                                    }
                                    // Get the numeric value directly from the currency text field
                                    final currencyTextField = CurrencyTextField(
                                      controller: _amountController,
                                      currencySymbol:
                                          CurrencyUtils.getCurrencySymbol(
                                            state.jarData.currency,
                                          ),
                                    );
                                    final amount =
                                        currencyTextField.getNumericValue();

                                    if (amount <= 0) {
                                      // Handle empty or invalid amount
                                      return;
                                    }

                                    context.read<UpdateJarBloc>().add(
                                      UpdateJarRequested(
                                        jarId: state.jarData.id,
                                        updates: {
                                          'goalAmount': amount,
                                          if (_selectedDeadline != null)
                                            'deadline': _selectedDeadline,
                                        },
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                );
              }
              return Container();
            },
          ),
        ),
      ),
    );
  }
}
