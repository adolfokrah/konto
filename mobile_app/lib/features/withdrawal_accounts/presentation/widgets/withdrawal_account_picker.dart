import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/user_account/presentation/widgets/account_ds.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/payout_account_widgets.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';
import 'package:Hoga/features/withdrawal_accounts/logic/bloc/withdrawal_accounts_bloc.dart';
import 'package:Hoga/route.dart';

/// Human-friendly label for a payout account's provider.
///
/// Shared helper so create-jar and jar-info render account labels identically.
String withdrawalAccountLabel(WithdrawalAccountModel account) {
  if (account.isMobileMoney) {
    switch (account.provider) {
      case 'mtn':
        return 'MTN Mobile Money';
      case 'telecel':
        return 'Telecel Cash';
      default:
        return account.provider.isEmpty
            ? 'Mobile Money'
            : account.provider.toUpperCase();
    }
  }
  return account.provider.isEmpty ? 'Bank' : account.provider.toUpperCase();
}

/// A shared bottom-sheet picker for selecting a payout (withdrawal) account.
///
/// A "Send to" sheet listing saved accounts with network logos and radios,
/// plus an "Add account" shortcut. Accounts are loaded via the app-root
/// [WithdrawalAccountsBloc] before the sheet opens.
///
/// The picker uses a callback ([onSelected]) rather than an awaitable result so
/// there is no future to hang when the sheet is dismissed without a selection —
/// [onSelected] simply never fires on dismiss.
class WithdrawalAccountPicker {
  const WithdrawalAccountPicker._();

  /// Loads the user's accounts and opens the picker.
  ///
  /// [currentId] highlights the currently-linked account. [onSelected] is
  /// invoked with the chosen account id only when the user picks one.
  ///
  /// If the user has ZERO accounts, the picker is not shown; instead the user is
  /// routed to the withdrawal-accounts manager to add one.
  static Future<void> show(
    BuildContext context, {
    String? currentId,
    required void Function(String id) onSelected,
  }) async {
    final bloc = context.read<WithdrawalAccountsBloc>();

    // Kick off a load and wait for the bloc to settle (loaded or error).
    bloc.add(LoadWithdrawalAccounts());
    WithdrawalAccountsState state = bloc.state;
    if (state.status == WithdrawalAccountsStatus.loading ||
        state.status == WithdrawalAccountsStatus.initial) {
      try {
        state = await bloc.stream
            .firstWhere(
              (s) =>
                  s.status != WithdrawalAccountsStatus.loading &&
                  s.status != WithdrawalAccountsStatus.initial,
            )
            .timeout(const Duration(seconds: 10));
      } on TimeoutException {
        state = bloc.state; // fall back to whatever we have
      }
    }

    if (!context.mounted) return;

    final accounts = state.accounts;

    // No accounts — route to the manager to add one instead of opening an
    // empty picker.
    if (accounts.isEmpty) {
      await context.push(AppRoutes.withdrawalAccounts);
      // Refresh so a newly added account is available next time.
      if (context.mounted) {
        context.read<WithdrawalAccountsBloc>().add(LoadWithdrawalAccounts());
      }
      return;
    }

    final banks = state.banks;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder:
          (sheetContext) => AccSheet(
            children: [
              const AccSheetHeader('Send to'),
              Flexible(
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.cream,
                    borderRadius: BorderRadius.circular(AppRadius.radiusCard),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        for (var i = 0; i < accounts.length; i++) ...[
                          if (i > 0)
                            const Divider(height: 1, color: AppColors.line),
                          _buildRow(
                            accounts[i],
                            accounts[i].id == currentId,
                            banks,
                            () {
                              Navigator.of(sheetContext).pop();
                              onSelected(accounts[i].id);
                            },
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              AppButton(
                text: 'Add account',
                icon: const Icon(Icons.add_rounded, color: AppColors.navy),
                backgroundColor: AppColors.cream,
                textColor: AppColors.navy,
                onPressed: () async {
                  Navigator.of(sheetContext).pop();
                  await context.push(AppRoutes.withdrawalAccounts);
                  if (context.mounted) {
                    context.read<WithdrawalAccountsBloc>().add(
                      LoadWithdrawalAccounts(),
                    );
                  }
                },
              ),
            ],
          ),
    );
  }

  static Widget _buildRow(
    WithdrawalAccountModel account,
    bool isSelected,
    List<BankModel> banks,
    VoidCallback onTap,
  ) {
    return DsRow(
      onTap: onTap,
      leading: PayoutAccountLogo(account: account),
      title: payoutAccountTitle(account),
      subtitle: payoutAccountSubtitle(account, banks),
      trailing: AccRadio(isSelected),
    );
  }
}
