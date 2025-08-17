import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/l10n/app_localizations.dart';

class GoalProgressCard extends StatelessWidget {
  /// Current amount raised
  final double currentAmount;

  /// Target goal amount
  final double goalAmount;

  /// Currency symbol (e.g., '₵', '₦')
  final String currency;

  /// Deadline date
  final DateTime? deadline;

  /// Card variant
  final CardVariant variant;

  /// Whether the card should be collapsible
  final bool isCollapsible;

  /// Callback for when "Set Goal" button is pressed (optional)
  final VoidCallback? onSetGoal;

  const GoalProgressCard({
    super.key,
    required this.currentAmount,
    required this.goalAmount,
    required this.currency,
    this.deadline,
    this.variant = CardVariant.primary,
    this.isCollapsible = false,
    this.onSetGoal,
  });

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final progress = goalAmount > 0 ? currentAmount / goalAmount : 0.0;
    final progressPercentage = (progress * 100).clamp(0.0, 100.0);
    final daysLeft = _calculateDaysLeft();
    final hasGoal = goalAmount > 0;

    return AppCard(
      variant: variant,
      isCollapsible: isCollapsible,
      title: isCollapsible ? localizations.goal : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Goal header - only show if not collapsible (since collapsible cards have their own header)
          if (!isCollapsible) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(localizations.goal, style: TextStyles.titleMedium),
                Icon(Icons.chevron_right, size: 20),
              ],
            ),
            const SizedBox(height: AppSpacing.spacingS),
          ],

          // Content based on whether goal exists
          hasGoal
              ? _buildGoalContent(
                context,
                localizations,
                progress,
                progressPercentage,
                daysLeft,
              )
              : _buildNoGoalContent(context, localizations),
        ],
      ),
    );
  }

  // Build content when goal exists
  Widget _buildGoalContent(
    BuildContext context,
    AppLocalizations localizations,
    double progress,
    double progressPercentage,
    int? daysLeft,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Amount display
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: '$currency${_formatAmount(currentAmount)}',
                style: TextStyles.titleBoldM.copyWith(
                  color: Theme.of(context).textTheme.titleLarge?.color,
                ),
              ),
              TextSpan(
                text:
                    ' ${localizations.goalAmountOf(currency, _formatAmount(goalAmount))}',
                style: TextStyles.titleRegularM.copyWith(
                  color: Theme.of(context).textTheme.bodyMedium?.color,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.spacingM),

        // Progress bar
        Column(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.radiusL),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                backgroundColor: Theme.of(context).colorScheme.surface,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.blueAccent),
                minHeight: 4,
              ),
            ),
          ],
        ),

        const SizedBox(height: AppSpacing.spacingM),

        // Deadline and days left
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            if (deadline != null) ...[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    localizations.deadlineDate(_formatDate(deadline!)),
                    style: TextStyles.titleRegularSm,
                  ),
                ],
              ),
              if (daysLeft != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      localizations.daysLeft(daysLeft),
                      style: TextStyles.titleRegularSm,
                    ),
                  ],
                ),
            ] else ...[
              // If no deadline, show progress percentage
              Text(
                localizations.percentageCompleted(
                  progressPercentage.toStringAsFixed(1),
                ),
                style: TextStyles.titleRegularSm.copyWith(
                  color: Theme.of(context).textTheme.bodyMedium?.color,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  // Build content when no goal is set
  Widget _buildNoGoalContent(
    BuildContext context,
    AppLocalizations localizations,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Current amount without goal
        Text(localizations.noGoalSetYet, style: TextStyles.titleRegularM),

        const SizedBox(height: AppSpacing.spacingL),

        // Set goal button
        AppButton.filled(
          text: localizations.setGoal,
          onPressed: onSetGoal ?? () {},
        ),
      ],
    );
  }

  String _formatAmount(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(1)}K';
    } else {
      return amount.toStringAsFixed(2);
    }
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  int? _calculateDaysLeft() {
    if (deadline == null) return null;

    final now = DateTime.now();
    final difference = deadline!.difference(now);

    return difference.inDays;
  }
}
