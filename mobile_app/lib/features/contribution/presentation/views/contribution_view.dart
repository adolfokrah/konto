import 'package:Hoga/route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
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
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:Hoga/core/di/service_locator.dart';
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

  static Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'completed':
        return const Color(0xFF22C55E);
      case 'failed':
        return AppColors.errorRed;
      case 'pending':
        return AppColors.warningOrange;
      case 'awaiting-approval':
        return AppColors.warningOrange;
      default:
        return Colors.grey;
    }
  }

  static Widget _buildTag(BuildContext context, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: AppTextStyles.titleMediumS.copyWith(
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  static void _showApprovalSheet(
    BuildContext context,
    String transactionId,
    String jarName,
  ) {
    final repo = getIt<ContributionRepository>();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        final isDark = Theme.of(sheetContext).brightness == Brightness.dark;
        bool isLoading = false;
        return StatefulBuilder(
          builder: (context, setState) {
            return Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingXs,
              ),
              decoration: BoxDecoration(
                color:
                    isDark
                        ? Theme.of(context).colorScheme.surface
                        : Theme.of(context).colorScheme.onPrimary,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppRadius.radiusM),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const DragHandle(),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.spacingXs,
                    ),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Payout Approval',
                        style: AppTextStyles.titleMediumLg,
                      ),
                    ),
                  ),
                  if (isLoading)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.spacingL,
                      ),
                      child: CircularProgressIndicator(
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    )
                  else ...[
                    AppCard(
                      variant: CardVariant.secondary,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.spacingXs,
                        vertical: AppSpacing.spacingXs,
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(0),
                        leading: CircleAvatar(
                          radius: 25,
                          backgroundColor:
                              Theme.of(context).colorScheme.surface,
                          child: Icon(
                            Icons.check_circle_outline,
                            color: Colors.green,
                          ),
                        ),
                        title: Text(
                          'Approve',
                          style: AppTextStyles.titleMediumS,
                        ),
                        onTap: () async {
                          setState(() => isLoading = true);
                          final result = await repo.approveRejectPayout(
                            transactionId: transactionId,
                            action: 'approved',
                          );
                          if (!context.mounted) return;
                          Navigator.pop(context);
                          Navigator.pop(context);
                          AppSnackBar.show(
                            context,
                            message: result['message'] ?? 'Done',
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: AppSpacing.spacingS),
                    AppCard(
                      variant: CardVariant.secondary,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.spacingXs,
                        vertical: AppSpacing.spacingXs,
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(0),
                        leading: CircleAvatar(
                          radius: 25,
                          backgroundColor:
                              Theme.of(context).colorScheme.surface,
                          child: Icon(
                            Icons.cancel_outlined,
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                        title: Text(
                          'Reject',
                          style: AppTextStyles.titleMediumS,
                        ),
                        onTap: () async {
                          setState(() => isLoading = true);
                          final result = await repo.approveRejectPayout(
                            transactionId: transactionId,
                            action: 'rejected',
                          );
                          if (!context.mounted) return;
                          Navigator.pop(context);
                          Navigator.pop(context);
                          AppSnackBar.show(
                            context,
                            message: result['message'] ?? 'Done',
                          );
                        },
                      ),
                    ),
                  ],
                  SizedBox(height: MediaQuery.of(context).padding.bottom),
                ],
              ),
            );
          },
        );
      },
    );
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
                final relatedRefunds = state.refundDocs;
                final approvalDocs = state.approvalDocs;
                final requiredApprovals = state.requiredApprovals;

                String? currentUserId;
                final authState = context.read<AuthBloc>().state;
                if (authState is AuthAuthenticated) {
                  currentUserId = authState.user.id;
                }

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
                                          contribution.contributor ?? 'Hogapay',
                                      paymentStatus: contribution.paymentStatus,
                                      viaPaymentLink:
                                          contribution.viaPaymentLink,
                                      isPayout: contribution.isPayout,
                                      isRefund: contribution.isRefund,
                                    ),
                                    title: Text(
                                      contribution.contributor ?? 'Hogapay',
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
                                        color:
                                            contribution.isRefund
                                                ? AppColors.warningOrange
                                                : null,
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
                                          trailing: _buildTag(
                                            context,
                                            PaymentStatusUtils.getPaymentStatusLabel(
                                              contribution.paymentStatus,
                                              localizations,
                                            ),
                                            _getStatusColor(
                                              contribution.paymentStatus,
                                            ),
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
                                          trailing: _buildTag(
                                            context,
                                            _getTransactionTypeLabel(
                                              contribution.type,
                                              localizations,
                                            ),
                                            contribution.isPayout
                                                ? AppColors.infoBlue
                                                : contribution.isRefund
                                                ? AppColors.warningOrange
                                                : Theme.of(
                                                  context,
                                                ).colorScheme.primary,
                                          ),
                                        ),
                                        // Only show transaction reference when available
                                        if (contribution.transactionReference !=
                                            null) ...[
                                          Padding(
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 8,
                                            ),
                                            child: Row(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.center,
                                              children: [
                                                Text(
                                                  'Transaction Ref',
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
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    contribution
                                                        .transactionReference!,
                                                    style: AppTextStyles
                                                        .titleMediumS
                                                        .copyWith(
                                                          fontFamily:
                                                              'monospace',
                                                          fontSize: 12,
                                                        ),
                                                    textAlign: TextAlign.end,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    maxLines: 1,
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                GestureDetector(
                                                  onTap: () {
                                                    Clipboard.setData(
                                                      ClipboardData(
                                                        text:
                                                            contribution
                                                                .transactionReference!,
                                                      ),
                                                    );
                                                    AppSnackBar.showSuccess(
                                                      context,
                                                      message:
                                                          'Reference copied!',
                                                    );
                                                  },
                                                  child: Icon(
                                                    Icons.copy_outlined,
                                                    size: 16,
                                                    color: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall!
                                                        .color
                                                        ?.withValues(
                                                          alpha: 0.4,
                                                        ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
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
                                            trailing: Icon(
                                              contribution.viaPaymentLink
                                                  ? Icons.check_circle
                                                  : Icons.cancel,
                                              size: 18,
                                              color:
                                                  contribution.viaPaymentLink
                                                      ? Colors.white
                                                      : AppColors.onSurfaceDark
                                                          .withValues(
                                                            alpha: 0.3,
                                                          ),
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
                                            contribution.isPayout
                                                ? localizations.accountNumber
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

                                        // Show remarks if present
                                        if (contribution.remarks != null &&
                                            contribution
                                                .remarks!
                                                .isNotEmpty) ...[
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            title: Text(
                                              'Message from contributor',
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
                                            subtitle: Text(
                                              contribution.remarks!,
                                              style: AppTextStyles.titleMediumS,
                                            ),
                                          ),
                                        ],

                                        // Show custom fields if present
                                        if (contribution.customFieldValues !=
                                                null &&
                                            contribution
                                                .customFieldValues!
                                                .isNotEmpty) ...[
                                          ...contribution.customFieldValues!
                                              .map(
                                                (field) => ListTile(
                                                  contentPadding:
                                                      EdgeInsets.zero,
                                                  dense: true,
                                                  title: Text(
                                                    field['label'] as String? ??
                                                        '',
                                                    style: AppTextStyles
                                                        .titleMediumS
                                                        .copyWith(
                                                          color: Theme.of(
                                                            context,
                                                          )
                                                              .textTheme
                                                              .bodySmall!
                                                              .color
                                                              ?.withValues(
                                                                alpha: 0.5,
                                                              ),
                                                        ),
                                                  ),
                                                  trailing: Text(
                                                    field['value'] is bool
                                                        ? (field['value'] as bool
                                                            ? 'Yes'
                                                            : 'No')
                                                        : '${field['value'] ?? ''}',
                                                    style: AppTextStyles
                                                        .titleMediumS,
                                                  ),
                                                ),
                                              ),
                                        ],

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
                                                          .isNotEmpty ??
                                                      false)) {
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
                                                          .isNotEmpty ??
                                                      false)
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
                                                                    .isNotEmpty ??
                                                                false)
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
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Padding(
                                            padding: const EdgeInsets.only(
                                              top: AppSpacing.spacingS,
                                            ),
                                            child: Text(
                                              localizations.typeRefund,
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
                                          ),
                                          ...relatedRefunds.map((refund) {
                                            final refundStatus =
                                                refund['status'] as String? ??
                                                'pending';
                                            final refundAmount =
                                                (refund['amount'] as num?)
                                                    ?.abs() ??
                                                0;
                                            final refundName =
                                                refund['accountName']
                                                    as String? ??
                                                'Refund';
                                            final refundDate =
                                                refund['createdAt'] as String?;

                                            // Map refund status to payment status labels
                                            final statusLabel =
                                                switch (refundStatus) {
                                                  'pending' =>
                                                    localizations.statusPending,
                                                  'in-progress' =>
                                                    localizations.statusPending,
                                                  'completed' =>
                                                    localizations
                                                        .statusCompleted,
                                                  'failed' =>
                                                    localizations.statusFailed,
                                                  _ => refundStatus,
                                                };

                                            return ListTile(
                                              contentPadding: EdgeInsets.zero,
                                              dense: true,
                                              leading:
                                                  ContributorAvatarSizes.small(
                                                    backgroundColor:
                                                        AppColors.warningOrange,
                                                    contributorName: refundName,
                                                    paymentStatus:
                                                        refundStatus ==
                                                                'completed'
                                                            ? 'completed'
                                                            : refundStatus ==
                                                                'failed'
                                                            ? 'failed'
                                                            : 'pending',
                                                    viaPaymentLink: false,
                                                    isPayout: false,
                                                    isRefund: true,
                                                  ),
                                              title: Text(
                                                '${CurrencyUtils.getCurrencySymbol(jarData.currency)} $refundAmount',
                                                style: AppTextStyles
                                                    .titleMediumS
                                                    .copyWith(
                                                      color:
                                                          AppColors
                                                              .warningOrange,
                                                    ),
                                              ),
                                              subtitle: Text(
                                                refundDate != null
                                                    ? AppDateUtils.formatTimestampSafe(
                                                      DateTime.tryParse(
                                                        refundDate,
                                                      ),
                                                      localizations,
                                                    )
                                                    : '',
                                                style: AppTextStyles
                                                    .titleMediumS
                                                    .copyWith(
                                                      fontSize: 12,
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
                                                statusLabel,
                                                style: AppTextStyles
                                                    .titleMediumS
                                                    .copyWith(
                                                      color:
                                                          refundStatus ==
                                                                  'completed'
                                                              ? Colors.green
                                                              : refundStatus ==
                                                                  'failed'
                                                              ? Colors.red
                                                              : AppColors
                                                                  .warningOrange,
                                                    ),
                                              ),
                                            );
                                          }),
                                        ],
                                      ),
                                    ),
                                  ],
                                  // Payout Approvals
                                  if (contribution.isPayout &&
                                      (contribution.paymentStatus ==
                                              'awaiting-approval' ||
                                          approvalDocs.isNotEmpty)) ...[
                                    const SizedBox(height: AppSpacing.spacingM),
                                    AppCard(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: AppSpacing.spacingM,
                                      ),
                                      child: Column(
                                        children: [
                                          // Header row
                                          ListTile(
                                            contentPadding: EdgeInsets.zero,
                                            dense: true,
                                            title: Text(
                                              localizations.payoutApprovals,
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
                                            trailing:
                                                contribution.paymentStatus ==
                                                        'awaiting-approval'
                                                    ? _buildTag(
                                                      context,
                                                      '${approvalDocs.where((a) => a['status'] == 'approved').length} of $requiredApprovals',
                                                      AppColors.warningOrange,
                                                    )
                                                    : null,
                                          ),
                                          // Existing approval records
                                          ...approvalDocs.map((approval) {
                                            final approvalStatus =
                                                approval['status'] as String? ??
                                                'approved';
                                            final actionBy =
                                                approval['actionBy'];
                                            final actionByName =
                                                actionBy is Map
                                                    ? actionBy['fullName']
                                                            as String? ??
                                                        'Unknown'
                                                    : 'Unknown';

                                            final statusColor =
                                                switch (approvalStatus) {
                                                  'approved' => Colors.green,
                                                  'rejected' => Colors.red,
                                                  _ => AppColors.warningOrange,
                                                };

                                            final statusLabel =
                                                switch (approvalStatus) {
                                                  'approved' =>
                                                    localizations
                                                        .statusCompleted,
                                                  'rejected' =>
                                                    localizations
                                                        .statusRejected,
                                                  _ => approvalStatus,
                                                };

                                            return ListTile(
                                              contentPadding: EdgeInsets.zero,
                                              dense: true,
                                              leading:
                                                  ContributorAvatarSizes.small(
                                                    backgroundColor:
                                                        statusColor,
                                                    contributorName:
                                                        actionByName,
                                                    showStatusOverlay: false,
                                                  ),
                                              title: Text(
                                                actionByName,
                                                style:
                                                    AppTextStyles.titleMediumS,
                                              ),
                                              trailing: _buildTag(
                                                context,
                                                statusLabel,
                                                statusColor,
                                              ),
                                            );
                                          }),
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
                                  // Approve/Reject action buttons
                                  if (contribution.isPayout &&
                                      contribution.paymentStatus ==
                                          'awaiting-approval' &&
                                      currentUserId != null &&
                                      jarData.invitedCollectors != null &&
                                      jarData.invitedCollectors!.any(
                                        (ic) =>
                                            ic.collector.id == currentUserId &&
                                            ic.role == 'admin' &&
                                            ic.status == 'accepted',
                                      ) &&
                                      !approvalDocs.any((a) {
                                        final actionBy = a['actionBy'];
                                        final actionById =
                                            actionBy is Map
                                                ? actionBy['id']
                                                : actionBy;
                                        return actionById == currentUserId;
                                      })) ...[
                                    const SizedBox(height: AppSpacing.spacingM),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: GestureDetector(
                                            onTap:
                                                () => _showApprovalSheet(
                                                  context,
                                                  contribution.id,
                                                  contribution.jar.name,
                                                ),
                                            child: AppCard(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical:
                                                        AppSpacing.spacingS,
                                                  ),
                                              child: Center(
                                                child: Text(
                                                  'Approve / Reject',
                                                  style: AppTextStyles
                                                      .titleMediumS
                                                      .copyWith(
                                                        color:
                                                            AppColors
                                                                .warningOrange,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
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
