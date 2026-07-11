import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/core/utils/phone_validation_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

enum _AccountType { mobileMoney, bank }

/// Add-account flow: mobile money or bank, with name verification.
class AddWithdrawalAccountView extends StatefulWidget {
  const AddWithdrawalAccountView({super.key});

  @override
  State<AddWithdrawalAccountView> createState() =>
      _AddWithdrawalAccountViewState();
}

class _AddWithdrawalAccountViewState extends State<AddWithdrawalAccountView> {
  _AccountType _type = _AccountType.mobileMoney;

  String _operator = ''; // mtn | telecel
  String? _bankCode; // Eganow bank code
  final TextEditingController _numberController = TextEditingController();
  final TextEditingController _labelController = TextEditingController();
  final TextEditingController _holderController = TextEditingController();
  bool _setAsDefault = false;

  /// True once verification succeeded (or the user chose manual entry for banks).
  bool _nameResolved = false;

  @override
  void initState() {
    super.initState();
    // Preload banks so the picker is ready if the user switches to Bank.
    context.read<WithdrawalAccountsBloc>().add(LoadBanks());
  }

  @override
  void dispose() {
    _numberController.dispose();
    _labelController.dispose();
    _holderController.dispose();
    super.dispose();
  }

  void _resetVerification() {
    setState(() {
      _nameResolved = false;
      _holderController.clear();
    });
  }

  void _handleVerify() {
    FocusManager.instance.primaryFocus?.unfocus();
    final number = _numberController.text.trim();

    if (_type == _AccountType.mobileMoney) {
      if (_operator.isEmpty) {
        AppSnackBar.showError(context, message: 'Please select an operator');
        return;
      }
      if (!PhoneValidationUtils.isValidGhanaPhoneNumber(number)) {
        AppSnackBar.showError(
          context,
          message: PhoneValidationUtils.getDetailedValidationError(number),
        );
        return;
      }
      context.read<WithdrawalAccountsBloc>().add(
            VerifyWithdrawalAccount(
              type: 'mobile-money',
              bank: _operator,
              accountNumber: number,
            ),
          );
    } else {
      if (_bankCode == null || _bankCode!.isEmpty) {
        AppSnackBar.showError(context, message: 'Please select a bank');
        return;
      }
      if (number.isEmpty) {
        AppSnackBar.showError(context, message: 'Please enter an account number');
        return;
      }
      context.read<WithdrawalAccountsBloc>().add(
            VerifyWithdrawalAccount(
              type: 'bank',
              bank: _bankCode!,
              accountNumber: number,
            ),
          );
    }
  }

  void _handleSave() {
    final holder = _holderController.text.trim();
    if (holder.isEmpty) {
      AppSnackBar.showError(context, message: 'Account holder name is required');
      return;
    }

    context.read<WithdrawalAccountsBloc>().add(
          CreateWithdrawalAccount(
            type: _type == _AccountType.mobileMoney ? 'mobile-money' : 'bank',
            provider:
                _type == _AccountType.mobileMoney ? _operator : (_bankCode ?? ''),
            accountNumber: _numberController.text.trim(),
            accountHolder: holder,
            label: _labelController.text.trim().isEmpty
                ? null
                : _labelController.text.trim(),
            isDefault: _setAsDefault,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocConsumer<WithdrawalAccountsBloc, WithdrawalAccountsState>(
      listenWhen: (prev, curr) =>
          prev.verifiedName != curr.verifiedName ||
          prev.verifyError != curr.verifyError ||
          prev.createdAccount != curr.createdAccount ||
          prev.errorMessage != curr.errorMessage,
      listener: (context, state) {
        if (state.verifiedName != null && state.verifiedName!.isNotEmpty) {
          setState(() {
            _holderController.text = state.verifiedName!;
            _nameResolved = true;
          });
        } else if (state.verifyError != null) {
          // For bank, allow manual entry; for momo, just show the error.
          if (_type == _AccountType.bank) {
            setState(() => _nameResolved = true);
            AppSnackBar.showWarning(
              context,
              message:
                  'Could not verify name automatically. Please enter it manually.',
            );
          } else {
            AppSnackBar.showError(context, message: state.verifyError!);
          }
        }

        if (state.createdAccount != null) {
          AppSnackBar.showSuccess(
            context,
            message: 'Withdrawal account added',
          );
          context
              .read<WithdrawalAccountsBloc>()
              .add(LoadWithdrawalAccounts());
          Navigator.of(context).pop(state.createdAccount);
        }
      },
      builder: (context, state) {
        final busy = state.verifying || state.actionInProgress;

        return Scaffold(
          appBar: AppBar(
            elevation: 0,
            centerTitle: true,
            title: const Text('Add account'),
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.spacingM),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTypeToggle(busy),
                  const SizedBox(height: AppSpacing.spacingL),

                  if (_type == _AccountType.mobileMoney)
                    ..._buildMomoFields(localizations, busy)
                  else
                    ..._buildBankFields(state, busy),

                  const SizedBox(height: AppSpacing.spacingM),

                  // Resolved / manual account holder name.
                  if (_nameResolved) ...[
                    AppTextInput(
                      label: 'Account holder',
                      controller: _holderController,
                      enabled: !busy,
                    ),
                    const SizedBox(height: AppSpacing.spacingM),
                    AppTextInput(
                      label: 'Label (optional)',
                      controller: _labelController,
                      enabled: !busy,
                    ),
                    const SizedBox(height: AppSpacing.spacingS),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Set as default', style: TextStyles.titleMedium),
                      value: _setAsDefault,
                      onChanged:
                          busy ? null : (v) => setState(() => _setAsDefault = v),
                    ),
                    const SizedBox(height: AppSpacing.spacingM),
                    AppButton.filled(
                      text: 'Save account',
                      isLoading: state.actionInProgress,
                      onPressed: busy ? null : _handleSave,
                    ),
                  ] else
                    AppButton.filled(
                      text: 'Verify',
                      isLoading: state.verifying,
                      onPressed: busy ? null : _handleVerify,
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTypeToggle(bool busy) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary,
        borderRadius: BorderRadius.circular(AppRadius.radiusM),
      ),
      child: Row(
        children: [
          _toggleOption('Mobile Money', _AccountType.mobileMoney, busy),
          _toggleOption('Bank', _AccountType.bank, busy),
        ],
      ),
    );
  }

  Widget _toggleOption(String label, _AccountType type, bool busy) {
    final selected = _type == type;
    return Expanded(
      child: GestureDetector(
        onTap: busy || selected
            ? null
            : () {
                setState(() {
                  _type = type;
                  _numberController.clear();
                  _operator = '';
                  _bankCode = null;
                });
                _resetVerification();
              },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? Theme.of(context).colorScheme.surface
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.radiusM),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyles.titleMediumS.copyWith(
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildMomoFields(AppLocalizations localizations, bool busy) {
    return [
      SelectInput<String>(
        label: 'Operator',
        hintText: 'Select operator',
        value: _operator.isEmpty ? null : _operator,
        options:
            PaymentMethodUtils.getMobileMoneyOperatorOptions(localizations),
        enabled: !busy,
        onChanged: (value) {
          setState(() => _operator = value);
          _resetVerification();
        },
      ),
      const SizedBox(height: AppSpacing.spacingM),
      AppTextInput(
        label: 'Phone number',
        controller: _numberController,
        keyboardType: TextInputType.phone,
        enabled: !busy && !_nameResolved,
        onChanged: (_) {
          if (_nameResolved) _resetVerification();
        },
      ),
    ];
  }

  List<Widget> _buildBankFields(WithdrawalAccountsState state, bool busy) {
    final bankOptions = state.banks
        .map((b) => SelectOption<String>(value: b.code, label: b.name))
        .toList();

    return [
      SelectInput<String>(
        label: 'Bank',
        hintText: state.banksLoading ? 'Loading banks...' : 'Select bank',
        value: _bankCode,
        options: bankOptions,
        enabled: !busy && !state.banksLoading,
        onChanged: (value) {
          setState(() => _bankCode = value);
          _resetVerification();
        },
      ),
      const SizedBox(height: AppSpacing.spacingM),
      AppTextInput(
        label: 'Account number',
        controller: _numberController,
        keyboardType: TextInputType.number,
        enabled: !busy && !_nameResolved,
        onChanged: (_) {
          if (_nameResolved) _resetVerification();
        },
      ),
    ];
  }
}
