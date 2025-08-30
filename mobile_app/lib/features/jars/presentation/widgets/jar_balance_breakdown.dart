import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/widgets/divider.dart';
import 'package:konto/core/widgets/drag_handle.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';

class JarBalanceBreakdown extends StatelessWidget {
  const JarBalanceBreakdown({super.key});

  /// Show the balance breakdown bottom sheet
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      enableDrag: true,
      isDismissible: true,
      isScrollControlled: true,
      builder: (context) => const JarBalanceBreakdown(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, state) {
        if (state is! JarSummaryLoaded) {
          return Container(
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppRadius.radiusM),
              ),
            ),
            child: const SafeArea(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.spacingM),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
          );
        }

        final jarData = state.jarData;

        return ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.9,
          ),
          child: IntrinsicHeight(
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Drag handle
                    Center(child: const DragHandle()),
                    const SizedBox(height: AppSpacing.spacingM),

                    // Title
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.spacingXs,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Balance Breakdown',
                            style: TextStyles.titleBoldLg,
                          ),
                          const SizedBox(height: AppSpacing.spacingXs),
                          Text(
                            'Below is a detailed breakdown of your jar balance,  contributions and how much we owe you.',
                            style: TextStyles.titleRegularM,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: AppSpacing.spacingM),

                    _buildPaymentMethodContribution(
                      context,
                      title: 'Cash',
                      subtitle:
                          '${jarData.cashContributionCount} Contributions',
                      amount: jarData.balanceBreakDown.cash.totalAmount,
                      currency: jarData.currency,
                      icon: Icons.money,
                    ),

                    _buildPaymentMethodContribution(
                      context,
                      title: 'Bank Transfer',
                      subtitle:
                          '${jarData.bankTransferContributionCount} Contributions',
                      amount: jarData.balanceBreakDown.bankTransfer.totalAmount,
                      currency: jarData.currency,
                      icon: Icons.account_balance,
                    ),

                    _buildPaymentMethodContribution(
                      context,
                      title: 'Mobile money',
                      subtitle:
                          '${jarData.mobileMoneyContributionCount} Contributions',
                      amount: jarData.balanceBreakDown.mobileMoney.totalAmount,
                      currency: jarData.currency,
                      icon: Icons.phone_android,
                    ),

                    AppDivider(),
                    const SizedBox(height: AppSpacing.spacingXs),

                    // Balance breakdown items
                    _buildBalanceItem(
                      context,
                      title: 'Total Contributions',
                      amount: jarData.balanceBreakDown.totalContributedAmount,
                      currency: jarData.currency,
                    ),

                    _buildBalanceItem(
                      context,
                      title: 'Total Transfers',
                      amount: jarData.balanceBreakDown.totalTransfers,
                      currency: jarData.currency,
                    ),

                    _buildBalanceItem(
                      context,
                      title: 'Total we owe you',
                      amount:
                          jarData.balanceBreakDown.totalAmountTobeTransferred,
                      currency: jarData.currency,
                      isLastItem: true,
                    ),

                    AppDivider(),
                    const SizedBox(height: AppSpacing.spacingM),

                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.spacingXs,
                      ),
                      child: Text(
                        'Note: Transfers exclude cash and bank contributions',
                        style: TextStyles.titleRegularM.copyWith(
                          color: Theme.of(
                            context,
                          ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBalanceItem(
    BuildContext context, {
    required String title,
    required double amount,
    required String currency,
    bool isLastItem = false,
  }) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.spacingXs,
        vertical: isLastItem ? AppSpacing.spacingXs : 2,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style:
                isLastItem
                    ? TextStyles.titleMediumLg
                    : TextStyles.titleMediumS.copyWith(
                      color: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
                    ),
          ),
          Text(
            CurrencyUtils.formatAmount(amount, currency),
            style:
                isLastItem
                    ? TextStyles.titleMediumLg
                    : TextStyles.titleMediumS.copyWith(
                      color: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
                    ),
          ),
        ],
      ),
    );
  }
}

Widget _buildPaymentMethodContribution(
  BuildContext context, {
  required String title,
  required String subtitle,
  required double amount,
  required String currency,
  required IconData icon,
}) {
  return ListTile(
    leading: CircleAvatar(
      backgroundColor: Theme.of(context).colorScheme.primary,
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
