import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';

/// One payment-method line in a breakdown: colour dot, method, count, amount.
class PaymentMethodContributionItem extends StatelessWidget {
  const PaymentMethodContributionItem({
    super.key,
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.currency,
    required this.icon,
    this.backgroundColor,
    this.color,
  });

  final String title;
  final String subtitle;
  final double amount;
  final String currency;
  final IconData icon;

  /// Kept for compatibility; the redesign uses [color] for the legend dot.
  final Color? backgroundColor;

  /// Legend colour that matches the stacked bar.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.fill,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, size: 18, color: AppColors.navy),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (color != null) ...[
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                    ],
                    Flexible(
                      child: Text(
                        title,
                        style: DsText.rowTitle.copyWith(fontSize: 14),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(subtitle, style: DsText.caption),
              ],
            ),
          ),
          Text(
            CurrencyUtils.formatAmount(amount, currency),
            style: DsText.rowTitle.copyWith(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}

/// Thin stacked bar showing each method's share (mockup `.stacked`).
class JarStackedBar extends StatelessWidget {
  final List<(double value, Color color)> parts;
  final double height;

  const JarStackedBar({super.key, required this.parts, this.height = 10});

  @override
  Widget build(BuildContext context) {
    final visible = parts.where((p) => p.$1 > 0).toList();
    if (visible.isEmpty) {
      return Container(
        height: height,
        decoration: BoxDecoration(
          color: AppColors.fill,
          borderRadius: BorderRadius.circular(6),
        ),
      );
    }
    final total = visible.fold<double>(0, (s, p) => s + p.$1);
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: SizedBox(
        height: height,
        child: Row(
          children: [
            for (var i = 0; i < visible.length; i++) ...[
              if (i > 0) const SizedBox(width: 3),
              Expanded(
                flex: ((visible[i].$1 / total) * 1000).round().clamp(1, 1000),
                child: Container(color: visible[i].$2),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
