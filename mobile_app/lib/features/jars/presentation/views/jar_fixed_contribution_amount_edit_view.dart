import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/currency_text_field.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

/// Fixed amount: the amount every contributor pays.
class JarFixedContributionAmountEditView extends StatefulWidget {
  const JarFixedContributionAmountEditView({super.key});

  @override
  State<JarFixedContributionAmountEditView> createState() =>
      _JarFixedContributionAmountEditViewState();
}

class _JarFixedContributionAmountEditViewState
    extends State<JarFixedContributionAmountEditView> {
  final TextEditingController _amountController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
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
          final symbol = CurrencyUtils.getCurrencySymbol(jarData.currency);

          // Initialize the controller with the formatted amount if not already done
          if (_isInitialized == false) {
            _amountController.text =
                '$symbol${jarData.acceptedContributionAmount}';
            _isInitialized = true;
          }

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: const JarTopBar(title: 'Fixed amount'),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              children: [
                DsListCard(
                  children: [
                    DsRow(
                      title: 'Everyone pays the same',
                      subtitle: 'e.g. dues, tickets, susu',
                      trailing: const DsTag('On', tone: DsTone.lime),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Text(
                  'Amount per person',
                  style: DsText.caption,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
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
              ],
            ),
            bottomNavigationBar: JarFooter(
              children: [
                BlocBuilder<UpdateJarBloc, UpdateJarState>(
                  builder: (context, updateState) {
                    return JarPrimaryButton(
                      label: localizations.save,
                      loading: updateState is UpdateJarInProgress,
                      onTap: () {
                        // Get the numeric value directly from the currency text field
                        final amount =
                            CurrencyTextField(
                              controller: _amountController,
                              currencySymbol: symbol,
                            ).getNumericValue();

                        // Validate amount
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
                            updates: {'acceptedContributionAmount': amount},
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
