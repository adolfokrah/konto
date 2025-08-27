import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/payment_method_utils.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/select_input.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:konto/features/verification/logic/bloc/verification_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:konto/route.dart';

class WithdrawalAccountView extends StatefulWidget {
  const WithdrawalAccountView({super.key});

  @override
  State<WithdrawalAccountView> createState() => _WithdrawalAccountViewState();
}

class _WithdrawalAccountViewState extends State<WithdrawalAccountView> {
  final TextEditingController _accountHolderController =
      TextEditingController();
  final TextEditingController _accountNumberController =
      TextEditingController();

  String _selectedOperator = '';
  String _initialOperator = '';
  String _initialAccountHolder = '';
  String _initialAccountNumber = '';
  bool _hasInitialized = false;

  @override
  void initState() {
    super.initState();

    // Add listeners to text controllers to trigger UI updates when text changes
    _accountHolderController.addListener(() {
      setState(() {}); // Trigger rebuild to update button state
    });

    _accountNumberController.addListener(() {
      setState(() {}); // Trigger rebuild to update button state
    });
  }

  @override
  void dispose() {
    _accountHolderController.dispose();
    _accountNumberController.dispose();
    super.dispose();
  }

  void _populateUserData(AuthState state) {
    if (state is AuthAuthenticated && !_hasInitialized) {
      final user = state.user;

      // Initialize with user's existing withdrawal account data
      _initialOperator = _getBankOperatorValue(user.bank) ?? '';

      _initialAccountHolder = user.accountHolder ?? '';

      _initialAccountNumber = user.accountNumber ?? '';

      // Update the UI state
      setState(() {
        _selectedOperator = _initialOperator;
        _accountHolderController.text = _initialAccountHolder;
        _accountNumberController.text = _initialAccountNumber;
        _hasInitialized = true;
      });
    }
  }

  // Helper method to convert bank name to operator value
  String? _getBankOperatorValue(String? bank) {
    if (bank == null) return null;

    final bankLower = bank.toLowerCase();
    if (bankLower.contains('mtn')) return 'mtn';
    if (bankLower.contains('vodafone')) return 'vodafone';
    if (bankLower.contains('airteltigo') || bankLower.contains('airtel'))
      return 'airteltigo';

    return null;
  }

  bool _hasChanges() {
    return _selectedOperator != _initialOperator ||
        _accountHolderController.text.trim() != _initialAccountHolder ||
        _accountNumberController.text.trim() != _initialAccountNumber;
  }

  void _handleUpdateAccount() {
    final localizations = AppLocalizations.of(context)!;

    // Validate form
    if (_accountHolderController.text.trim().isEmpty) {
      AppSnackBar.showError(
        context,
        message:
            localizations
                .pleaseEnterFullName, // We can reuse this or add specific validation
      );
      return;
    }

    if (_accountNumberController.text.trim().isEmpty) {
      AppSnackBar.showError(
        context,
        message: localizations.pleaseEnterAccountNumber,
      );
      return;
    }

    if (_selectedOperator.isEmpty) {
      AppSnackBar.showError(context, message: localizations.pleaseSelectBank);
      return;
    }

    Navigator.pushNamed(
      context,
      AppRoutes.otp,
      arguments: {
        'phoneNumber': _accountNumberController.text.trim(),
        'countryCode': "",
      },
    );
  }

  _handleUpdateWithdrawalAccount() {
    // Trigger user account update
    context.read<UserAccountBloc>().add(
      UpdatePersonalDetails(
        accountHolder: _accountHolderController.text.trim(),
        accountNumber: _accountNumberController.text.trim(),
        bank: _selectedOperator,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return MultiBlocListener(
      listeners: [
        BlocListener<UserAccountBloc, UserAccountState>(
          listener: (context, state) {
            if (state is UserAccountSuccess) {
              AppSnackBar.showSuccess(
                context,
                message: localizations.withdrawalAccountUpdatedSuccessfully,
              );
              context.read<AuthBloc>().add(
                UpdateUserData(
                  updatedUser: state.updatedUser,
                  token: state.token,
                ),
              );
              Navigator.pop(context);
            } else if (state is UserAccountError) {
              AppSnackBar.showError(context, message: state.message);
            }
          },
        ),
        BlocListener<VerificationBloc, VerificationState>(
          listener: (context, state) {
            if (state is VerificationSuccess) {
              // Handle successful verification
              _handleUpdateWithdrawalAccount();
            } else if (state is VerificationFailure) {
              // Show error message
              AppSnackBar.showError(context, message: state.errorMessage);
            }
          },
        ),
      ],
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, authState) {
          // Populate user data after the frame is built
          if (authState is AuthAuthenticated) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _populateUserData(authState);
            });
          }

          return BlocBuilder<UserAccountBloc, UserAccountState>(
            builder: (context, userAccountState) {
              final isLoading = userAccountState is UserAccountLoading;

              return Scaffold(
                appBar: AppBar(
                  elevation: 0,
                  title: Text(localizations.withdrawalAccount),
                  centerTitle: true,
                ),
                body: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 15.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 20),

                        // Form section
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(0),
                          child: Column(
                            children: [
                              // Bank selector
                              SelectInput<String>(
                                label: localizations.bank,
                                value: _selectedOperator,
                                options:
                                    PaymentMethodUtils.getMobileMoneyOperatorOptions(
                                      localizations,
                                    ),
                                enabled: !isLoading,
                                onChanged: (value) {
                                  setState(() {
                                    _selectedOperator = value;
                                  });
                                },
                              ),
                              const SizedBox(height: 19),

                              // Account holder name input
                              AppTextInput(
                                label: localizations.accountHolderName,
                                controller: _accountHolderController,
                                enabled: !isLoading,
                              ),
                              const SizedBox(height: 19),

                              // Account number input
                              AppTextInput(
                                label: localizations.accountNumber,
                                controller: _accountNumberController,
                                keyboardType: TextInputType.phone,
                                enabled: !isLoading,
                              ),
                              const SizedBox(height: 19),

                              // Info text
                              Container(
                                width: double.infinity,
                                child: Text(
                                  localizations
                                      .contributionsTransferredAutomatically,
                                  style: AppTextStyles.titleRegularM,
                                ),
                              ),
                              const SizedBox(height: 30),

                              // Update button
                              AppButton.filled(
                                text: localizations.updateAccount,
                                isLoading: isLoading,
                                onPressed:
                                    isLoading || !_hasChanges()
                                        ? null
                                        : _handleUpdateAccount,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
