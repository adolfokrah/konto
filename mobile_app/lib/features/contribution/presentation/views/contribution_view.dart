import 'package:Hoga/core/widgets/custom_cupertino_switch.dart';
import 'package:Hoga/route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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

class ContributionView extends StatelessWidget {
  const ContributionView({super.key});

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
                // Display contribution details here
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
                                      '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${contribution.amountContributed.abs()}',
                                      style: AppTextStyles.titleBoldXl.copyWith(
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

                                  if (contribution.chargesBreakdown != null &&
                                      contribution
                                          .chargesBreakdown!
                                          .hasCompleteBreakdown) ...[
                                    const SizedBox(height: AppSpacing.spacingM),

                                    AppCard(
                                      isCollapsible: true,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppSpacing.spacingM,
                                        vertical: AppSpacing.spacingXs,
                                      ),
                                      title: Text(
                                        localizations.chargeBreakdown,
                                        style: AppTextStyles.titleMediumS
                                            .copyWith(
                                              color: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall!
                                                  .color
                                                  ?.withValues(alpha: 0.5),
                                            ),
                                      ),
                                      child: Column(
                                        children: [
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            title: Text(
                                              localizations.contributorPaid,
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
                                              '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${contribution.chargesBreakdown!.amountPaidByContributor!.toStringAsFixed(2)}',
                                              style: AppTextStyles.titleMediumS,
                                            ),
                                          ),
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            title: Text(
                                              localizations.platformCharge,
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
                                              '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${contribution.chargesBreakdown!.platformCharge!.toStringAsFixed(2)}',
                                              style: AppTextStyles.titleMediumS,
                                            ),
                                          ),
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            title: Text(
                                              localizations.paymentProcessing,
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
                                              '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${contribution.chargesBreakdown!.paystackCharge!.toStringAsFixed(2)}',
                                              style: AppTextStyles.titleMediumS,
                                            ),
                                          ),
                                          if (contribution
                                                  .chargesBreakdown!
                                                  .paystackTransferFeeMomo !=
                                              null)
                                            ListTile(
                                              contentPadding: EdgeInsets.zero,
                                              title: Text(
                                                localizations.transferFee,
                                                style: AppTextStyles
                                                    .titleMediumS
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
                                                '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${contribution.chargesBreakdown!.paystackTransferFeeMomo!.toStringAsFixed(2)}',
                                                style:
                                                    AppTextStyles.titleMediumS,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
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
                                      ContributionType.transfer) ...[
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
                                                          .fullName !=
                                                      'Unknown User' &&
                                                  contribution
                                                      .collector
                                                      .id
                                                      .isNotEmpty) {
                                                // Store references before popping context
                                                final filterBloc =
                                                    context
                                                        .read<
                                                          FilterContributionsBloc
                                                        >();
                                                final collectorId =
                                                    contribution.collector.id;
                                                final navigator = Navigator.of(
                                                  context,
                                                );

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

                                                // Debug: Check the filter state
                                                final filterState =
                                                    filterBloc.state;
                                                if (filterState
                                                    is FilterContributionsLoaded) {
                                                  print(
                                                    '🔍 Filter state after setting: collectors=${filterState.selectedCollectors}, hasFilters=${filterState.hasFilters}',
                                                  );
                                                }

                                                // Close current modal
                                                navigator.pop();

                                                // Navigate to contributions list
                                                navigator.pushNamed(
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
                                              contribution
                                                      .collector
                                                      .fullName
                                                      .isNotEmpty
                                                  ? contribution
                                                      .collector
                                                      .fullName
                                                  : localizations.unknown,
                                              style: AppTextStyles.titleMediumS.copyWith(
                                                color:
                                                    contribution
                                                                    .collector
                                                                    .fullName !=
                                                                'Unknown User' &&
                                                            contribution
                                                                .collector
                                                                .id
                                                                .isNotEmpty
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
