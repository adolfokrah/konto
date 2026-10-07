import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/core/utils/phone_validation_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/payout_account_widgets.dart';
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

  /// True when the name came back from the lookup (not typed by hand).
  bool _nameVerified = false;

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
      _nameVerified = false;
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
        AppSnackBar.showError(
          context,
          message: 'Please enter an account number',
        );
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
      AppSnackBar.showError(
        context,
        message: 'Account holder name is required',
      );
      return;
    }

    context.read<WithdrawalAccountsBloc>().add(
      CreateWithdrawalAccount(
        type: _type == _AccountType.mobileMoney ? 'mobile-money' : 'bank',
        provider:
            _type == _AccountType.mobileMoney ? _operator : (_bankCode ?? ''),
        accountNumber: _numberController.text.trim(),
        accountHolder: holder,
        label:
            _labelController.text.trim().isEmpty
                ? null
                : _labelController.text.trim(),
        isDefault: _setAsDefault,
      ),
    );
  }

  static const _networkPrefixes = {
    'mtn': '024, 025, 053, 054, 055, 059',
    'telecel': '020, 050',
    'airteltigo': '026, 027, 056, 057',
  };

  Future<void> _pickNetwork(AppLocalizations localizations) async {
    final options = PaymentMethodUtils.getMobileMoneyOperatorOptions(
      localizations,
    );
    final picked = await showAccOptionSheet<String>(
      context,
      title: 'Mobile money network',
      selected: _operator.isEmpty ? null : _operator,
      footnote:
          "Pick the network the number is registered on. Change it if you've ported your number.",
      options: [
        for (final o in options)
          AccOption(
            value: o.value,
            label: o.label,
            subtitle: _networkPrefixes[o.value],
            leading: PayoutAccountLogo(provider: o.value),
          ),
      ],
    );
    if (picked != null && picked != _operator && mounted) {
      setState(() => _operator = picked);
      _resetVerification();
    }
  }

  void _pickBank(WithdrawalAccountsState state) {
    GenericPicker.showPickerDialog<BankModel>(
      context,
      selectedValue: _bankCode ?? '',
      items: state.banks,
      onItemSelected: (bank) {
        if (bank.code == _bankCode) return;
        setState(() => _bankCode = bank.code);
        _resetVerification();
      },
      searchFilter: (b) => b.name,
      isItemSelected: (b, sel) => b.code == sel,
      itemBuilder: _bankRow,
      recentItemBuilder: _bankRow,
      searchResultBuilder: _bankRow,
      title: 'Bank',
      searchHint: 'Search banks',
      recentSectionTitle: 'Selected',
      otherSectionTitle: 'All banks',
      searchResultsTitle: 'Results',
      noResultsMessage: 'No banks found',
    );
  }

  Widget _bankRow(BankModel bank, bool isSelected, VoidCallback onTap) {
    return DsRow(
      leading: const PayoutAccountLogo(isBank: true, size: 32),
      title: bank.name,
      trailing: AccRadio(isSelected),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return BlocConsumer<WithdrawalAccountsBloc, WithdrawalAccountsState>(
      listenWhen:
          (prev, curr) =>
              prev.verifiedName != curr.verifiedName ||
              prev.verifyError != curr.verifyError ||
              prev.createdAccount != curr.createdAccount ||
              prev.errorMessage != curr.errorMessage,
      listener: (context, state) {
        if (state.verifiedName != null && state.verifiedName!.isNotEmpty) {
          setState(() {
            _holderController.text = state.verifiedName!;
            _nameResolved = true;
            _nameVerified = true;
          });
        } else if (state.verifyError != null) {
          // For bank, allow manual entry; for momo, just show the error.
          if (_type == _AccountType.bank) {
            setState(() {
              _nameResolved = true;
              _nameVerified = false;
            });
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
          AppSnackBar.showSuccess(context, message: 'Withdrawal account added');
          context.read<WithdrawalAccountsBloc>().add(LoadWithdrawalAccounts());
          Navigator.of(context).pop(state.createdAccount);
        }
      },
      builder: (context, state) {
        final busy = state.verifying || state.actionInProgress;
        final isMomo = _type == _AccountType.mobileMoney;

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.close_rounded),
              onPressed: () => Navigator.of(context).maybePop(),
            ),
            title: const Text('Add account'),
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              AccSegmented<_AccountType>(
                options: const [
                  (_AccountType.mobileMoney, 'Mobile money'),
                  (_AccountType.bank, 'Bank'),
                ],
                selected: _type,
                onChanged:
                    busy
                        ? null
                        : (type) {
                          setState(() {
                            _type = type;
                            _numberController.clear();
                            _operator = '';
                            _bankCode = null;
                          });
                          _resetVerification();
                        },
              ),
              const SizedBox(height: 12),
              AccFieldGroup(
                children:
                    isMomo
                        ? _buildMomoFields(localizations, busy)
                        : _buildBankFields(state, busy),
              ),
              const SizedBox(height: 12),

              // Resolved / manual account holder name.
              if (_nameResolved) ...[
                if (_nameVerified)
                  _VerifiedNameCard(
                    label: isMomo ? 'Registered to' : 'Account name',
                    name: _holderController.text,
                  )
                else ...[
                  const DsNote(
                    tone: DsTone.pending,
                    icon: Icons.warning_amber_rounded,
                    title: "We couldn't confirm the name",
                    text:
                        'Check the number, or type the name exactly as registered on the account.',
                  ),
                  const SizedBox(height: 12),
                  AccField(
                    label: 'Account holder name',
                    controller: _holderController,
                    enabled: !busy,
                    textCapitalization: TextCapitalization.words,
                  ),
                ],
                const SizedBox(height: 12),
                AccField(
                  label: 'Nickname (optional)',
                  hint: 'Personal, Church…',
                  controller: _labelController,
                  enabled: !busy,
                ),
                const SizedBox(height: 12),
                DsListCard(
                  children: [
                    DsRow(
                      title: 'Make default',
                      trailing: AccSwitch(
                        value: _setAsDefault,
                        onChanged:
                            busy
                                ? null
                                : (v) => setState(() => _setAsDefault = v),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                8,
                16,
                12 + MediaQuery.of(context).viewInsets.bottom,
              ),
              child:
                  _nameResolved
                      ? AppButton.filled(
                        text: 'Save account',
                        isLoading: state.actionInProgress,
                        onPressed: busy ? null : _handleSave,
                      )
                      : AppButton.filled(
                        text: 'Verify',
                        isLoading: state.verifying,
                        onPressed: busy ? null : _handleVerify,
                      ),
            ),
          ),
        );
      },
    );
  }

  List<Widget> _buildMomoFields(AppLocalizations localizations, bool busy) {
    final operatorLabel =
        PaymentMethodUtils.getMobileMoneyOperatorMap(localizations)[_operator];
    return [
      AccSelectField(
        label: 'Network',
        value: operatorLabel,
        placeholder: 'Select network',
        grouped: true,
        leading: PayoutAccountLogo(provider: _operator, size: 22),
        onTap: busy ? null : () => _pickNetwork(localizations),
      ),
      AccField(
        label: 'Number',
        hint: '024 123 4567',
        controller: _numberController,
        keyboardType: TextInputType.phone,
        grouped: true,
        enabled: !busy && !_nameResolved,
        onChanged: (_) {
          if (_nameResolved) _resetVerification();
        },
      ),
    ];
  }

  List<Widget> _buildBankFields(WithdrawalAccountsState state, bool busy) {
    String? bankName;
    for (final b in state.banks) {
      if (b.code == _bankCode) bankName = b.name;
    }
    return [
      AccSelectField(
        label: 'Bank',
        value: bankName,
        placeholder: state.banksLoading ? 'Loading banks...' : 'Select bank',
        grouped: true,
        leading: const PayoutAccountLogo(isBank: true, size: 22),
        onTap: busy || state.banksLoading ? null : () => _pickBank(state),
      ),
      AccField(
        label: 'Account number',
        controller: _numberController,
        keyboardType: TextInputType.number,
        grouped: true,
        enabled: !busy && !_nameResolved,
        onChanged: (_) {
          if (_nameResolved) _resetVerification();
        },
      ),
    ];
  }
}

/// Green "Registered to · NAME" card shown once the name lookup succeeds.
class _VerifiedNameCard extends StatelessWidget {
  final String label;
  final String name;

  const _VerifiedNameCard({required this.label, required this.name});

  @override
  Widget build(BuildContext context) {
    return DsCard(
      color: AppColors.positiveSoft,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          const AccRowIcon(
            Icons.check_rounded,
            background: AppColors.surfaceWhite,
            foreground: AppColors.positive,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: DsText.caption),
                Text(
                  name.toUpperCase(),
                  style: AccText.h3.copyWith(fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
