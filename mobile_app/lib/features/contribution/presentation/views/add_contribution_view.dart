import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/currency_text_field.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/route.dart';

class AddContributionView extends StatefulWidget {
  const AddContributionView({super.key});

  @override
  State<AddContributionView> createState() => _AddContributionViewState();
}

class _AddContributionViewState extends State<AddContributionView> {
  final TextEditingController _amountController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    // Auto-focus logic moved to BlocBuilder where we have access to jarData
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
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          localizations.addContribution,
          style: TextStyles.titleMediumLg.copyWith(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
          builder: (context, state) {
            if (state is JarSummaryLoaded) {
              final jarData = state.jarData;
              // Initialize the controller with the formatted amount if not already done
              if (_isInitialized == false) {
                final currencySymbol = CurrencyUtils.getCurrencySymbol(
                  jarData.currency,
                );
                // Only auto-focus if the field is editable (isFixedContribution is false)
                if (!jarData.isFixedContribution) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    _focusNode.requestFocus();
                  });
                } else {
                  // Format the amount with currency symbol for initial display
                  _amountController.text =
                      '$currencySymbol${jarData.acceptedContributionAmount}';
                  _isInitialized = true;
                }
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
                          Opacity(
                            opacity: jarData.isFixedContribution ? 0.6 : 1.0,
                            child: IgnorePointer(
                              ignoring: jarData.isFixedContribution,
                              child: CurrencyTextField(
                                controller: _amountController,
                                focusNode:
                                    jarData.isFixedContribution
                                        ? null
                                        : _focusNode,
                                currencySymbol: CurrencyUtils.getCurrencySymbol(
                                  jarData.currency,
                                ),
                                onChanged:
                                    jarData.isFixedContribution ? null : null,
                              ),
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
                    AppButton.filled(
                      text: localizations.continueText,
                      onPressed: () {
                        // Get the numeric value directly from the currency text field
                        final currencyTextField = CurrencyTextField(
                          controller: _amountController,
                          currencySymbol: CurrencyUtils.getCurrencySymbol(
                            state.jarData.currency,
                          ),
                        );
                        final amount = currencyTextField.getNumericValue();

                        // Validate amount
                        if (amount <= 0) {
                          AppSnackBar.show(
                            context,
                            message: localizations.pleaseEnterValidAmount,
                            type: SnackBarType.error,
                          );
                          return;
                        }

                        // Navigate to request momo screen with jar and amount data
                        Navigator.pushNamed(
                          context,
                          AppRoutes.saveContribution,
                          arguments: {
                            'jar': state.jarData,
                            'amount': amount.toString(),
                            'currency': CurrencyUtils.getCurrencySymbol(
                              state.jarData.currency,
                            ),
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
    );
  }
}
