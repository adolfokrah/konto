import 'package:Hoga/route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/utils/date_utils.dart';
import 'package:Hoga/core/utils/payment_method_utils.dart';
import 'package:Hoga/core/utils/payment_status_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/contribution/data/models/contribution_model.dart';
import 'package:Hoga/features/contribution/logic/bloc/fetch_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart'
    show JarSummaryModel;
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:Hoga/core/constants/app_links.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:go_router/go_router.dart';

/// Payment detail sheet: amount header, receipt rows, answers, refunds and,
/// for payouts, the approvals with Approve / Reject.
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

  static String _signedAmount(ContributionModel c) {
    final a = c.amountContributed.abs();
    final cents = ((a * 100).round() % 100).toString().padLeft(2, '0');
    return '${c.isTransfer ? '−' : '+'}${DsMoney.group(a)}.$cents';
  }

  static void _shareReceipt(
    BuildContext context,
    ContributionModel c,
    JarSummaryModel jar,
    AppLocalizations localizations,
  ) {
    final method = PaymentMethodUtils.getPaymentMethodLabel(
      c.paymentMethod,
      localizations,
    );
    final lines = [
      'Hogapay receipt',
      '${_getTransactionTypeLabel(c.type, localizations)}: ${CurrencyUtils.formatAmount(c.amountContributed, jar.currency)}',
      if (c.contributor != null) 'From: ${c.contributor}',
      'To jar: ${jar.name}',
      'Paid with: $method${c.contributorPhoneNumber != null ? ' · ${c.contributorPhoneNumber}' : ''}',
      'Date: ${AppDateUtils.formatExactDateTime(c.createdAt, localizations)}',
      if (c.transactionReference != null)
        'Reference: ${c.transactionReference}',
      '${localizations.status}: ${PaymentStatusUtils.getPaymentStatusLabel(c.paymentStatus, localizations)}',
      if (jar.thankYouMessage != null && jar.thankYouMessage!.isNotEmpty) ...[
        '',
        jar.thankYouMessage!,
      ],
    ];
    final box = context.findRenderObject() as RenderBox?;
    Share.share(
      lines.join('\n'),
      sharePositionOrigin:
          box != null ? box.localToGlobal(Offset.zero) & box.size : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.cream,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
                return const Center(
                  child: CircularProgressIndicator(color: AppColors.navy),
                );
              } else if (state is FetchContributionError) {
                return Center(
                  child: DsEmptyState(
                    icon: Icons.error_outline_rounded,
                    tone: DsTone.negative,
                    title: localizations.failedToFetchContribution,
                    message: '',
                  ),
                );
              } else if (state is FetchContributionLoaded) {
                return BlocBuilder<JarSummaryBloc, JarSummaryState>(
                  builder: (context, jarState) {
                    if (jarState is! JarSummaryLoaded) return Container();
                    return _ContributionDetail(
                      state: state,
                      jarData: jarState.jarData,
                      scrollController: scrollController,
                    );
                  },
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

class _ContributionDetail extends StatelessWidget {
  final FetchContributionLoaded state;
  final JarSummaryModel jarData;
  final ScrollController scrollController;

  const _ContributionDetail({
    required this.state,
    required this.jarData,
    required this.scrollController,
  });

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final contribution = state.contribution;
    final relatedRefunds = state.refundDocs;
    final approvalDocs = state.approvalDocs;
    final requiredApprovals = state.requiredApprovals;

    String? currentUserId;
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      currentUserId = authState.user.id;
    }

    final status = contribution.paymentStatus.toLowerCase();
    final failed = status == 'failed';
    final refunded = relatedRefunds.any((r) => r['status'] == 'completed');
    final hasValidCollector =
        contribution.collector?.fullName != 'Unknown User' &&
        (contribution.collector?.id.isNotEmpty ?? false);

    final canApprove =
        contribution.isPayout &&
        contribution.paymentStatus == 'awaiting-approval' &&
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
          final actionById = actionBy is Map ? actionBy['id'] : actionBy;
          return actionById == currentUserId;
        });

    final methodLabel = PaymentMethodUtils.getPaymentMethodLabel(
      contribution.paymentMethod,
      localizations,
    );
    final net = networkFromPhone(contribution.contributorPhoneNumber);
    final methodValue = [
      if (contribution.isMobileMoney && net != null)
        switch (net) {
          DsNetwork.mtn => 'MTN MoMo',
          DsNetwork.telecel => 'Telecel Cash',
          DsNetwork.airtelTigo => 'AirtelTigo Money',
        }
      else
        methodLabel,
      if (!contribution.isPayout &&
          contribution.contributorPhoneNumber != null &&
          contribution.contributorPhoneNumber!.isNotEmpty)
        contribution.contributorPhoneNumber!,
    ].join(' · ');

    final answers = <Widget>[
      ...?contribution.customFieldValues?.map(
        (field) => DsKeyValue(
          field['label'] as String? ?? '',
          field['value'] is bool
              ? (field['value'] as bool ? 'Yes' : 'No')
              : '${field['value'] ?? ''}',
        ),
      ),
      if (contribution.remarks != null && contribution.remarks!.isNotEmpty)
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Message from contributor',
                style: DsText.small.copyWith(color: AppColors.muted),
              ),
              const SizedBox(height: 4),
              Text(
                '"${contribution.remarks!}"',
                style: DsText.small.copyWith(color: AppColors.navy),
              ),
            ],
          ),
        ),
    ];

    return Column(
      children: [
        CollectSheet.grab(),
        // Header buttons
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              CollectBoxButton(
                icon: Icons.close_rounded,
                onTap: () => Navigator.pop(context),
              ),
              const Spacer(),
              if (!contribution.isPayout)
                Builder(
                  builder:
                      (btnContext) => CollectBoxButton(
                        icon: Icons.ios_share_rounded,
                        onTap:
                            () => ContributionView._shareReceipt(
                              btnContext,
                              contribution,
                              jarData,
                              localizations,
                            ),
                      ),
                ),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            controller: scrollController,
            padding: EdgeInsets.fromLTRB(
              16,
              6,
              16,
              MediaQuery.of(context).padding.bottom + 24,
            ),
            children: [
              // Amount header
              Column(
                children: [
                  PaymentMethodTile(
                    paymentMethod: contribution.paymentMethod,
                    phone: contribution.contributorPhoneNumber,
                    isPayout: contribution.isPayout,
                    isRefund: contribution.isRefund,
                    size: 52,
                  ),
                  const SizedBox(height: 10),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      ContributionView._signedAmount(contribution),
                      style: TextStyle(
                        fontFamily: 'Chillax',
                        fontWeight: FontWeight.w600,
                        fontSize: 40,
                        letterSpacing: -0.4,
                        color:
                            (failed || refunded)
                                ? AppColors.muted
                                : AppColors.navy,
                        decoration:
                            (failed || refunded)
                                ? TextDecoration.lineThrough
                                : null,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    contribution.contributor ?? 'Hogapay',
                    style: DsText.small,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  if (refunded)
                    DsTag(localizations.typeRefund, tone: DsTone.info)
                  else if (contribution.isPayout &&
                      contribution.paymentStatus == 'awaiting-approval')
                    DsTag(
                      '${approvalDocs.where((a) => a['status'] == 'approved').length} of $requiredApprovals approvals',
                      tone: DsTone.pending,
                    )
                  else
                    paymentStatusTag(
                      contribution.paymentStatus,
                      PaymentStatusUtils.getPaymentStatusLabel(
                        contribution.paymentStatus,
                        localizations,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 18),

              // Receipt rows
              DsListCard(
                children: [
                  DsKeyValue(localizations.jar, contribution.jar.name),
                  DsKeyValue(
                    localizations.transactionType,
                    ContributionView._getTransactionTypeLabel(
                      contribution.type,
                      localizations,
                    ),
                  ),
                  DsKeyValue(localizations.paymentMethod, methodValue),
                  if (contribution.isPayout)
                    DsKeyValue(
                      localizations.accountNumber,
                      contribution.contributorPhoneNumber ??
                          localizations.unknown,
                    )
                  else if (contribution.accountNumber != null)
                    DsKeyValue(
                      localizations.accountNumber,
                      contribution.accountNumber!,
                    ),
                  if (contribution.type.value ==
                      ContributionType.contribution.value)
                    DsKeyValue(
                      localizations.contributor,
                      contribution.contributor ?? localizations.unknown,
                    ),
                  if (contribution.charges != null &&
                      contribution.charges! > 0)
                    DsKeyValue(
                      'Fee',
                      CurrencyUtils.formatAmount(
                        contribution.charges!,
                        jarData.currency,
                      ),
                    ),
                  if (contribution.type != ContributionType.payout)
                    _TapValueRow(
                      label: localizations.collector,
                      value:
                          '${(contribution.collector?.fullName.isNotEmpty ?? false) ? contribution.collector!.fullName : localizations.unknown}${contribution.viaPaymentLink ? ' · link' : ''}',
                      highlight: hasValidCollector,
                      onTap:
                          () => _filterByCollector(
                            context,
                            contribution,
                            hasValidCollector,
                            localizations,
                          ),
                    ),
                  DsKeyValue(
                    localizations.date,
                    AppDateUtils.formatExactDateTime(
                      contribution.createdAt,
                      localizations,
                    ),
                  ),
                  if (contribution.transactionReference != null)
                    _TapValueRow(
                      label: 'Reference',
                      value: contribution.transactionReference!,
                      icon: Icons.copy_rounded,
                      onTap: () {
                        Clipboard.setData(
                          ClipboardData(
                            text: contribution.transactionReference!,
                          ),
                        );
                        AppSnackBar.showSuccess(
                          context,
                          message: 'Reference copied!',
                        );
                      },
                    ),
                ],
              ),

              // Answers
              if (answers.isNotEmpty) ...[
                const SizedBox(height: 16),
                const CollectCap('Answers'),
                const SizedBox(height: 6),
                DsListCard(children: answers),
              ],

              // Related refunds
              if (relatedRefunds.isNotEmpty) ...[
                const SizedBox(height: 16),
                const CollectCap('Refunds'),
                const SizedBox(height: 6),
                DsListCard(
                  children: [
                    for (final refund in relatedRefunds)
                      _refundRow(refund, localizations),
                  ],
                ),
                if (refunded) ...[
                  const SizedBox(height: 12),
                  const DsNote(
                    tone: DsTone.neutral,
                    text:
                        "Refunded payments don't count toward the jar total.",
                  ),
                ],
              ],

              // Payout approvals
              if (contribution.isPayout &&
                  (contribution.paymentStatus == 'awaiting-approval' ||
                      approvalDocs.isNotEmpty)) ...[
                const SizedBox(height: 16),
                CollectCap(
                  localizations.payoutApprovals,
                  trailing:
                      contribution.paymentStatus == 'awaiting-approval'
                          ? '${approvalDocs.where((a) => a['status'] == 'approved').length} of $requiredApprovals'
                          : null,
                ),
                const SizedBox(height: 6),
                if (approvalDocs.isEmpty)
                  const DsNote(
                    tone: DsTone.neutral,
                    icon: Icons.hourglass_empty_rounded,
                    text: 'No one has approved this transfer yet.',
                  )
                else
                  DsListCard(
                    children: [
                      for (final approval in approvalDocs)
                        _approvalRow(approval, localizations),
                    ],
                  ),
              ],

              const SizedBox(height: 16),
              if (canApprove)
                _ApprovalActions(transactionId: contribution.id)
              else
                Row(
                  children: [
                    if (!contribution.isPayout) ...[
                      Expanded(
                        child: Builder(
                          builder:
                              (btnContext) => CollectButton(
                                label: 'Receipt',
                                icon: Icons.receipt_long_outlined,
                                onTap:
                                    () => ContributionView._shareReceipt(
                                      btnContext,
                                      contribution,
                                      jarData,
                                      localizations,
                                    ),
                              ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: CollectButton(
                        label: localizations.help,
                        icon: Icons.help_outline_rounded,
                        onTap: () {
                          launchUrl(
                            Uri.parse(AppLinks.support),
                            mode: LaunchMode.inAppBrowserView,
                          );
                        },
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _filterByCollector(
    BuildContext context,
    ContributionModel contribution,
    bool hasValidCollector,
    AppLocalizations localizations,
  ) async {
    // Check if collector has valid data (not "Unknown User")
    if (hasValidCollector) {
      // Store references before popping context
      final filterBloc = context.read<FilterContributionsBloc>();
      final collectorId = contribution.collector?.id;

      if (collectorId == null) return;

      // Clear existing filters and set collector filter
      filterBloc.add(ClearAllFilters());

      // Wait a frame for the clear to process
      await Future.delayed(const Duration(milliseconds: 100));

      filterBloc.add(ToggleCollector(collectorId));

      // Wait for the filter to be set
      await Future.delayed(const Duration(milliseconds: 100));

      if (!context.mounted) return;

      // Close current modal
      Navigator.of(context).pop();

      // Navigate to contributions list
      context.go(AppRoutes.contributionsList);
    } else {
      AppSnackBar.show(context, message: localizations.unknown);
    }
  }

  Widget _refundRow(
    Map<String, dynamic> refund,
    AppLocalizations localizations,
  ) {
    final refundStatus = refund['status'] as String? ?? 'pending';
    final refundAmount = ((refund['amount'] as num?)?.abs() ?? 0).toDouble();
    final refundName = refund['accountName'] as String? ?? 'Refund';
    final refundDate = refund['createdAt'] as String?;

    // Map refund status to payment status labels
    final statusLabel = switch (refundStatus) {
      'pending' => localizations.statusPending,
      'in-progress' => localizations.statusPending,
      'completed' => localizations.statusCompleted,
      'failed' => localizations.statusFailed,
      _ => refundStatus,
    };
    final cents = ((refundAmount * 100).round() % 100).toString().padLeft(
      2,
      '0',
    );

    return DsRow(
      leading: const DsIconTile(Icons.undo_rounded, tone: DsTone.info, size: 32),
      title: 'Refund to $refundName',
      subtitle:
          refundDate != null
              ? AppDateUtils.formatTimestampSafe(
                DateTime.tryParse(refundDate),
                localizations,
              )
              : null,
      trailing: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '−${DsMoney.group(refundAmount)}.$cents',
            style: DsText.rowTitle.copyWith(
              fontFamily: 'Chillax',
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 3),
          paymentStatusTag(refundStatus, statusLabel),
        ],
      ),
    );
  }

  Widget _approvalRow(
    Map<String, dynamic> approval,
    AppLocalizations localizations,
  ) {
    final approvalStatus = approval['status'] as String? ?? 'approved';
    final actionBy = approval['actionBy'];
    final actionByName =
        actionBy is Map
            ? actionBy['fullName'] as String? ?? 'Unknown'
            : 'Unknown';

    final statusLabel = switch (approvalStatus) {
      'approved' => localizations.statusCompleted,
      'rejected' => localizations.statusRejected,
      _ => approvalStatus,
    };

    return DsRow(
      leading: CollectAvatar(name: actionByName, size: 32),
      title: actionByName,
      trailing: paymentStatusTag(approvalStatus, statusLabel),
    );
  }
}

/// Key/value row that can be tapped (collector filter, copy reference).
class _TapValueRow extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;
  final bool highlight;
  final IconData? icon;

  const _TapValueRow({
    required this.label,
    required this.value,
    required this.onTap,
    this.highlight = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Text(label, style: DsText.small.copyWith(color: AppColors.muted)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                value,
                textAlign: TextAlign.right,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: DsText.rowTitle.copyWith(
                  fontSize: 14,
                  decoration: highlight ? TextDecoration.underline : null,
                  decorationColor: AppColors.lime,
                  decorationThickness: 3,
                ),
              ),
            ),
            if (icon != null) ...[
              const SizedBox(width: 6),
              Icon(icon, size: 15, color: AppColors.muted),
            ],
          ],
        ),
      ),
    );
  }
}

/// Reject / Approve for an admin collector on a payout awaiting approval.
class _ApprovalActions extends StatefulWidget {
  final String transactionId;
  const _ApprovalActions({required this.transactionId});

  @override
  State<_ApprovalActions> createState() => _ApprovalActionsState();
}

class _ApprovalActionsState extends State<_ApprovalActions> {
  String? _loadingAction;

  Future<void> _act(String action) async {
    setState(() => _loadingAction = action);
    final repo = getIt<ContributionRepository>();
    final result = await repo.approveRejectPayout(
      transactionId: widget.transactionId,
      action: action,
    );
    if (!mounted) return;
    final navigator = Navigator.of(context);
    final message = result['message'] ?? 'Done';
    AppSnackBar.show(context, message: message);
    navigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    final busy = _loadingAction != null;
    return Row(
      children: [
        Expanded(
          child: CollectButton(
            label: 'Reject',
            style: CollectButtonStyle.danger,
            loading: _loadingAction == 'rejected',
            onTap: busy ? null : () => _act('rejected'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: AppButton.filled(
            text: 'Approve',
            isLoading: _loadingAction == 'approved',
            onPressed: busy ? null : () => _act('approved'),
          ),
        ),
      ],
    );
  }
}
