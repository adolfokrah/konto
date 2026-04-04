import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/features/user_account/data/models/bank_model.dart';
import 'package:Hoga/features/user_account/data/models/payment_method_model.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/withdrawal_account_verification_bloc.dart';
import 'package:Hoga/features/user_account/presentation/widgets/review_withdrawal_account.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class WithdrawalAccountView extends StatefulWidget {
  const WithdrawalAccountView({super.key});

  @override
  State<WithdrawalAccountView> createState() => _WithdrawalAccountViewState();
}

class _WithdrawalAccountViewState extends State<WithdrawalAccountView> {
  final TextEditingController _accountNumberController =
      TextEditingController();

  String _selectedOperator = ''; // Paystack bank code, e.g. "MTN"
  String _selectedBankName = ''; // Human-readable name, e.g. "MTN Mobile Money"
  String _initialOperator = '';
  String _initialAccountNumber = '';
  String _selectedPaymentMethodId = '';
  String _initialPaymentMethodId = '';
  List<PaymentMethodModel> _paymentMethods = [];
  bool _isLoadingPaymentMethods = false;
  bool _hasInitialized = false;
  List<BankModel> _banks = [];
  bool _isLoadingBanks = false;
  // Tracks the paystackType of the last-dispatched FetchBanks event.
  // Used to discard stale responses when the user switches payment method quickly.
  String _expectedBankType = '';

  // Slug of the currently selected payment method (e.g. 'mobile-money', 'bank')
  String get _selectedPaymentMethodSlug {
    final matches = _paymentMethods.where(
      (pm) => pm.id == _selectedPaymentMethodId,
    );
    return matches.isNotEmpty ? matches.first.slug : 'mobile-money';
  }

  @override
  void initState() {
    super.initState();
    _accountNumberController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _accountNumberController.dispose();
    super.dispose();
  }

  void _populateUserData(AuthState state) {
    if (state is AuthAuthenticated && !_hasInitialized) {
      _hasInitialized = true;
      final user = state.user;

      // Prefer stored bankCode for pre-selection; fall back to legacy name lookup
      final initialOperator =
          user.bankCode ?? _getBankOperatorValue(user.bank) ?? '';

      setState(() {
        _initialOperator = initialOperator;
        _selectedOperator = initialOperator;
        _selectedBankName = user.bank ?? '';
        _initialAccountNumber = user.accountNumber ?? '';
        _accountNumberController.text = user.accountNumber ?? '';
        _isLoadingPaymentMethods = true;
      });

      context.read<UserAccountBloc>().add(
        FetchPaymentMethods(country: user.country),
      );
    }
  }

  void _dispatchFetchBanks(String paymentMethodType) {
    final paystackType =
        paymentMethodType == 'mobile-money' ? 'mobile_money' : 'ghipss';
    _expectedBankType = paystackType;
    setState(() {
      _isLoadingBanks = true;
      _banks = [];
    });
    context.read<UserAccountBloc>().add(
      FetchBanks(country: 'ghana', paystackType: paystackType),
    );
  }

  // Legacy helper — maps an old stored bank name/code to a Paystack code
  String? _getBankOperatorValue(String? bank) {
    if (bank == null) return null;
    final b = bank.toLowerCase();
    if (b == 'mtn' || b.contains('mtn')) return 'MTN';
    if (b.contains('telecel') || b.contains('vodafone')) return 'VOD';
    if (b.contains('airtel') || b.contains('tigo')) return 'ATL';
    return bank.toUpperCase();
  }

  bool _hasChanges() {
    return _selectedOperator != _initialOperator ||
        _accountNumberController.text.trim() != _initialAccountNumber ||
        _selectedPaymentMethodId != _initialPaymentMethodId;
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
        accountNumber: _accountNumberController.text.trim(),
        bank: _selectedOperator,
        paymentMethod: _selectedPaymentMethodSlug,
      ),
    );
  }

  void _handleUpdateWithdrawalAccount(
    String accountHolder,
    String accountNumber,
  ) {
    context.read<UserAccountBloc>().add(
      UpdatePersonalDetails(
        accountHolder: accountHolder,
        accountNumber: accountNumber,
        bank: _selectedBankName, // human-readable name for display
        bankCode: _selectedOperator, // Paystack code for transfers
        withdrawalPaymentMethod: _selectedPaymentMethodId,
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
              context.pop();
            } else if (state is UserAccountError) {
              AppSnackBar.showError(context, message: state.message);
              setState(() {
                _isLoadingPaymentMethods = false;
                _isLoadingBanks = false;
              });
            } else if (state is PaymentMethodsLoaded) {
              // Filter out card and cash — only show withdrawal-eligible methods
              final methods =
                  state.paymentMethods
                      .where((pm) => pm.type != 'card' && pm.type != 'cash')
                      .toList();
              final authState = context.read<AuthBloc>().state;
              final storedType =
                  authState is AuthAuthenticated
                      ? authState.user.withdrawalPaymentMethod
                      : null;
              final matched = methods.where(
                (pm) => pm.type == storedType || pm.id == storedType,
              );
              final selectedPm =
                  matched.isNotEmpty
                      ? matched.first
                      : (methods.isNotEmpty ? methods.first : null);

              setState(() {
                _paymentMethods = methods;
                _isLoadingPaymentMethods = false;
                _initialPaymentMethodId = selectedPm?.id ?? '';
                _selectedPaymentMethodId = selectedPm?.id ?? '';
              });

              if (selectedPm != null) _dispatchFetchBanks(selectedPm.slug);
            } else if (state is BanksLoaded) {
              if (state.paystackType == _expectedBankType) {
                setState(() {
                  _banks = state.banks;
                  _isLoadingBanks = false;
                });
              }
              // else: stale response from a previous payment method switch — ignore
            }
          },
        ),
        BlocListener<
          WithdrawalAccountVerificationBloc,
          WithdrawalAccountVerificationState
        >(
          listener: (context, state) {
            if (state is WithdrawalAccountVerificationSuccess) {
              ReviewWithdrawalAccountBottomSheet.show(
                context: context,
                verificationData: state,
                onConfirm: () {
                  _handleUpdateWithdrawalAccount(
                    state.name,
                    state.accountNumber,
                  );
                },
                onCancel: () {},
              );
            } else if (state is WithdrawalAccountVerificationFailure) {
              AppSnackBar.showError(context, message: state.message);
            }
          },
        ),
      ],
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, authState) {
          if (authState is AuthAuthenticated) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _populateUserData(authState);
            });
          }

          return BlocBuilder<
            WithdrawalAccountVerificationBloc,
            WithdrawalAccountVerificationState
          >(
            builder: (context, verificationState) {
              return BlocBuilder<UserAccountBloc, UserAccountState>(
                builder: (context, userAccountState) {
                  final isLoading =
                      userAccountState is UserAccountLoading ||
                      verificationState is WithdrawalAccountVerificationLoading;

                  return Scaffold(
                    appBar: AppBar(
                      elevation: 0,
                      title: Text(localizations.withdrawalAccount),
                      centerTitle: true,
                    ),
                    body: GestureDetector(
                      onTap: () => FocusScope.of(context).unfocus(),
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 15.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 20),

                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(0),
                              child: Column(
                                children: [
                                  // Payment method selector
                                  SelectInput<String>(
                                    label: localizations.paymentMethod,
                                    value: _selectedPaymentMethodId,
                                    options:
                                        _paymentMethods
                                            .map(
                                              (pm) => SelectOption(
                                                value: pm.id,
                                                label:
                                                    PaymentMethodUtils.getPaymentMethodLabel(
                                                      pm.type,
                                                      localizations,
                                                    ),
                                              ),
                                            )
                                            .toList(),
                                    enabled:
                                        !isLoading && !_isLoadingPaymentMethods,
                                    onChanged: (id) {
                                      final pm =
                                          _paymentMethods
                                              .where((pm) => pm.id == id)
                                              .firstOrNull;
                                      setState(() {
                                        _selectedPaymentMethodId = id;
                                        _selectedOperator = '';
                                        _selectedBankName = '';
                                      });

                                      if (pm != null) {
                                        _dispatchFetchBanks(pm.slug);
                                      }
                                    },
                                  ),
                                  const SizedBox(height: 19),

                                  // Bank / operator selector
                                  SelectInput<String>(
                                    label: localizations.bank,
                                    value: _selectedOperator,
                                    options:
                                        _banks
                                            .map(
                                              (b) => SelectOption(
                                                value: b.code,
                                                label: b.name,
                                              ),
                                            )
                                            .toList(),
                                    enabled: !isLoading && !_isLoadingBanks,
                                    onChanged: (code) {
                                      final bank =
                                          _banks
                                              .where((b) => b.code == code)
                                              .firstOrNull;
                                      setState(() {
                                        _selectedOperator = code;
                                        _selectedBankName = bank?.name ?? code;
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
