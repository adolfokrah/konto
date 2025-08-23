import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/select_input.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:konto/route.dart';

class RequestMomoView extends StatefulWidget {
  const RequestMomoView({super.key});

  @override
  State<RequestMomoView> createState() => _RequestMomoViewState();
}

class _RequestMomoViewState extends State<RequestMomoView> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _accountNumberController =
      TextEditingController();
  String _selectedPaymentMethod = 'Mobile Money';
  String _selectedOperator = 'MTN Mobile Money';

  // Arguments from previous screen
  String? amount;
  String? currency;
  String? jarName;
  String? jarId;

  final List<String> _paymentMethods = [
    'Mobile Money',
    'Cash',
    'Bank Transfer',
  ];

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
        jarId = jar.id as String?;
        jarName = jar.name as String?;
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
    return BlocListener<AddContributionBloc, AddContributionState>(
      listener: (context, state) {
        if (state is AddContributionSuccess) {
          context.read<JarSummaryReloadBloc>().add(ReloadJarSummaryRequested());
          Navigator.popUntil(context, ModalRoute.withName(AppRoutes.jarDetail));
          // Show success message
          AppSnackBar.showSuccess(
            context,
            message: 'Payment request sent successfully!',
          );
        } else if (state is AddContributionFailure) {
          // Show error message
          AppSnackBar.showError(
            context,
            message: 'Failed to send payment request.',
          );
        }
      },
      child: BlocBuilder<AddContributionBloc, AddContributionState>(
        builder: (context, state) {
          final isLoading = state is AddContributionLoading;

          return Scaffold(
            backgroundColor: AppColors.backgroundLight,
            appBar: AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              automaticallyImplyLeading:
                  !isLoading, // Disable back button when loading
              title: Text(
                'Request Payment',
                style: TextStyles.titleMediumLg.copyWith(
                  color: AppColors.black,
                  fontWeight: FontWeight.w600,
                ),
              ),
              centerTitle: true,
            ),
            body: SafeArea(
              child: Padding(
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
                            'Amount',
                            style: TextStyles.titleMedium.copyWith(
                              color: AppColors.black,
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
                                color: AppColors.black,
                                fontSize: 48,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.spacingL),
                          ],

                          // Payment method selection
                          SelectInput<String>(
                            label: 'Payment Method',
                            value: _selectedPaymentMethod,
                            options:
                                _paymentMethods
                                    .map(
                                      (method) => SelectOption(
                                        value: method,
                                        label: method,
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
                          if (_selectedPaymentMethod == 'Mobile Money') ...[
                            SelectInput<String>(
                              label: 'Operator',
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
                          if (_selectedPaymentMethod == 'Mobile Money') ...[
                            AppTextInput(
                              controller: _phoneController,
                              label: 'Mobile Money Number',
                              hintText: 'Enter mobile money number',
                              keyboardType: TextInputType.phone,
                            ),
                            const SizedBox(height: AppSpacing.spacingM),
                          ],

                          AppTextInput(
                            controller: _nameController,
                            label: 'Contributor Name',
                            hintText: 'Enter contributor name',
                            keyboardType: TextInputType.name,
                          ),

                          // Account Name input (only show if Bank Transfer is selected)
                          if (_selectedPaymentMethod == 'Bank Transfer') ...[
                            const SizedBox(height: AppSpacing.spacingM),
                            AppTextInput(
                              controller: _accountNumberController,
                              label: 'Account Name',
                              hintText: 'Enter account name',
                              keyboardType: TextInputType.name,
                            ),
                          ],

                          // Add spacing to push button to bottom, but allow scrolling if needed
                          Spacer(),

                          // Request button
                          AppButton.filled(
                            isLoading: state is AddContributionLoading,
                            text:
                                state is AddContributionLoading
                                    ? 'Processing...'
                                    : _selectedPaymentMethod == 'Mobile Money'
                                    ? 'Request Payment'
                                    : 'Save Contribution',
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
            ),
          );
        }, // BlocBuilder ends
      ), // BlocListener ends
    );
  }

  void _handlePaymentRequest(BuildContext context) {
    // Manual validation - validate contributor name (always required)
    if (_nameController.text.trim().isEmpty) {
      _showErrorSnackBar('Please enter contributor name');
      return;
    }

    // Validation for mobile money - phone number is required
    if (_selectedPaymentMethod == 'Mobile Money') {
      // Validate phone number for mobile money
      if (_phoneController.text.trim().isEmpty) {
        _showErrorSnackBar(
          'Please enter your mobile money number for Mobile Money payments',
        );
        return;
      }

      // Basic phone number validation (should start with 0 and be at least 10 digits)
      String phoneNumber = _phoneController.text.trim();
      if (!RegExp(r'^0[0-9]{9,}$').hasMatch(phoneNumber)) {
        _showErrorSnackBar(
          'Please enter a valid mobile money number (e.g., 0241234567)',
        );
        return;
      }
    }

    if (_selectedPaymentMethod == 'Bank Transfer') {
      // Validate account name for bank transfer
      if (_accountNumberController.text.trim().isEmpty) {
        _showErrorSnackBar('Please enter account name');
        return;
      }
    }

    // Convert UI payment method to API format
    String apiPaymentMethod;
    switch (_selectedPaymentMethod) {
      case 'Mobile Money':
        apiPaymentMethod = 'mobile-money';
        break;
      case 'Bank Transfer':
        apiPaymentMethod = 'bank-transfer';
        break;
      case 'Cash':
        apiPaymentMethod = 'cash';
        break;
      default:
        apiPaymentMethod = 'mobile-money';
    }

    context.read<AddContributionBloc>().add(
      AddContributionSubmitted(
        jarId: jarId ?? '',
        contributor: _nameController.text.trim(),
        contributorPhoneNumber:
            _selectedPaymentMethod == 'Mobile Money'
                ? _phoneController.text
                    .trim() // Only include phone number for Mobile Money
                : null, // Phone number not required for Cash and Bank Transfer
        paymentMethod: apiPaymentMethod,
        accountNumber:
            _selectedPaymentMethod == 'Bank Transfer'
                ? _accountNumberController.text.trim()
                : null,
        amountContributed: double.tryParse(amount!) ?? 0.0,
        viaPaymentLink: false,
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    AppSnackBar.showError(context, message: message);
  }
}
