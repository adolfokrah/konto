import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/divider.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/payment_method_contribution_item.dart';
import 'package:Hoga/l10n/app_localizations.dart';

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
    final localizations = AppLocalizations.of(context)!;

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
            child: SafeArea(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.spacingM),
                child: Center(
                  child: CircularProgressIndicator(
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
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
                            localizations.balanceBreakdown,
                            style: TextStyles.titleBoldLg,
                          ),
                          const SizedBox(height: AppSpacing.spacingXs),
                          Text(
                            localizations.balanceBreakdownDescription,
                            style: TextStyles.titleRegularM,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: AppSpacing.spacingM),

                    PaymentMethodContributionItem(
                      title: localizations.cash,
                      subtitle: localizations.contributionsCount(
                        jarData.cashContributionCount,
                      ),
                      amount: jarData.balanceBreakDown.cash.totalAmount,
                      currency: jarData.currency,
                      icon: Icons.money,
                    ),

                    PaymentMethodContributionItem(
                      title: localizations.bankTransfer,
                      subtitle: localizations.contributionsCount(
                        jarData.bankTransferContributionCount,
                      ),
                      amount: jarData.balanceBreakDown.bankTransfer.totalAmount,
                      currency: jarData.currency,
                      icon: Icons.account_balance,
                    ),

                    PaymentMethodContributionItem(
                      title: localizations.mobileMoney,
                      subtitle: localizations.contributionsCount(
                        jarData.mobileMoneyContributionCount,
                      ),
                      amount: jarData.balanceBreakDown.mobileMoney.totalAmount,
                      currency: jarData.currency,
                      icon: Icons.phone_android,
                    ),

                    PaymentMethodContributionItem(
                      title: localizations.cardPayment,
                      subtitle: localizations.contributionsCount(
                        jarData.balanceBreakDown.card.totalCount,
                      ),
                      amount: jarData.balanceBreakDown.card.totalAmount,
                      currency: jarData.currency,
                      icon: Icons.credit_card,
                    ),

                    PaymentMethodContributionItem(
                      title: localizations.applePayPayment,
                      subtitle: localizations.contributionsCount(
                        jarData.balanceBreakDown.applePay.totalCount,
                      ),
                      amount: jarData.balanceBreakDown.applePay.totalAmount,
                      currency: jarData.currency,
                      icon: Icons.apple,
                    ),

                    AppDivider(),
                    const SizedBox(height: AppSpacing.spacingXs),

                    // Balance breakdown items
                    _buildBalanceItem(
                      context,
                      title: localizations.totalContributions,
                      amount: jarData.balanceBreakDown.totalContributedAmount,
                      currency: jarData.currency,
                    ),

                    _buildBalanceItem(
                      context,
                      title: localizations.totalTransfers,
                      amount: jarData.balanceBreakDown.totalTransfers,
                      currency: jarData.currency,
                    ),

                    const SizedBox(height: AppSpacing.spacingS),

                    _buildBalanceItem(
                      context,
                      title: localizations.totalWeOweYou,
                      amount:
                          jarData.balanceBreakDown.totalAmountTobeTransferred,
                      currency: jarData.currency,
                      isLastItem: true,
                      isGreenAmount: true,
                    ),
                    _buildBalanceItem(
                      context,
                      title: localizations.totalYouOwe,
                      amount: jarData.balanceBreakDown.totalYouOwe,
                      currency: jarData.currency,
                      isLastItem: true,
                      isRedAmount: true,
                    ),

                    AppDivider(),
                    const SizedBox(height: AppSpacing.spacingM),

                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.spacingXs,
                      ),
                      child: Text(
                        localizations.transfersNote,
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
    bool isRedAmount = false,
    bool isGreenAmount = false,
  }) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.spacingXs,
        vertical: 2,
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
            isRedAmount
                ? '-${CurrencyUtils.formatAmount(amount, currency)}'
                : isGreenAmount
                ? '+${CurrencyUtils.formatAmount(amount, currency)}'
                : CurrencyUtils.formatAmount(amount, currency),
            style:
                isLastItem
                    ? TextStyles.titleMediumLg.copyWith(
                      color:
                          isRedAmount
                              ? Colors.red
                              : isGreenAmount
                              ? Colors.green
                              : null,
                    )
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
