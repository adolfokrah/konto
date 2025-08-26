import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/currency_text_field.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

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

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(
          localizations.fixedContributionAmount,
          style: TextStyles.titleMediumLg.copyWith(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: BlocListener<UpdateJarBloc, UpdateJarState>(
        listener: (context, state) {
          if (state is UpdateJarSuccess) {
            Navigator.of(context).pop();
            AppSnackBar.showSuccess(
              context,
              message: localizations.fixedContributionAmountUpdatedSuccessfully,
            );
          }
        },
        child: SafeArea(
          child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
            builder: (context, state) {
              if (state is JarSummaryLoaded) {
                final jarData = state.jarData;

                // Initialize the controller with the formatted amount if not already done
                if (_isInitialized == false) {
                  final currencySymbol = CurrencyUtils.getCurrencySymbol(
                    jarData.currency,
                  );
                  // Format the amount with currency symbol for initial display
                  _amountController.text =
                      '$currencySymbol${jarData.acceptedContributionAmount}';
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
                                jarData.currency,
                              ),
                            ),

                            const SizedBox(height: AppSpacing.spacingM),

                            // Jar name
                            Text(
                              jarData.name,
                              style: TextStyles.titleMediumLg.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),

                      // Continue button at bottom
                      BlocBuilder<UpdateJarBloc, UpdateJarState>(
                        builder: (context, state) {
                          return AppButton.filled(
                            text: localizations.continueText,
                            isLoading: state is UpdateJarInProgress,
                            onPressed: () {
                              // Get the numeric value directly from the currency text field
                              final currencyTextField = CurrencyTextField(
                                controller: _amountController,
                                currencySymbol: CurrencyUtils.getCurrencySymbol(
                                  jarData.currency,
                                ),
                              );
                              final amount =
                                  currencyTextField.getNumericValue();

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
                                  updates: {
                                    'acceptedContributionAmount': amount,
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
              }
              return Container();
            },
          ),
        ),
      ),
    );
  }
}
