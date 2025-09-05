import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/utils/date_utils.dart';
import 'package:konto/core/utils/payment_method_utils.dart';
import 'package:konto/core/widgets/contributor_avatar.dart';
import 'package:konto/features/contribution/presentation/views/contribution_view.dart';
import 'package:konto/l10n/app_localizations.dart';

class ContributionListItem extends StatelessWidget {
  /// The contribution ID
  final String contributionId;

  /// The name or identifier of the contributor
  final String contributorName;

  /// The contribution amount
  final double amount;

  /// The currency code (e.g., 'GHS', 'ngn', 'usd')
  final String currency;

  /// The date and time of the contribution
  final DateTime timestamp;

  /// Optional payment method (e.g., 'Mobile Money', 'Bank Transfer', 'Cash')
  final String? paymentMethod;

  /// Optional avatar image URL or asset path
  final String? avatarUrl;

  /// Whether this contribution is anonymous
  final bool isAnonymous;

  /// Whether this contribution was via payment link
  final bool? viaPaymentLink;

  /// Payment status for overlay icons
  final String? paymentStatus;

  /// Optional callback when the item is tapped
  final VoidCallback? onTap;

  const ContributionListItem({
    super.key,
    required this.contributorName,
    required this.amount,
    required this.currency,
    required this.timestamp,
    this.paymentMethod,
    this.avatarUrl,
    this.isAnonymous = false,
    this.viaPaymentLink,
    this.paymentStatus,
    this.onTap,
    required this.contributionId,
  });

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return ListTile(
      onTap: () {
        if (onTap != null) {
          onTap!();
        }
        ContributionView.show(context, contributionId);
      },
      contentPadding: const EdgeInsets.all(0),
      leading: ContributorAvatar(
        contributorName: contributorName,
        avatarUrl: avatarUrl,
        isAnonymous: isAnonymous,
        paymentStatus: paymentStatus,
        viaPaymentLink: viaPaymentLink,
      ),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              isAnonymous ? 'Konto' : contributorName,
              style: TextStyles.titleMedium,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            CurrencyUtils.formatAmount(amount, currency),
            style: TextStyles.titleBoldM.copyWith(
              decoration:
                  paymentStatus?.toLowerCase() == 'failed'
                      ? TextDecoration.lineThrough
                      : null,
              decorationThickness:
                  paymentStatus?.toLowerCase() == 'failed' ? 2.0 : null,
            ),
          ),
        ],
      ),
      subtitle: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            AppDateUtils.formatTimestamp(timestamp, localizations),
            style: TextStyles.titleRegularXs,
          ),
          if (paymentMethod != null)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 2),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.radiusM / 3),
              ),
              child: Text(
                PaymentMethodUtils.getPaymentMethodLabel(
                  paymentMethod,
                  localizations,
                ).toUpperCase(),
                style: TextStyles.titleRegularXs,
              ),
            ),
        ],
      ),
    );
  }
}
