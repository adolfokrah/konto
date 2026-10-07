import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/date_utils.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/core/utils/payment_status_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/contribution/presentation/views/contribution_view.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/l10n/app_localizations.dart';

/// Statement-style row for one payment or transfer on a jar
/// (network logo / method tile, name, method · time, signed amount, status tag).
class JarActivityRow extends StatelessWidget {
  final ContributionModel contribution;

  /// The jar owner's id. When set, payments taken by someone else show
  /// "via [first name]" (mockup statement).
  final String? creatorId;

  const JarActivityRow({super.key, required this.contribution, this.creatorId});

  String _name(AppLocalizations l) {
    final c = contribution;
    if (c.isTransfer) return 'Transfer to payout account';
    if (c.contributor != null && c.contributor!.trim().isNotEmpty) {
      return c.contributor!;
    }
    final phone = c.contributorPhoneNumber;
    if (phone != null && phone.length >= 4) {
      return l.userWithLastDigits(phone.substring(phone.length - 4));
    }
    return 'Anonymous';
  }

  Widget _leading() {
    final c = contribution;
    if (c.isTransfer) {
      return const DsIconTile(Icons.north_east_rounded);
    }
    if (c.isRefund) {
      return const DsIconTile(Icons.undo_rounded, tone: DsTone.pending);
    }
    // The payment method decides the icon; the provider is only used for
    // mobile money (cash records can carry a leftover provider). Same rule
    // as Activity's PaymentMethodTile.
    final method = (c.paymentMethod ?? '').toLowerCase();
    switch (method) {
      case 'cash':
        return const DsIconTile(Icons.payments_outlined, tone: DsTone.positive);
      case 'card':
      case 'apple-pay':
        return const DsIconTile(Icons.credit_card_rounded, tone: DsTone.info);
      case 'bank':
      case 'bank-transfer':
        return const DsIconTile(Icons.account_balance_outlined);
      case 'mobile-money':
        final network = DsNetworkLogo.fromProvider(c.mobileMoneyProvider);
        if (network != null) return DsNetworkLogo(network);
        return const DsIconTile(Icons.phone_android_rounded, tone: DsTone.lime);
      default:
        return const DsIconTile(Icons.savings_outlined);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final c = contribution;
    final status = c.paymentStatus.toLowerCase();
    final failed = PaymentStatusUtils.isFailedStatus(status);
    final completed = PaymentStatusUtils.isSuccessfulStatus(status);
    final out = c.isTransfer || c.isRefund;
    final time =
        c.createdAt != null
            ? AppDateUtils.formatTimestamp(c.createdAt!, l)
            : '';
    final method =
        c.isTransfer
            ? null
            : PaymentMethodUtils.getPaymentMethodLabel(c.paymentMethod, l);
    final collector = c.collector;
    final viaName =
        creatorId != null &&
                !c.isTransfer &&
                collector != null &&
                collector.id != creatorId &&
                collector.fullName.trim().isNotEmpty
            ? collector.fullName.trim().split(' ').first
            : null;
    final subtitle = [
      if (method != null && c.paymentMethod != null) method,
      if (time.isNotEmpty) time,
      if (c.viaPaymentLink == true) 'Link',
      if (viaName != null) 'via $viaName',
    ].join(' · ');

    final amountText =
        '${out ? '−' : '+'}${DsMoney.group(c.amountContributed)}.${((c.amountContributed.abs() * 100).round() % 100).toString().padLeft(2, '0')}';
    final amountColor =
        failed
            ? AppColors.faint
            : out
            ? AppColors.navy
            : completed
            ? AppColors.positive
            : AppColors.navy;

    DsTone? tagTone;
    if (!completed) {
      tagTone =
          failed
              ? DsTone.negative
              : status == 'awaiting-approval'
              ? DsTone.info
              : DsTone.pending;
    }

    return InkWell(
      onTap: () => ContributionView.show(context, c.id),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            _leading(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _name(l),
                    style: DsText.rowTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: DsText.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  amountText,
                  style: TextStyle(
                    fontFamily: 'Chillax',
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: amountColor,
                    decoration: failed ? TextDecoration.lineThrough : null,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
                if (tagTone != null) ...[
                  const SizedBox(height: 4),
                  DsTag(
                    PaymentStatusUtils.getPaymentStatusLabel(status, l),
                    tone: tagTone,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
