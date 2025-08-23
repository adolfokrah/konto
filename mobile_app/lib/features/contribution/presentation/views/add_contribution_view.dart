import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/route.dart';

class CurrencyInputFormatter extends TextInputFormatter {
  String _currencySymbol = '';

  // Set the currency symbol that should always be preserved
  void setCurrencySymbol(String symbol) {
    _currencySymbol = symbol;
  }

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Always ensure currency symbol is present
    if (_currencySymbol.isNotEmpty &&
        !newValue.text.startsWith(_currencySymbol)) {
      // If user tries to delete currency symbol, restore it
      if (newValue.text.isEmpty) {
        return TextEditingValue(
          text: _currencySymbol,
          selection: TextSelection.collapsed(offset: _currencySymbol.length),
        );
      }
      // If user is typing without currency symbol, add it back
      return TextEditingValue(
        text: '$_currencySymbol${newValue.text}',
        selection: TextSelection.collapsed(
          offset: _currencySymbol.length + newValue.text.length,
        ),
      );
    }

    if (newValue.text.isEmpty) {
      return newValue;
    }

    // Extract currency symbol from the beginning of the text
    String currencySymbol = '';
    String numberPart = newValue.text;

    // Find currency symbols at the beginning (₵, $, €, £, ₦, etc.)
    final currencyMatch = RegExp(r'^([₵$€£₦¥¢])\s*').firstMatch(newValue.text);
    if (currencyMatch != null) {
      currencySymbol = currencyMatch.group(1)!;
      numberPart = newValue.text.substring(currencyMatch.end);
    }

    // Convert all commas to dots immediately for consistency
    String cleaned = numberPart.replaceAll(',', '.');

    // Remove all non-digit characters except dot
    cleaned = cleaned.replaceAll(RegExp(r'[^\d.]'), '');

    // Find the last dot (decimal separator)
    int decimalIndex = cleaned.lastIndexOf('.');

    String result;
    if (decimalIndex == -1) {
      // No decimal separator, just return the number as is
      result = _formatNumber(cleaned);
    } else {
      // Has decimal separator
      String integerPart = cleaned.substring(0, decimalIndex);
      String decimalPart = cleaned.substring(decimalIndex + 1);

      // Remove all dots from integer part (in case of multiple dots)
      integerPart = integerPart.replaceAll('.', '');

      // Limit decimal part to 2 digits
      if (decimalPart.length > 2) {
        decimalPart = decimalPart.substring(0, 2);
      }

      // Format integer part and add decimal (no comma formatting)
      String formattedInteger = _formatNumber(integerPart);
      result = '$formattedInteger.$decimalPart';
    }

    // Always preserve the currency symbol at the beginning
    String finalResult =
        currencySymbol.isNotEmpty ? '$currencySymbol$result' : result;
    return TextEditingValue(
      text: finalResult,
      selection: TextSelection.collapsed(offset: finalResult.length),
    );
  }

  String _formatNumber(String number) {
    if (number.isEmpty) return '';

    // Just return the number as is, no comma formatting
    return number;
  }
}

class AddContributionView extends StatefulWidget {
  const AddContributionView({super.key});

  @override
  State<AddContributionView> createState() => _AddContributionViewState();
}

class _AddContributionViewState extends State<AddContributionView> {
  final TextEditingController _amountController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final CurrencyInputFormatter _currencyFormatter = CurrencyInputFormatter();
  bool _hasInitializedCurrency = false;

  @override
  void initState() {
    super.initState();
    // Auto-focus the input field when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  void _initializeCurrencySymbol(String currency) {
    if (!_hasInitializedCurrency) {
      final currencySymbol = CurrencyUtils.getCurrencySymbol(currency);
      _currencyFormatter.setCurrencySymbol(currencySymbol);
      _amountController.text = currencySymbol;
      _hasInitializedCurrency = true;
      // Set cursor position after the currency symbol
      _amountController.selection = TextSelection.collapsed(
        offset: currencySymbol.length,
      );
    }
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
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          localizations.addContribution,
          style: TextStyles.titleMediumLg.copyWith(
            color: AppColors.black,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
          builder: (context, state) {
            if (state is JarSummaryLoaded) {
              // Initialize currency symbol on first load
              _initializeCurrencySymbol(state.jarData.currency);

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
                          TextField(
                            controller: _amountController,
                            focusNode: _focusNode,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                              signed: false,
                            ),
                            inputFormatters: [_currencyFormatter],
                            cursorColor: AppColors.black,
                            style: TextStyles.titleBoldXl.copyWith(
                              color: AppColors.black,
                              fontSize: 64,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                            decoration: InputDecoration(
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),

                          const SizedBox(height: AppSpacing.spacingM),

                          // Jar name
                          Text(
                            state.jarData.name,
                            style: TextStyles.titleMediumLg.copyWith(
                              color: AppColors.black,
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
                        // Get the amount without currency symbol for calculations
                        String plainAmount =
                            _amountController.text
                                .replaceAll(
                                  CurrencyUtils.getCurrencySymbol(
                                    state.jarData.currency,
                                  ),
                                  '',
                                )
                                .trim();

                        // Validate amount
                        if (plainAmount.isEmpty ||
                            double.tryParse(plainAmount.replaceAll(',', '')) ==
                                null ||
                            double.parse(plainAmount.replaceAll(',', '')) <=
                                0) {
                          AppSnackBar.showError(
                            context,
                            message: localizations.pleaseEnterValidAmount,
                          );
                          return;
                        }

                        // Navigate to request momo screen with jar and amount data
                        Navigator.pushNamed(
                          context,
                          AppRoutes.requestMomo,
                          arguments: {
                            'jar': state.jarData,
                            'amount': plainAmount.replaceAll(',', ''),
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
