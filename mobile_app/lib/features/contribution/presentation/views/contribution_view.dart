import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/currency_utils.dart';
import 'package:konto/core/utils/date_utils.dart';
import 'package:konto/core/utils/payment_method_utils.dart';
import 'package:konto/core/utils/payment_status_utils.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/contributor_avatar.dart';
import 'package:konto/core/widgets/drag_handle.dart';
import 'package:konto/core/widgets/snacbar_message.dart';
import 'package:konto/features/contribution/logic/bloc/fetch_contribution_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:konto/l10n/app_localizations.dart';

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
                return const Center(child: CircularProgressIndicator());
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
                                      '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${contribution.amountContributed}',
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

                                  // Payment method as a ListTile
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
                                          title: Text(
                                            localizations.charges,
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
                                            '${CurrencyUtils.getCurrencySymbol(jarData.currency)} ${contribution.charges ?? 0.00}',
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
                                            trailing: CupertinoSwitch(
                                              value:
                                                  contribution.viaPaymentLink ??
                                                  false,
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
                                        if (contribution.contributor != null)
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
                                              style: AppTextStyles.titleMediumS
                                                  .copyWith(
                                                    decoration:
                                                        contribution.paymentStatus ==
                                                                'cancelled'
                                                            ? TextDecoration
                                                                .lineThrough
                                                            : null,
                                                    decorationThickness:
                                                        contribution.paymentStatus ==
                                                                'cancelled'
                                                            ? 2.0
                                                            : null,
                                                  ),
                                              textAlign: TextAlign.end,
                                            ),
                                          ),
                                        ListTile(
                                          contentPadding: EdgeInsets.zero,
                                          title: Text(
                                            contribution.contributor == null
                                                ? localizations.transferredTo
                                                : localizations
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

                                  if (contribution.contributor != null) ...[
                                    const SizedBox(height: AppSpacing.spacingM),
                                    AppCard(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppSpacing.spacingM,
                                      ),
                                      child: Column(
                                        children: [
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            onTap: () {
                                              AppSnackBar.show(
                                                context,
                                                message:
                                                    localizations.comingSoon,
                                              );
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
                                                      ?.fullName ??
                                                  localizations.unknown,
                                              style: AppTextStyles.titleMediumS
                                                  .copyWith(
                                                    color: Colors.blueAccent,
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
