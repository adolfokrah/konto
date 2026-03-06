import 'package:Hoga/core/widgets/custom_cupertino_switch.dart';
import 'package:Hoga/route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/utils/date_utils.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/core/utils/payment_status_utils.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/contribution/data/models/contribution_model.dart';
import 'package:Hoga/features/contribution/logic/bloc/fetch_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:Hoga/core/constants/app_links.dart';
import 'package:go_router/go_router.dart';

class ContributionView extends StatelessWidget {
  const ContributionView({super.key});

  static String _getTransactionTypeLabel(
    ContributionType type,
    AppLocalizations localizations,
  ) {
    switch (type) {
      case ContributionType.contribution:
        return localizations.typeContribution;
      case ContributionType.payout:
        return localizations.typePayout;
      case ContributionType.refund:
        return localizations.typeRefund;
    }
  }

  static void show(BuildContext context, String contributionId) {
    context.read<FetchContributionBloc>().add(
      FetchContributionById(contributionId),
    );
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const ContributionView(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.9,
        maxChildSize: 0.9,
        expand: false,
        snap: true,
        builder: (context, scrollController) {
          return BlocBuilder<FetchContributionBloc, FetchContributionState>(
            builder: (context, state) {
              final localizations = AppLocalizations.of(context)!;
              if (state is FetchContributionLoading) {
                return Center(
                  child: CircularProgressIndicator(
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                );
              } else if (state is FetchContributionError) {
                return Center(
                  child: Text(localizations.failedToFetchContribution),
                );
              } else if (state is FetchContributionLoaded) {
                final contribution = state.contribution;
                final relatedRefunds = state.relatedRefunds;
                return Column(
                  children: [
                    // Handle bar
                    DragHandle(),
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    // Content
                    Expanded(
                      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
                        builder: (context, state) {
                          if (state is JarSummaryLoaded) {
                            final jarData = state.jarData;
                            final localizations = AppLocalizations.of(context)!;
                            return SingleChildScrollView(
                              controller: scrollController,
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Main contribution info as a ListTile
                                  ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    dense: true,
                                    leading: ContributorAvatarSizes.large(
                                      backgroundColor:
                                          Theme.of(context).colorScheme.primary,
                                      contributorName:
                                          contribution.contributor ?? 'Konto',
                                      paymentStatus: contribution.paymentStatus,
                                      viaPaymentLink:
                                          contribution.viaPaymentLink,
                                      isPayout: contribution.isPayout,
                                      isRefund: contribution.isRefund,
                                    ),
                                    title: Text(
                                      contribution.contributor ?? 'Konto',
                                      style: AppTextStyles.titleMedium,
                                    ),
                                    subtitle: Text(
                                      AppDateUtils.formatTimestampSafe(
                                        contribution.createdAt,
                                        localizations,
                                      ),
                                      style: AppTextStyles.titleMediumS
                                          .copyWith(
                                            color: Theme.of(context)
                                                .textTheme
                                                .bodySmall!
                                                .color
                                                ?.withValues(alpha: 0.5),
                                          ),
                                    ),
                                    trailing: Text(
                                      '${contribution.isTransfer ? '- ' : ''}${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${contribution.amountContributed.abs()}',
                                      style: AppTextStyles.titleBoldXl.copyWith(
                                        color: contribution.isRefund ? AppColors.warningOrange : null,
                                        decoration:
                                            contribution.paymentStatus ==
                                                    'failed'
                                                ? TextDecoration.lineThrough
                                                : null,
                                        decorationThickness:
                                            contribution.paymentStatus ==
                                                    'failed'
                                                ? 2.0
                                                : null,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.spacingM),
                                  AppCard(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.spacingM,
                                    ),
                                    child: Column(
                                      children: [
                                        ListTile(
                                          contentPadding: EdgeInsets.zero,
                                          dense: true,
                                          title: Text(
                                            localizations.paymentMethod,
                                            style: AppTextStyles.titleMediumS
                                                .copyWith(
                                                  color: Theme.of(context)
                                                      .textTheme
                                                      .bodySmall!
                                                      .color
                                                      ?.withValues(alpha: 0.5),
                                                ),
                                          ),
                                          trailing: Text(
                                            PaymentMethodUtils.getPaymentMethodLabel(
                                              contribution.paymentMethod,
                                              localizations,
                                            ),
                                            style: AppTextStyles.titleMediumS,
                                          ),
                                        ),
                                        ListTile(
                                          contentPadding: EdgeInsets.zero,
                                          title: Text(
                                            localizations.status,
                                            style: AppTextStyles.titleMediumS
                                                .copyWith(
                                                  color: Theme.of(context)
                                                      .textTheme
                                                      .bodySmall!
                                                      .color
                                                      ?.withValues(alpha: 0.5),
                                                ),
                                          ),
                                          trailing: Text(
                                            PaymentStatusUtils.getPaymentStatusLabel(
                                              contribution.paymentStatus,
                                              localizations,
                                            ),
                                            style: AppTextStyles.titleMediumS,
                                          ),
                                        ),
                                        ListTile(
                                          contentPadding: EdgeInsets.zero,
                                          dense: true,
                                          title: Text(
                                            localizations.transactionType,
                                            style: AppTextStyles.titleMediumS
                                                .copyWith(
                                                  color: Theme.of(context)
                                                      .textTheme
                                                      .bodySmall!
                                                      .color
                                                      ?.withValues(alpha: 0.5),
                                                ),
                                          ),
                                          trailing: Text(
                                            _getTransactionTypeLabel(
                                              contribution.type,
                                              localizations,
                                            ),
                                            style: AppTextStyles.titleMediumS.copyWith(
                                              color: contribution.isRefund
                                                  ? AppColors.warningOrange
                                                  : null,
                                            ),
                                          ),
                                        ),
                                        // Only show "Via Payment Link" when viaPaymentLink is true
                                        if (contribution.viaPaymentLink ==
                                            true) ...[
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            dense: true,
                                            title: Text(
                                              localizations.viaPaymentLink,
                                              style: AppTextStyles.titleMediumS
                                                  .copyWith(
                                                    color: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall!
                                                        .color
                                                        ?.withValues(
                                                          alpha: 0.5,
                                                        ),
                                                  ),
                                            ),
                                            trailing: CustomCupertinoSwitch(
                                              value:
                                                  contribution.viaPaymentLink,
                                              onChanged: (value) {
                                                // Handle switch change
                                              },
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),

                                  const SizedBox(height: AppSpacing.spacingM),
                                  // Payment method as a ListTile
                                  AppCard(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.spacingM,
                                    ),
                                    child: Column(
                                      children: [
                                        if (contribution.type.value ==
                                            ContributionType.contribution.value)
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            dense: true,
                                            title: Text(
                                              localizations.contributor,
                                              style: AppTextStyles.titleMediumS
                                                  .copyWith(
                                                    color: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall!
                                                        .color
                                                        ?.withValues(
                                                          alpha: 0.5,
                                                        ),
                                                  ),
                                            ),
                                            trailing: Text(
                                              contribution.contributor ??
                                                  localizations.unknown,
                                              textAlign: TextAlign.end,
                                            ),
                                          ),
                                        ListTile(
                                          contentPadding: EdgeInsets.zero,
                                          title: Text(
                                            localizations
                                                .contributorPhoneNumber,
                                            style: AppTextStyles.titleMediumS
                                                .copyWith(
                                                  color: Theme.of(context)
                                                      .textTheme
                                                      .bodySmall!
                                                      .color
                                                      ?.withValues(alpha: 0.5),
                                                ),
                                          ),
                                          trailing: Text(
                                            contribution
                                                    .contributorPhoneNumber ??
                                                localizations.unknown,
                                            style: AppTextStyles.titleMediumS,
                                            textAlign: TextAlign.end,
                                          ),
                                        ),

                                        // Only show account number if it exists (for bank transfers)
                                        if (contribution.accountNumber !=
                                            null) ...[
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            title: Text(
                                              localizations.accountNumber,
                                              style: AppTextStyles.titleMediumS
                                                  .copyWith(
                                                    color: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall!
                                                        .color
                                                        ?.withValues(
                                                          alpha: 0.5,
                                                        ),
                                                  ),
                                            ),
                                            trailing: Text(
                                              contribution.accountNumber!,
                                              style: AppTextStyles.titleMediumS,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),

                                  // ignore: unrelated_type_equality_checks
                                  if (contribution.type !=
                                      ContributionType.payout) ...[
                                    const SizedBox(height: AppSpacing.spacingM),
                                    AppCard(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppSpacing.spacingM,
                                      ),
                                      child: Column(
                                        children: [
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            onTap: () async {
                                              // Check if collector has valid data (not "Unknown User")
                                              if (contribution
                                                          .collector
                                                          ?.fullName !=
                                                      'Unknown User' &&
                                                  (contribution
                                                      .collector
                                                      ?.id
                                                      .isNotEmpty ?? false)) {
                                                // Store references before popping context
                                                final filterBloc =
                                                    context
                                                        .read<
                                                          FilterContributionsBloc
                                                        >();
                                                final collectorId =
                                                    contribution.collector?.id;

                                                if (collectorId == null) return;

                                                // Clear existing filters and set collector filter
                                                filterBloc.add(
                                                  ClearAllFilters(),
                                                );

                                                // Wait a frame for the clear to process
                                                await Future.delayed(
                                                  const Duration(
                                                    milliseconds: 100,
                                                  ),
                                                );

                                                filterBloc.add(
                                                  ToggleCollector(collectorId),
                                                );

                                                // Wait for the filter to be set
                                                await Future.delayed(
                                                  const Duration(
                                                    milliseconds: 100,
                                                  ),
                                                );

                                                if (!context.mounted) return;

                                                // Close current modal
                                                Navigator.of(context).pop();

                                                // Navigate to contributions list
                                                context.push(
                                                  AppRoutes.contributionsList,
                                                );
                                              } else {
                                                AppSnackBar.show(
                                                  context,
                                                  message:
                                                      localizations.unknown,
                                                );
                                              }
                                            },
                                            dense: true,
                                            title: Text(
                                              localizations.collector,
                                              style: AppTextStyles.titleMediumS
                                                  .copyWith(
                                                    color: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall!
                                                        .color
                                                        ?.withValues(
                                                          alpha: 0.5,
                                                        ),
                                                  ),
                                            ),
                                            trailing: Text(
                                              (contribution
                                                          .collector
                                                          ?.fullName
                                                          .isNotEmpty ?? false)
                                                  ? contribution
                                                      .collector!
                                                      .fullName
                                                  : localizations.unknown,
                                              style: AppTextStyles.titleMediumS.copyWith(
                                                color:
                                                    contribution
                                                                    .collector
                                                                    ?.fullName !=
                                                                'Unknown User' &&
                                                            (contribution
                                                                .collector
                                                                ?.id
                                                                .isNotEmpty ?? false)
                                                        ? Colors.blueAccent
                                                        : Theme.of(context)
                                                            .textTheme
                                                            .bodySmall!
                                                            .color
                                                            ?.withValues(
                                                              alpha: 0.5,
                                                            ),
                                              ),
                                              textAlign: TextAlign.end,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                  // Related Refunds
                                  if (relatedRefunds.isNotEmpty) ...[
                                    const SizedBox(height: AppSpacing.spacingM),
                                    AppCard(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppSpacing.spacingM,
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Padding(
                                            padding: const EdgeInsets.only(
                                              top: AppSpacing.spacingS,
                                            ),
                                            child: Text(
                                              localizations.typeRefund,
                                              style: AppTextStyles.titleMediumS.copyWith(
                                                color: Theme.of(context)
                                                    .textTheme
                                                    .bodySmall!
                                                    .color
                                                    ?.withValues(alpha: 0.5),
                                              ),
                                            ),
                                          ),
                                          ...relatedRefunds.map(
                                            (refund) => ListTile(
                                              contentPadding: EdgeInsets.zero,
                                              dense: true,
                                              leading: ContributorAvatarSizes.small(
                                                backgroundColor: AppColors.warningOrange,
                                                contributorName: refund.contributor ?? 'Refund',
                                                paymentStatus: refund.paymentStatus,
                                                viaPaymentLink: false,
                                                isPayout: false,
                                                isRefund: true,
                                              ),
                                              title: Text(
                                                '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${refund.amountContributed.abs()}',
                                                style: AppTextStyles.titleMediumS.copyWith(
                                                  color: AppColors.warningOrange,
                                                ),
                                              ),
                                              subtitle: Text(
                                                AppDateUtils.formatTimestampSafe(
                                                  refund.createdAt,
                                                  localizations,
                                                ),
                                                style: AppTextStyles.titleMediumS.copyWith(
                                                  fontSize: 12,
                                                  color: Theme.of(context)
                                                      .textTheme
                                                      .bodySmall!
                                                      .color
                                                      ?.withValues(alpha: 0.5),
                                                ),
                                              ),
                                              trailing: Text(
                                                PaymentStatusUtils.getPaymentStatusLabel(
                                                  refund.paymentStatus,
                                                  localizations,
                                                ),
                                                style: AppTextStyles.titleMediumS.copyWith(
                                                  color: refund.isCompleted
                                                      ? Colors.green
                                                      : refund.isFailed
                                                          ? Colors.red
                                                          : AppColors.warningOrange,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: AppSpacing.spacingM),
                                  AppCard(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.spacingM,
                                    ),
                                    child: Column(
                                      children: [
                                        ListTile(
                                          contentPadding: EdgeInsets.zero,
                                          dense: true,
                                          onTap: () {
                                            launchUrl(
                                              Uri.parse(AppLinks.support),
                                              mode: LaunchMode.inAppBrowserView,
                                            );
                                          },
                                          title: Text(
                                            localizations.help,
                                            style: AppTextStyles.titleMediumS
                                                .copyWith(
                                                  color: Theme.of(context)
                                                      .textTheme
                                                      .bodySmall!
                                                      .color
                                                      ?.withValues(alpha: 0.5),
                                                ),
                                          ),
                                          trailing: const Icon(
                                            Icons.chevron_right,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }
                          return Container();
                        },
                      ),
                    ),
                  ],
                );
              }
              return Container();
            },
          );
        },
      ),
    );
  }
}
