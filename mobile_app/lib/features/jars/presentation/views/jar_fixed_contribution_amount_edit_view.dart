import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/presentation/widgets/auth_widgets.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_settings_widgets.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

/// Fixed amount: turn "Everyone pays the same" on or off and set the amount
/// per person on the keypad.
class JarFixedContributionAmountEditView extends StatefulWidget {
  const JarFixedContributionAmountEditView({super.key});

  @override
  State<JarFixedContributionAmountEditView> createState() =>
      _JarFixedContributionAmountEditViewState();
}

class _JarFixedContributionAmountEditViewState
    extends State<JarFixedContributionAmountEditView> {
  /// What the user has typed, e.g. "100". Empty means 0.
  String _input = '';
  bool _fixed = true;
  bool _isInitialized = false;

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocListener<UpdateJarBloc, UpdateJarState>(
      listener: (context, state) {
        if (state is UpdateJarSuccess) {
          context.pop();
          AppSnackBar.showSuccess(
            context,
            message: localizations.fixedContributionAmountUpdatedSuccessfully,
          );
        }
      },
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is! JarSummaryLoaded) {
            return const Scaffold(
              backgroundColor: AppColors.cream,
              appBar: JarTopBar(title: 'Fixed amount'),
              body: SizedBox.shrink(),
            );
          }
          final jarData = state.jarData;

          if (!_isInitialized) {
            _fixed = jarData.isFixedContribution;
            _input = JarAmountInput.fromAmount(
              jarData.acceptedContributionAmount,
            );
            _isInitialized = true;
          }

          final busy =
              context.watch<UpdateJarBloc>().state is UpdateJarInProgress;

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: const JarTopBar(title: 'Fixed amount'),
            body: SafeArea(
              top: false,
              child: Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
                      child: Column(
                        children: [
                          DsListCard(
                            children: [
                              DsRow(
                                title: 'Everyone pays the same',
                                subtitle: 'e.g. dues, tickets, susu',
                                trailing: JarToggle(
                                  value: _fixed,
                                  onChanged:
                                      busy
                                          ? null
                                          : (v) => setState(() => _fixed = v),
                                ),
                              ),
                            ],
                          ),
                          if (_fixed) ...[
                            const SizedBox(height: 20),
                            Text('Amount per person', style: DsText.caption),
                            const SizedBox(height: 8),
                            JarAmountDisplay(
                              input: _input,
                              currency: jarData.currency.toUpperCase(),
                              size: 52,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  if (_fixed)
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
                      label: localizations.save,
                      loading: busy,
                      onTap: () {
                        if (busy) return;
                        if (!_fixed) {
                          // Turning it off clears the amount.
                          context.read<UpdateJarBloc>().add(
                            UpdateJarRequested(
                              jarId: jarData.id,
                              updates: {
                                'isFixedContribution': false,
                                'acceptedContributionAmount': null,
                              },
                            ),
                          );
                          return;
                        }
                        final amount = JarAmountInput.toAmount(_input);
                        if (amount <= 0) {
                          AppSnackBar.show(
                            context,
                            message: localizations.pleaseEnterValidAmount,
                            type: SnackBarType.error,
                          );
                          return;
                        }
                        context.read<UpdateJarBloc>().add(
                          UpdateJarRequested(
                            jarId: jarData.id,
                            updates: {
                              if (!jarData.isFixedContribution)
                                'isFixedContribution': true,
                              'acceptedContributionAmount': amount,
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
