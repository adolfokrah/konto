import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/jars/presentation/widgets/payment_method_contribution_item.dart';
import 'package:Hoga/l10n/app_localizations.dart';

/// "Balance explained" sheet: share per payment method, then how the
/// available amount relates to what was collected and transferred.
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
          return const JarSheetFrame(
            children: [
              DsSkeleton(
                onWhite: true,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    DsSkeletonLine(width: 160, height: 18),
                    SizedBox(height: 14),
                    DsSkeletonLine(height: 11),
                    SizedBox(height: 6),
                    DsSkeletonLine(width: 220, height: 11),
                    SizedBox(height: 20),
                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          DsSkeletonLine(width: 110, height: 11),
                          DsSkeletonLine(width: 80, height: 13),
                        ],
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          DsSkeletonLine(width: 90, height: 11),
                          DsSkeletonLine(width: 80, height: 13),
                        ],
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          DsSkeletonLine(width: 130, height: 11),
                          DsSkeletonLine(width: 80, height: 13),
                        ],
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          DsSkeletonLine(width: 100, height: 11),
                          DsSkeletonLine(width: 80, height: 13),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        }

        final jarData = state.jarData;
        final b = jarData.balanceBreakDown;
        final cur = jarData.currency;
        String money(double v) => CurrencyUtils.formatAmount(v, cur);

        return ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.9,
          ),
          child: JarSheetFrame(
            title: localizations.balanceBreakdown,
            children: [
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        localizations.balanceBreakdownDescription,
                        style: DsText.small,
                      ),
                      const SizedBox(height: 14),
                      JarStackedBar(
                        parts: [
                          (b.mobileMoney.totalAmount, AppColors.mtnYellow),
                          (b.card.totalAmount, AppColors.info),
                          (b.cash.totalAmount, AppColors.positive),
                        ],
                      ),
                      const SizedBox(height: 10),
                      JarFillList(
                        children: [
                          PaymentMethodContributionItem(
                            title: localizations.mobileMoney,
                            subtitle: localizations.contributionsCount(
                              jarData.mobileMoneyContributionCount,
                            ),
                            amount: b.mobileMoney.totalAmount,
                            currency: cur,
                            icon: Icons.phone_android_rounded,
                            color: AppColors.mtnYellow,
                          ),
                          PaymentMethodContributionItem(
                            title: localizations.cardPayment,
                            subtitle: localizations.contributionsCount(
                              b.card.totalCount,
                            ),
                            amount: b.card.totalAmount,
                            currency: cur,
                            icon: Icons.credit_card_rounded,
                            color: AppColors.info,
                          ),
                          PaymentMethodContributionItem(
                            title: localizations.cash,
                            subtitle: localizations.contributionsCount(
                              jarData.cashContributionCount,
                            ),
                            amount: b.cash.totalAmount,
                            currency: cur,
                            icon: Icons.payments_outlined,
                            color: AppColors.positive,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      JarFillList(
                        children: [
                          DsKeyValue(
                            localizations.totalContributions,
                            money(b.totalContributedAmount),
                          ),
                          DsKeyValue(
                            localizations.totalTransfers,
                            '− ${money(b.totalTransfers)}',
                          ),
                          DsKeyValue(
                            localizations.upcomingBalance,
                            money(b.upcomingBalance),
                            valueColor: AppColors.pending,
                          ),
                          DsKeyValue(
                            localizations.totalWeOweYou,
                            money(b.totalAmountTobeTransferred),
                            strong: true,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(localizations.transfersNote, style: DsText.caption),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
