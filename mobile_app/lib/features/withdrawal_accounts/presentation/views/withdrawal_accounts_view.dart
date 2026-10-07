import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:Hoga/features/user_account/presentation/widgets/confirmation_bottom_sheet.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/views/add_withdrawal_account_view.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/payout_account_widgets.dart';

/// Manager screen listing the user's saved withdrawal (payout) accounts.
class WithdrawalAccountsView extends StatefulWidget {
  const WithdrawalAccountsView({super.key});

  @override
  State<WithdrawalAccountsView> createState() => _WithdrawalAccountsViewState();
}

class _WithdrawalAccountsViewState extends State<WithdrawalAccountsView> {
  @override
  void initState() {
    super.initState();
    context.read<WithdrawalAccountsBloc>().add(LoadWithdrawalAccounts());
  }

  Future<void> _openAddAccount() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder:
            (_) => BlocProvider.value(
              value: context.read<WithdrawalAccountsBloc>(),
              child: const AddWithdrawalAccountView(),
            ),
      ),
    );
    if (mounted) {
      context.read<WithdrawalAccountsBloc>().add(LoadWithdrawalAccounts());
    }
  }

  void _confirmDelete(WithdrawalAccountModel account, List<BankModel> banks) {
    ConfirmationBottomSheet.show(
      context,
      icon: Icons.delete_outline_rounded,
      isDangerous: true,
      title: 'Remove ${payoutAccountTitle(account)}?',
      description:
          '${payoutProviderName(account, banks)} ${payoutMaskedNumber(account)} '
          'will be removed. Jars paying out here switch to your default account.',
      confirmButtonText: 'Remove account',
      cancelButtonText: 'Keep it',
      onConfirm: () {
        context.read<WithdrawalAccountsBloc>().add(
          DeleteWithdrawalAccount(id: account.id),
        );
      },
    );
  }

  void _showOptions(WithdrawalAccountModel account, List<BankModel> banks) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (sheetContext) => AccSheet(
            children: [
              Row(
                children: [
                  PayoutAccountLogo(account: account),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          payoutAccountTitle(account),
                          style: AccText.h2,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          payoutAccountSubtitle(account, banks),
                          style: DsText.caption,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(AppRadius.radiusCard),
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    if (!account.isDefault) ...[
                      DsRow(
                        leading: const AccRowIcon(
                          Icons.check_rounded,
                          background: AppColors.surfaceWhite,
                        ),
                        title: 'Make default',
                        onTap: () {
                          Navigator.pop(sheetContext);
                          context.read<WithdrawalAccountsBloc>().add(
                            SetDefaultWithdrawalAccount(id: account.id),
                          );
                        },
                      ),
                      const Divider(height: 1, color: AppColors.line),
                    ],
                    DsRow(
                      leading: const AccRowIcon(
                        Icons.delete_outline_rounded,
                        background: AppColors.negativeSoft,
                        foreground: AppColors.negative,
                      ),
                      title: 'Remove account',
                      titleColor: AppColors.negative,
                      onTap: () {
                        Navigator.pop(sheetContext);
                        _confirmDelete(account, banks);
                      },
                    ),
                  ],
                ),
              ),
              const Text(
                'Jars paying out to this account switch to your default.',
                style: DsText.caption,
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<WithdrawalAccountsBloc, WithdrawalAccountsState>(
      listener: (context, state) {
        if (state.errorMessage != null) {
          AppSnackBar.showError(context, message: state.errorMessage!);
        }
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: AppColors.cream,
          appBar: JarTopBar(
            title: 'Payout accounts',
            actions: [
              if (state.accounts.isNotEmpty)
                JarNavButton(
                  icon: Icons.add_rounded,
                  onTap: state.actionInProgress ? null : _openAddAccount,
                ),
            ],
          ),
          body: _buildBody(context, state),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, WithdrawalAccountsState state) {
    if (state.status == WithdrawalAccountsStatus.loading &&
        state.accounts.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.navy),
      );
    }

    if (state.accounts.isEmpty) {
      return Align(
        alignment: const Alignment(0, -0.45),
        child: DsEmptyState(
          icon: Icons.account_balance_wallet_outlined,
          tone: DsTone.lime,
          title: 'Add where your money goes',
          message:
              'Add a mobile money wallet or bank account. You can add more '
              'than one and pick per jar.',
          actionLabel: 'Add account',
          onAction: state.actionInProgress ? null : _openAddAccount,
        ),
      );
    }

    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            DsListCard(
              children: [
                for (final account in state.accounts)
                  DsRow(
                    leading: PayoutAccountLogo(account: account),
                    title: payoutAccountTitle(account),
                    subtitle: payoutAccountSubtitle(account, state.banks),
                    trailing:
                        account.isDefault
                            ? const DsTag('Default', tone: DsTone.dark)
                            : null,
                    chevron: !account.isDefault,
                    onTap:
                        state.actionInProgress
                            ? null
                            : () => _showOptions(account, state.banks),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                'Tap an account to make it the default or remove it.',
                style: DsText.caption,
              ),
            ),
          ],
        ),
        if (state.actionInProgress)
          const Positioned.fill(
            child: ColoredBox(
              color: Color(0x11000000),
              child: Center(
                child: CircularProgressIndicator(color: AppColors.navy),
              ),
            ),
          ),
      ],
    );
  }
}
