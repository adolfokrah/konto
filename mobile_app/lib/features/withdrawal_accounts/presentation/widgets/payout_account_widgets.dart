import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/withdrawal_accounts/data/models/withdrawal_account_model.dart';

/// Short provider name as the mockups write it ("MoMo", "Telecel Cash",
/// "GCB Bank"). Bank codes resolve through [banks] when they're loaded.
String payoutProviderName(
  WithdrawalAccountModel account, [
  List<BankModel> banks = const [],
]) {
  if (account.isMobileMoney) {
    switch (DsNetworkLogo.fromProvider(account.provider)) {
      case DsNetwork.mtn:
        return 'MTN MoMo';
      case DsNetwork.telecel:
        return 'Telecel Cash';
      case DsNetwork.airtelTigo:
        return 'AirtelTigo Money';
      case null:
        return account.provider.isEmpty
            ? 'Mobile money'
            : account.provider.toUpperCase();
    }
  }
  for (final b in banks) {
    if (b.code == account.provider) return b.name;
  }
  return account.provider.isEmpty ? 'Bank' : account.provider.toUpperCase();
}

/// Row title: the nickname if set, otherwise the holder's name.
String payoutAccountTitle(WithdrawalAccountModel account) =>
    account.label?.trim().isNotEmpty == true
        ? account.label!.trim()
        : account.accountHolder;

/// Masked number as the mockups write it: "024 ••• 4567" for wallets,
/// "••• 2210" for bank accounts.
String payoutMaskedNumber(WithdrawalAccountModel account) {
  final digits = account.accountNumber.replaceAll(RegExp(r'\s'), '');
  if (digits.length <= 4) return digits;
  final last = digits.substring(digits.length - 4);
  if (account.isMobileMoney && digits.length >= 10) {
    final local = digits.startsWith('233') ? '0${digits.substring(3)}' : digits;
    return '${local.substring(0, 3)} ••• $last';
  }
  return '••• $last';
}

/// "MTN MoMo · 024 ••• 4567"
String payoutAccountSubtitle(
  WithdrawalAccountModel account, [
  List<BankModel> banks = const [],
]) => '${payoutProviderName(account, banks)} · ${payoutMaskedNumber(account)}';

/// Network logo for mobile money, blue bank tile for banks.
class PayoutAccountLogo extends StatelessWidget {
  final WithdrawalAccountModel? account;

  /// Used when there's no account yet (add form): 'mtn', 'telecel' or a bank.
  final String? provider;
  final bool isBank;
  final double size;

  const PayoutAccountLogo({
    super.key,
    this.account,
    this.provider,
    this.isBank = false,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final bank = account?.isBank ?? isBank;
    final network =
        bank ? null : DsNetworkLogo.fromProvider(account?.provider ?? provider);
    if (network != null) return DsNetworkLogo(network, size: size);
    return DsIconTile(
      bank ? Icons.account_balance_rounded : Icons.phone_android_rounded,
      tone: bank ? DsTone.info : DsTone.neutral,
      size: size,
    );
  }
}
