import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/presentation/widgets/auth_widgets.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_settings_widgets.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

/// Goal: big target typed on the keypad, quick picks, and a deadline card.
class JarGoalView extends StatefulWidget {
  const JarGoalView({super.key});

  @override
  State<JarGoalView> createState() => _JarGoalViewState();
}

class _JarGoalViewState extends State<JarGoalView> {
  static const _quickTargets = [10000.0, 20000.0, 50000.0];

  /// What the user has typed, e.g. "20000". Empty means 0.
  String _input = '';
  DateTime? _selectedDeadline;
  bool _isInitialized = false;

  Future<void> _selectDeadline() async {
    final now = DateTime.now();
    // Allow past dates if we have an existing deadline in the past
    final minimumDate =
        _selectedDeadline != null && _selectedDeadline!.isBefore(now)
            ? _selectedDeadline!
            : now;

    final choice = await JarDeadlineSheet.show(
      context,
      initial: _selectedDeadline,
      minimum: minimumDate,
      maximum: now.add(const Duration(days: 365 * 5)),
    );
    if (choice != null && mounted) {
      setState(() => _selectedDeadline = choice.date);
    }
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

          if (!_isInitialized) {
            _input = JarAmountInput.fromAmount(jarData.goalAmount);
            _selectedDeadline = jarData.deadline;
            _isInitialized = true;
          }

          final current = JarAmountInput.toAmount(_input);
          final busy =
              context.watch<UpdateJarBloc>().state is UpdateJarInProgress;

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: JarTopBar(
              title: localizations.goal,
              actions: [
                if (jarData.goalAmount > 0)
                  JarBarLink(
                    'Remove',
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
            body: SafeArea(
              top: false,
              child: Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                      child: Column(
                        children: [
                          Text('Target', style: DsText.caption),
                          const SizedBox(height: 8),
                          JarAmountDisplay(
                            input: _input,
                            currency: jarData.currency.toUpperCase(),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            alignment: WrapAlignment.center,
                            spacing: 6,
                            children: [
                              for (final t in _quickTargets)
                                JarChip(
                                  label: '${(t / 1000).toStringAsFixed(0)}k',
                                  selected: current == t,
                                  onTap:
                                      () => setState(
                                        () =>
                                            _input = JarAmountInput.fromAmount(
                                              t,
                                            ),
                                      ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          DsCard(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            onTap: busy ? null : _selectDeadline,
                            child: Row(
                              children: [
                                const DsIconTile(
                                  Icons.calendar_today_outlined,
                                  tone: DsTone.lime,
                                  size: 32,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
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
                                            : 'No deadline',
                                        style: DsText.rowTitle.copyWith(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                DsLink(
                                  _selectedDeadline != null ? 'Change' : 'Set',
                                  onTap: busy ? null : _selectDeadline,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  AuthKeypad(
                    decimal: true,
                    onDigit:
                        (d) => setState(
                          () => _input = JarAmountInput.digit(_input, d),
                        ),
                    onBackspace:
                        () => setState(
                          () => _input = JarAmountInput.backspace(_input),
                        ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                    child: JarPrimaryButton(
                      label: 'Save goal',
                      loading: busy,
                      onTap: () {
                        if (busy) return;
                        final amount = JarAmountInput.toAmount(_input);
                        if (amount <= 0) {
                          AppSnackBar.showError(
                            context,
                            message: localizations.pleaseEnterValidAmount,
                          );
                          return;
                        }
                        context.read<UpdateJarBloc>().add(
                          UpdateJarRequested(
                            jarId: jarData.id,
                            updates: {
                              'goalAmount': amount,
                              // The update API ignores a null deadline, so
                              // only send one when it's set.
                              if (_selectedDeadline != null)
                                'deadline': _selectedDeadline,
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
