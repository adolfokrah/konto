import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/views/add_withdrawal_account_view.dart';

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
        builder: (_) => BlocProvider.value(
          value: context.read<WithdrawalAccountsBloc>(),
          child: const AddWithdrawalAccountView(),
        ),
      ),
    );
    if (mounted) {
      context.read<WithdrawalAccountsBloc>().add(LoadWithdrawalAccounts());
    }
  }

  void _confirmDelete(WithdrawalAccountModel account) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Remove account'),
        content: Text(
          'Remove ${account.accountHolder} (${account.maskedAccountNumber})?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context
                  .read<WithdrawalAccountsBloc>()
                  .add(DeleteWithdrawalAccount(id: account.id));
            },
            child: Text(
              'Remove',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
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
          appBar: AppBar(
            elevation: 0,
            centerTitle: true,
            title: const Text('Withdrawal accounts'),
          ),
          body: _buildBody(context, state),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.spacingM),
              child: AppButton.filled(
                text: 'Add account',
                onPressed: state.actionInProgress ? null : _openAddAccount,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBody(BuildContext context, WithdrawalAccountsState state) {
    if (state.status == WithdrawalAccountsStatus.loading &&
        state.accounts.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.accounts.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.spacingL),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.account_balance_wallet_outlined,
                size: 56,
                color: Theme.of(context).colorScheme.outline,
              ),
              const SizedBox(height: AppSpacing.spacingM),
              Text(
                'No withdrawal accounts yet',
                style: TextStyles.titleMediumLg,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.spacingXs),
              Text(
                'Add a mobile money or bank account to receive your payouts.',
                style: TextStyles.titleRegularM.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Stack(
      children: [
        ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.spacingM),
          itemCount: state.accounts.length,
          separatorBuilder: (_, __) =>
              const SizedBox(height: AppSpacing.spacingS),
          itemBuilder: (context, index) {
            return _AccountCard(
              account: state.accounts[index],
              disabled: state.actionInProgress,
              onSetDefault: () => context
                  .read<WithdrawalAccountsBloc>()
                  .add(SetDefaultWithdrawalAccount(id: state.accounts[index].id)),
              onDelete: () => _confirmDelete(state.accounts[index]),
            );
          },
        ),
        if (state.actionInProgress)
          const Positioned.fill(
            child: ColoredBox(
              color: Color(0x11000000),
              child: Center(child: CircularProgressIndicator()),
            ),
          ),
      ],
    );
  }
}

class _AccountCard extends StatelessWidget {
  final WithdrawalAccountModel account;
  final bool disabled;
  final VoidCallback onSetDefault;
  final VoidCallback onDelete;

  const _AccountCard({
    required this.account,
    required this.disabled,
    required this.onSetDefault,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final providerLabel = account.isMobileMoney
        ? (account.provider == 'mtn'
            ? 'MTN Mobile Money'
            : account.provider == 'telecel'
                ? 'Telecel Cash'
                : account.provider.toUpperCase())
        : account.provider.toUpperCase();

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.spacingM),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                account.isMobileMoney
                    ? Icons.phone_android
                    : Icons.account_balance,
                size: 20,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: AppSpacing.spacingXs),
              Expanded(
                child: Text(
                  account.label?.isNotEmpty == true
                      ? account.label!
                      : providerLabel,
                  style: TextStyles.titleMediumS.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (account.isDefault) _defaultChip(context),
            ],
          ),
          const SizedBox(height: AppSpacing.spacingXs),
          Text(account.accountHolder, style: TextStyles.titleMedium),
          const SizedBox(height: 2),
          Text(
            '$providerLabel  •  ${account.maskedAccountNumber}',
            style: TextStyles.titleRegularSm.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.spacingS),
          Row(
            children: [
              if (!account.isDefault)
                TextButton.icon(
                  onPressed: disabled ? null : onSetDefault,
                  icon: const Icon(Icons.star_outline, size: 18),
                  label: const Text('Set default'),
                ),
              const Spacer(),
              TextButton.icon(
                onPressed: disabled ? null : onDelete,
                icon: Icon(
                  Icons.delete_outline,
                  size: 18,
                  color: Theme.of(context).colorScheme.error,
                ),
                label: Text(
                  'Remove',
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _defaultChip(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary,
        borderRadius: BorderRadius.circular(AppRadius.radiusM),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
        ),
      ),
      child: Text(
        'Default',
        style: TextStyles.titleRegularXs.copyWith(fontWeight: FontWeight.w600),
      ),
    );
  }
}
