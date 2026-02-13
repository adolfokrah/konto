import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/withdrawal_account_verification_bloc.dart';
import 'package:Hoga/features/user_account/presentation/widgets/review_withdrawal_account.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:Hoga/features/verification/presentation/pages/kyc_view.dart';

class WithdrawalAccountView extends StatefulWidget {
  const WithdrawalAccountView({super.key});

  @override
  State<WithdrawalAccountView> createState() => _WithdrawalAccountViewState();
}

class _WithdrawalAccountViewState extends State<WithdrawalAccountView> {
  final TextEditingController _accountNumberController =
      TextEditingController();

  String _selectedOperator = '';
  String _initialOperator = '';
  String _initialAccountNumber = '';
  bool _hasInitialized = false;

  @override
  void initState() {
    super.initState();

    _accountNumberController.addListener(() {
      setState(() {}); // Trigger rebuild to update button state
    });
  }

  @override
  void dispose() {
    _accountNumberController.dispose();
    super.dispose();
  }

  void _populateUserData(AuthState state) {
    if (state is AuthAuthenticated && !_hasInitialized) {
      final user = state.user;

      // Initialize with user's existing withdrawal account data
      _initialOperator = _getBankOperatorValue(user.bank) ?? '';

      _initialAccountNumber = user.accountNumber ?? '';

      // Update the UI state
      setState(() {
        _selectedOperator = _initialOperator;
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
    if (bankLower.contains('telecel')) return 'telecel';
    if (bankLower.contains('airteltigo') || bankLower.contains('airtel')) {
      return 'airteltigo';
    }
    return null;
  }

  bool _hasChanges() {
    return _selectedOperator != _initialOperator ||
        _accountNumberController.text.trim() != _initialAccountNumber;
  }

  void _handleUpdateAccount() {
    final localizations = AppLocalizations.of(context)!;

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

    context.read<WithdrawalAccountVerificationBloc>().add(
      RequestValidateWithdrawalAccountEvent(
        phoneNumber: _accountNumberController.text.trim(),
        bank: _selectedOperator,
      ),
    );
  }

  _handleUpdateWithdrawalAccount(String accountHolder, String accountNumber) {
    // Trigger user account update
    context.read<UserAccountBloc>().add(
      UpdatePersonalDetails(
        accountHolder: accountHolder,
        accountNumber: accountNumber,
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
        BlocListener<
          WithdrawalAccountVerificationBloc,
          WithdrawalAccountVerificationState
        >(
          listener: (context, state) {
            if (state is WithdrawalAccountVerificationSuccess) {
              // Show the review bottom sheet
              ReviewWithdrawalAccountBottomSheet.show(
                context: context,
                verificationData: state,
                onConfirm: () {
                  _handleUpdateWithdrawalAccount(state.name, state.phoneNumber);
                },
                onCancel: () {
                  // Handle cancellation if needed
                },
              );
            } else if (state is WithdrawalAccountVerificationFailure) {
              // Show error message
              AppSnackBar.showError(context, message: state.message);
            }
          },
        ),
      ],
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, authState) {
          // Check if user is authenticated and KYC is not verified
          if (authState is AuthAuthenticated && authState.user.kycStatus != 'verified') {
            return const KycView();
          }

          // Populate user data after the frame is built
          if (authState is AuthAuthenticated) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _populateUserData(authState);
            });
          }

          return BlocBuilder<
            WithdrawalAccountVerificationBloc,
            WithdrawalAccountVerificationState
          >(
            builder: (context, state) {
              return BlocBuilder<UserAccountBloc, UserAccountState>(
                builder: (context, userAccountState) {
                  final isLoading =
                      userAccountState is UserAccountLoading ||
                      state is WithdrawalAccountVerificationLoading;

                  return Scaffold(
                    appBar: AppBar(
                      elevation: 0,
                      title: Text(localizations.withdrawalAccount),
                      centerTitle: true,
                    ),
                    body: Padding(
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

                                // Account number input
                                AppTextInput(
                                  label: localizations.accountNumber,
                                  controller: _accountNumberController,
                                  keyboardType: TextInputType.phone,
                                  enabled: !isLoading,
                                ),
                                const SizedBox(height: 19),

                                // Info text
                                SizedBox(
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
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
