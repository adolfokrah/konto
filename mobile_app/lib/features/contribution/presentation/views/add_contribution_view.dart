import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/currency_text_field.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/route.dart';
import 'package:go_router/go_router.dart';

class AddContributionView extends StatefulWidget {
  const AddContributionView({super.key});

  @override
  State<AddContributionView> createState() => _AddContributionViewState();
}

class _AddContributionViewState extends State<AddContributionView> {
  final TextEditingController _amountController = TextEditingController();
  final FocusNode _amountFocusNode = FocusNode();
  bool _isInitialized = false;
  double _selectedAmount = 0.0;
  bool _isEditingAmount = false;
  String _currencySymbol = '';

  // Predefined quick amount options
  final List<double> _quickAmounts = [10, 25, 50, 100];

  @override
  void initState() {
    super.initState();
    // Listen to controller changes to update _selectedAmount
    _amountController.addListener(_onAmountChanged);
  }

  @override
  void dispose() {
    _amountController.removeListener(_onAmountChanged);
    _amountController.dispose();
    _amountFocusNode.dispose();
    super.dispose();
  }

  void _onAmountChanged() {
    // Skip if currency symbol not yet initialized
    if (_currencySymbol.isEmpty) return;

    final currencyTextField = CurrencyTextField(
      controller: _amountController,
      currencySymbol: _currencySymbol,
    );
    final amount = currencyTextField.getNumericValue();
    if (_selectedAmount != amount) {
      setState(() {
        _selectedAmount = amount;
      });
    }
  }

  void _selectQuickAmount(double amount, String currencySymbol) {
    // Remove listener temporarily to avoid conflict
    _amountController.removeListener(_onAmountChanged);

    setState(() {
      _selectedAmount = amount;
      _amountController.text = '$currencySymbol ${amount.toStringAsFixed(0)}';
      _isEditingAmount = false; // Exit edit mode
    });

    // Re-add listener after a brief delay
    Future.delayed(const Duration(milliseconds: 100), () {
      _amountController.addListener(_onAmountChanged);
    });

    // Remove focus from text field when quick amount is selected
    _amountFocusNode.unfocus();
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
      body: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is JarSummaryLoaded) {
            final jarData = state.jarData;
            final currencySymbol = CurrencyUtils.getCurrencySymbol(
              jarData.currency,
            );

            // Initialize the controller with the formatted amount if not already done
            if (_isInitialized == false) {
              _isInitialized = true;
              _currencySymbol = currencySymbol;

              if (jarData.isFixedContribution) {
                // Set the amount first (without triggering setState during build)
                _selectedAmount = jarData.acceptedContributionAmount;

                // Use post frame callback to set the controller text after build
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    // Temporarily remove listener to avoid conflict
                    _amountController.removeListener(_onAmountChanged);
                    _amountController.text =
                        '$currencySymbol ${jarData.acceptedContributionAmount.toStringAsFixed(0)}';
                    // Re-add listener
                    _amountController.addListener(_onAmountChanged);
                  }
                });
              } else {
                // For non-fixed contributions, auto-select the first quick amount
                _selectedAmount = _quickAmounts.first;

                // Use post frame callback to set the controller text after build
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    // Temporarily remove listener to avoid conflict
                    _amountController.removeListener(_onAmountChanged);
                    _amountController.text =
                        '$currencySymbol ${_quickAmounts.first.toStringAsFixed(0)}';
                    // Re-add listener
                    _amountController.addListener(_onAmountChanged);
                  }
                });
              }
            }

            return Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingL,
                vertical: AppSpacing.spacingM,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.spacingL),

                  // Large amount display with edit icon
                  Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      if (jarData.isFixedContribution || !_isEditingAmount)
                        Text(
                          _selectedAmount > 0
                              ? '$currencySymbol${_selectedAmount.toStringAsFixed(0)}'
                              : '$currencySymbol${0}',
                          style: TextStyles.titleBoldXl.copyWith(
                            fontSize: 64,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      else
                        IntrinsicWidth(
                          child: CurrencyTextField(
                            controller: _amountController,
                            focusNode: _amountFocusNode,
                            currencySymbol: currencySymbol,
                            textAlign: TextAlign.left,
                            textStyle: TextStyles.titleBoldXl.copyWith(
                              fontSize: 64,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      if (!jarData.isFixedContribution && !_isEditingAmount)
                        IconButton(
                          icon: Icon(
                            Icons.edit,
                            size: 24,
                            color: Theme.of(context)
                                .textTheme
                                .bodyMedium!
                                .color
                                ?.withValues(alpha: 0.4),
                          ),
                          onPressed: () {
                            setState(() {
                              _isEditingAmount = true;
                            });
                            // Focus the text field after a brief delay
                            Future.delayed(
                              const Duration(milliseconds: 100),
                              () {
                                _amountFocusNode.requestFocus();
                              },
                            );
                          },
                        ),
                    ],
                  ),

                  const SizedBox(height: AppSpacing.spacingL),

                  // Quick amount selection buttons
                  Wrap(
                    spacing: AppSpacing.spacingXs,
                    runSpacing: AppSpacing.spacingXs,
                    children: _quickAmounts.map((amount) {
                      final isSelected = _selectedAmount == amount;
                      final isDark =
                          Theme.of(context).brightness == Brightness.dark;
                      final isDisabled = jarData.isFixedContribution;

                      // Define colors based on selection and theme
                      final backgroundColor = isSelected
                          ? Theme.of(context).colorScheme.onSurface
                          : Theme.of(context).colorScheme.surface;
                      final textColor = isSelected
                          ? (isDark
                              ? AppColors.onSurfaceDark
                              : AppColors.onPrimaryWhite)
                          : Theme.of(context).colorScheme.onSurface;
                      final borderColor = isSelected
                          ? Theme.of(context).colorScheme.onSurface
                          : Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.2);

                      return Opacity(
                        opacity: isDisabled ? 0.4 : 1.0,
                        child: GestureDetector(
                          onTap: isDisabled
                              ? null
                              : () => _selectQuickAmount(amount, currencySymbol),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: backgroundColor,
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: borderColor,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Text(
                              '$currencySymbol${amount.toStringAsFixed(0)}',
                              style: TextStyles.titleMedium.copyWith(
                                color: textColor,
                                fontWeight: FontWeight.w500,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: AppSpacing.spacingL),

                  const Spacer(),

                  // Continue button at bottom
                  AppButton.filled(
                    text: _selectedAmount > 0
                        ? '${localizations.contribute} ${CurrencyUtils.formatAmount(_selectedAmount, jarData.currency)}'
                        : localizations.continueText,
                    onPressed: () {
                      // Validate amount
                      if (_selectedAmount <= 0) {
                        AppSnackBar.show(
                          context,
                          message: localizations.pleaseEnterValidAmount,
                          type: SnackBarType.error,
                        );
                        return;
                      }

                      // Navigate to request momo screen with jar and amount data
                      context.push(
                        AppRoutes.saveContribution,
                        extra: {
                          'jar': state.jarData,
                          'amount': _selectedAmount.toString(),
                          'currency': state.jarData.currency,
                        },
                      );
                    },
                  ),
                  const SizedBox(height: AppSpacing.spacingM),
                ],
              ),
            );
          }
          return Container();
        },
      ),
    );
  }
}
