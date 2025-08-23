import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/l10n/app_localizations.dart';

class ContributionListItem extends StatelessWidget {
  /// The name or identifier of the contributor
  final String contributorName;

  /// The contribution amount
  final double amount;

  /// The currency code (e.g., 'ghc', 'ngn', 'usd')
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
  });

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.all(0),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor:
                isDark
                    ? Theme.of(context).colorScheme.surface
                    : Theme.of(context).colorScheme.primary,
            child:
                avatarUrl == null
                    ? Text(
                      _getInitials(contributorName),
                      style: TextStyles.titleBoldM.copyWith(
                        color:
                            isDark
                                ? Theme.of(context).colorScheme.onSurface
                                : AppColors.black,
                      ),
                    )
                    : null,
          ),
          // Status overlay icon
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color:
                    isDark
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.surface,
                shape: BoxShape.circle,
                border: Border.all(
                  color: Theme.of(context).colorScheme.surface,
                  width: 1.5,
                ),
              ),
              child: Icon(_getOverlayIcon(), size: 10),
            ),
          ),
        ],
      ),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              isAnonymous ? localizations.anonymous : contributorName,
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
            ),
          ),
        ],
      ),
      subtitle: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            _formatTimestamp(timestamp, localizations),
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
                paymentMethod!.toUpperCase(),
                style: TextStyles.titleRegularXs,
              ),
            ),
        ],
      ),
    );
  }

  String _formatTimestamp(DateTime dateTime, AppLocalizations localizations) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    // If more than 2 days ago, show exact date and time
    if (difference.inDays > 2) {
      return _formatExactDateTime(dateTime, localizations);
    } else if (difference.inDays > 0) {
      return difference.inDays == 1
          ? localizations.dayAgo(difference.inDays)
          : localizations.daysAgo(difference.inDays);
    } else if (difference.inHours > 0) {
      return difference.inHours == 1
          ? localizations.hourAgo(difference.inHours)
          : localizations.hoursAgo(difference.inHours);
    } else if (difference.inMinutes > 0) {
      return difference.inMinutes == 1
          ? localizations.minuteAgo(difference.inMinutes)
          : localizations.minutesAgo(difference.inMinutes);
    } else {
      return localizations.justNow;
    }
  }

  /// Format the exact date and time for contributions older than 2 days
  String _formatExactDateTime(
    DateTime dateTime,
    AppLocalizations localizations,
  ) {
    // Use Flutter's built-in date and time formatting with proper locale
    final dateFormatter = DateFormat.yMMMd(localizations.localeName);
    final timeFormatter = DateFormat.jm(localizations.localeName);

    final formattedDate = dateFormatter.format(dateTime);
    final formattedTime = timeFormatter.format(dateTime);

    return '$formattedDate, $formattedTime';
  }

  String _getInitials(String name) {
    if (isAnonymous) return '?';

    final words = name.trim().split(' ');
    if (words.isEmpty) return '?';

    if (words.length == 1) {
      return words[0].isNotEmpty ? words[0][0].toUpperCase() : '?';
    } else {
      return '${words[0][0].toUpperCase()}${words[1][0].toUpperCase()}';
    }
  }

  IconData _getOverlayIcon() {
    if (viaPaymentLink == true) {
      return Icons.call_received;
    }
    if (paymentStatus == 'transferred') {
      return Icons.arrow_forward;
    }
    if (paymentMethod != null &&
        ['cash', 'bank-transfer'].contains(paymentMethod!.toLowerCase())) {
      return Icons.add;
    }
    return Icons.info; // fallback
  }
}
