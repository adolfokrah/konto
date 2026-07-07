import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
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
/// Built on the app design-system [GenericPicker] (same search + section layout
/// used by SelectInput / currency & jar-group pickers). Accounts are loaded via
/// the app-root [WithdrawalAccountsBloc] before the sheet opens.
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

    GenericPicker.showPickerDialog<WithdrawalAccountModel>(
      context,
      selectedValue: currentId ?? '',
      items: accounts,
      onItemSelected: (account) => onSelected(account.id),
      searchFilter: (a) => '${withdrawalAccountLabel(a)} ${a.accountNumber}',
      isItemSelected: (a, sel) => a.id == sel,
      itemBuilder: _buildRow,
      recentItemBuilder: _buildRow,
      searchResultBuilder: _buildRow,
      title: 'Select payout account',
      searchHint: 'Search payout accounts',
      recentSectionTitle: 'Current account',
      otherSectionTitle: 'Your accounts',
      searchResultsTitle: 'Results',
      noResultsMessage: 'No payout accounts found',
      showSearch: true,
    );
  }

  static Widget _buildRow(
    WithdrawalAccountModel account,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return Builder(
      builder: (context) {
        return ListTile(
          onTap: onTap,
          contentPadding: EdgeInsets.zero,
          leading: Icon(
            account.isMobileMoney
                ? Icons.phone_android
                : Icons.account_balance,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          title: Row(
            children: [
              Flexible(
                child: Text(
                  account.label?.isNotEmpty == true
                      ? account.label!
                      : withdrawalAccountLabel(account),
                  style: TextStyles.titleMediumS.copyWith(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (account.isDefault) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(context)
                        .colorScheme
                        .primary
                        .withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Default',
                    style: TextStyles.titleRegularSm.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ],
          ),
          subtitle: Text(
            '${withdrawalAccountLabel(account)}  •  ${account.maskedAccountNumber}',
            style: TextStyles.titleRegularSm.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          trailing: isSelected
              ? Icon(
                  Icons.check_circle,
                  color: Theme.of(context).colorScheme.primary,
                )
              : null,
        );
      },
    );
  }
}
