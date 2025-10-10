import 'package:flutter/material.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';

class PaymentMethodContributionItem extends StatelessWidget {
  const PaymentMethodContributionItem({
    super.key,
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.currency,
    required this.icon,
    this.backgroundColor,
  });

  final String title;
  final String subtitle;
  final double amount;
  final String currency;
  final IconData icon;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: CircleAvatar(
        backgroundColor:
            backgroundColor ?? Theme.of(context).colorScheme.primary,
        child: Icon(
          icon,
          size: 16,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
      title: Text(title, style: TextStyles.titleMediumM),
      subtitle: Text(
        subtitle,
        style: TextStyles.titleMediumXs.copyWith(
          color: Theme.of(
            context,
          ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
        ),
      ),
      trailing: Text(
        CurrencyUtils.formatAmount(amount, currency),
        style: TextStyles.titleMediumM,
      ),
    );
  }
}
