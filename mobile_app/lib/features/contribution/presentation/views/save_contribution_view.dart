import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class SaveContributionView extends StatefulWidget {
  const SaveContributionView({super.key});

  @override
  State<SaveContributionView> createState() => _SaveContributionViewState();
}

class _SaveContributionViewState extends State<SaveContributionView> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _accountNumberController =
      TextEditingController();
  String _selectedPaymentMethod = 'mobile-money'; // Store API format
  String _selectedOperator = 'MTN Mobile Money';

  // Arguments from previous screen
  String? amount;
  String? currency;
  String? jarName;
  String? jarId;
  String? jarCreatorId;

  final List<String> _operators = [
    'MTN Mobile Money',
    'Vodafone Cash',
    'AirtelTigo Money',
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    // Get arguments passed from add_contribution_view
    final arguments =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;

    if (arguments != null) {
      amount = arguments['amount'] as String?;
      currency = arguments['currency'] as String?;

      // Extract jar details from the jar object
      final jar = arguments['jar'];
      if (jar != null) {
        // Handle both Map and object types for jar data
        if (jar is Map<String, dynamic>) {
          jarId = jar['id'] as String?;
          jarName = jar['name'] as String?;
          // Extract creator ID - could be nested in creator object or direct field
          if (jar['creator'] != null) {
            if (jar['creator'] is Map<String, dynamic>) {
              jarCreatorId = jar['creator']['id'] as String?;
            } else if (jar['creator'] is String) {
              jarCreatorId = jar['creator'] as String?;
            }
          }
        } else {
          // Assume it's a jar model object
          jarId = jar.id as String?;
          jarName = jar.name as String?;
          // Extract creator ID from jar model object
          if (jar.creator != null) {
            jarCreatorId = jar.creator.id as String?;
          }
        }
      }
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    // Create a mapping of API values to display names using utility function
    final Map<String, String> paymentMethodMap =
        PaymentMethodUtils.getPaymentMethodMap(localizations);

    return BlocListener<AddContributionBloc, AddContributionState>(
      listener: (context, state) {
        final localizations = AppLocalizations.of(context)!;
        if (state is AddContributionSuccess) {
          context.read<JarSummaryReloadBloc>().add(ReloadJarSummaryRequested());

          if (_selectedPaymentMethod == 'mobile-money') {
            context.read<MomoPaymentBloc>().add(
              MomoPaymentRequested(state.contributionId),
            );
            Navigator.pushNamed(context, AppRoutes.awaitMomoPayment);
          } else {
            Navigator.popUntil(
              context,
              ModalRoute.withName(AppRoutes.jarDetail),
            );
          }
          // Show success message
          AppSnackBar.showSuccess(
            context,
            message: localizations.paymentRequestSentSuccessfully,
          );
        } else if (state is AddContributionFailure) {
          // Show error message with specific error handling
          String errorMessage;
          if (state.errorMessage == 'UNKNOWN_ERROR') {
            errorMessage = localizations.unknownError;
          } else if (state.errorMessage.startsWith('UNEXPECTED_ERROR:')) {
            errorMessage = localizations.unexpectedError;
          } else {
            // Use the specific error message from server or fallback to generic
            errorMessage =
                state.errorMessage.isNotEmpty
                    ? state.errorMessage
                    : localizations.failedToSendPaymentRequest;
          }

          AppSnackBar.showError(context, message: errorMessage);
        }
      },
      child: BlocBuilder<AddContributionBloc, AddContributionState>(
        builder: (context, state) {
          final isLoading = state is AddContributionLoading;

          return Scaffold(
            appBar: AppBar(
              elevation: 0,
              automaticallyImplyLeading:
                  !isLoading, // Disable back button when loading
              title: Text(
                localizations.requestPayment,
                style: TextStyles.titleMediumLg.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              centerTitle: true,
            ),
            body: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingM,
              ),
              child: SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight:
                        MediaQuery.of(context).size.height -
                        MediaQuery.of(context).padding.top -
                        MediaQuery.of(context).padding.bottom -
                        kToolbarHeight -
                        (AppSpacing.spacingM * 2), // Account for padding
                  ),
                  child: IntrinsicHeight(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Amount section
                        Text(
                          localizations.amount,
                          style: TextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.spacingS),

                        // Large amount display
                        if (amount != null && currency != null) ...[
                          Text(
                            CurrencyUtils.formatAmount(
                              double.tryParse(amount!) ?? 0.0,
                              currency!,
                            ),
                            style: TextStyles.titleBoldXl.copyWith(
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.spacingL),
                        ],

                        // Payment method selection
                        SelectInput<String>(
                          label: localizations.paymentMethod,
                          value: _selectedPaymentMethod,
                          options:
                              paymentMethodMap.entries
                                  .map(
                                    (entry) => SelectOption(
                                      value: entry.key, // API value
                                      label:
                                          entry.value, // Localized display name
                                    ),
                                  )
                                  .toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedPaymentMethod = value;
                            });
                          },
                        ),

                        const SizedBox(height: AppSpacing.spacingM),

                        // Operator selection (only show if Mobile Money is selected)
                        if (_selectedPaymentMethod == 'mobile-money') ...[
                          SelectInput<String>(
                            label: localizations.operator,
                            value: _selectedOperator,
                            options:
                                _operators
                                    .map(
                                      (operator) => SelectOption(
                                        value: operator,
                                        label: operator,
                                      ),
                                    )
                                    .toList(),
                            onChanged: (value) {
                              setState(() {
                                _selectedOperator = value;
                              });
                            },
                          ),
                          const SizedBox(height: AppSpacing.spacingM),
                        ],

                        // Phone number input (only show for Mobile Money)
                        AppTextInput(
                          controller: _phoneController,
                          label: localizations.phoneNumber,
                          hintText: localizations.enterMobileMoneyNumber,
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: AppSpacing.spacingM),

                        AppTextInput(
                          controller: _nameController,
                          label: localizations.contributorName,
                          hintText: localizations.enterContributorName,
                          keyboardType: TextInputType.name,
                        ),

                        // // Account Name input (only show if Bank Transfer is selected)
                        // if (_selectedPaymentMethod == 'bank-transfer') ...[
                        //   const SizedBox(height: AppSpacing.spacingM),
                        //   AppTextInput(
                        //     controller: _accountNumberController,
                        //     label: localizations.accountNumber,
                        //     hintText: localizations.enterAccountName,
                        //     keyboardType: TextInputType.name,
                        //   ),
                        // ],

                        // Add spacing to push button to bottom, but allow scrolling if needed
                        Spacer(),
                        // Request button
                        AppButton.filled(
                          isLoading: state is AddContributionLoading,
                          text:
                              state is AddContributionLoading
                                  ? localizations.processing
                                  : _selectedPaymentMethod == 'mobile-money'
                                  ? localizations.requestPayment
                                  : localizations.saveContribution,
                          onPressed: () {
                            _handlePaymentRequest(context);
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        }, // BlocBuilder ends
      ), // BlocListener ends
    );
  }

  void _handlePaymentRequest(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    // Manual validation - validate contributor name (always required)
    if (_nameController.text.trim().isEmpty) {
      _showErrorSnackBar(localizations.pleaseEnterContributorName);
      return;
    }

    // Validation for mobile money - phone number is required
    if (_selectedPaymentMethod == 'mobile-money') {
      // Validate phone number for mobile money
      if (_phoneController.text.trim().isEmpty) {
        _showErrorSnackBar(localizations.pleaseEnterMobileMoneyNumber);
        return;
      }

      // Basic phone number validation (should start with 0 and be at least 10 digits)
      String phoneNumber = _phoneController.text.trim();
      if (!RegExp(r'^0[0-9]{9,}$').hasMatch(phoneNumber)) {
        _showErrorSnackBar(localizations.pleaseEnterValidMobileMoneyNumber);
        return;
      }

      // Check if user has set up withdrawal account using AuthBloc
      final authState = context.read<AuthBloc>().state;
      if (authState is AuthAuthenticated) {
        // Only check account holder if the current user is the creator of the jar
        if (authState.user.id == jarCreatorId) {
          if (authState.user.accountHolder == null ||
              authState.user.accountHolder!.isEmpty) {
            Navigator.pushNamed(context, AppRoutes.withdrawalAccount);
            return;
          }
        }
      }
    }

    if (_selectedPaymentMethod == 'bank-transfer') {
      // Validate account number for bank transfer
      if (_accountNumberController.text.trim().isEmpty) {
        _showErrorSnackBar(localizations.pleaseEnterAccountName);
        return;
      }
    }

    context.read<AddContributionBloc>().add(
      AddContributionSubmitted(
        jarId: jarId ?? '',
        contributor: _nameController.text.trim(),
        contributorPhoneNumber:
            _phoneController.text
                .trim(), // Phone number not required for Cash and Bank Transfer
        paymentMethod: _selectedPaymentMethod,
        accountNumber:
            _selectedPaymentMethod == 'bank-transfer'
                ? _accountNumberController.text.trim()
                : null,
        amountContributed: double.tryParse(amount!) ?? 0.0,
        viaPaymentLink: false,
        mobileMoneyProvider:
            PaymentMethodUtils.getMobileMoneyOperatorMap(localizations).entries
                .firstWhere((entry) => entry.value == _selectedOperator)
                .key,
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    AppSnackBar.showError(context, message: message);
  }
}
