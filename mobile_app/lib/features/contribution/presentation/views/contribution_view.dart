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

/// Payment detail page: amount header, receipt rows, answers, refunds and,
/// for payouts awaiting your approval, Approve / Reject.
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
    // A full page, not a sheet (mockup: "Payment detail page").
    Navigator.of(
      context,
      rootNavigator: true,
    ).push(MaterialPageRoute(builder: (_) => const ContributionView()));
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
    return BlocBuilder<FetchContributionBloc, FetchContributionState>(
      builder: (context, state) {
        final localizations = AppLocalizations.of(context)!;
        Widget body;
        if (state is FetchContributionLoading) {
          body = const ContributionDetailSkeleton();
        } else if (state is FetchContributionError) {
          body = Center(
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
              if (jarState is! JarSummaryLoaded) {
                return const Scaffold(
                  backgroundColor: AppColors.cream,
                  appBar: CollectTopBar(),
                  body: ContributionDetailSkeleton(),
                );
              }
              return _ContributionDetail(
                state: state,
                jarData: jarState.jarData,
              );
            },
          );
        } else {
          body = const SizedBox.shrink();
        }
        return Scaffold(
          backgroundColor: AppColors.cream,
          appBar: const CollectTopBar(),
          body: body,
        );
      },
    );
  }
}

/// Payment detail while it loads: avatar, name, big amount, status tag,
/// then the details card.
class ContributionDetailSkeleton extends StatelessWidget {
  const ContributionDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const DsSkeletonPage(
    padding: EdgeInsets.fromLTRB(16, 12, 16, 32),
    children: [
      Center(child: DsSkeletonCircle(size: 56)),
      SizedBox(height: 12),
      Center(child: DsSkeletonLine(width: 140, height: 13)),
      SizedBox(height: 12),
      Center(child: DsSkeletonLine(width: 200, height: 40)),
      SizedBox(height: 12),
      Center(child: DsSkeletonLine(width: 70, height: 22)),
      SizedBox(height: 24),
      DsSkeletonKeyValueCard(rows: 5),
    ],
  );
}

/// "055 ••• 6543" for phone numbers, "••• 2210" for account numbers.
String _masked(String value, {bool phone = true}) {
  final digits = value.replaceAll(RegExp(r'\s'), '');
  if (digits.length < 7) return value;
  final last = digits.substring(digits.length - 4);
  return phone ? '${digits.substring(0, 3)} ••• $last' : '••• $last';
}

String _methodName(ContributionModel c, AppLocalizations localizations) {
  final net = DsNetworkLogo.fromProvider(c.mobileMoneyProvider);
  if (c.isMobileMoney && net != null) {
    return switch (net) {
      DsNetwork.mtn => 'MTN MoMo',
      DsNetwork.telecel => 'Telecel Cash',
      DsNetwork.airtelTigo => 'AirtelTigo Money',
    };
  }
  return PaymentMethodUtils.getPaymentMethodLabel(
    c.paymentMethod,
    localizations,
  );
}

class _ContributionDetail extends StatelessWidget {
  final FetchContributionLoaded state;
  final JarSummaryModel jarData;

  const _ContributionDetail({required this.state, required this.jarData});

  void _openMore(
    BuildContext context,
    ContributionModel contribution,
    AppLocalizations localizations,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (sheetContext) => CollectSheet(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(20),
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    if (!contribution.isPayout) ...[
                      DsRow(
                        leading: const _SheetIcon(Icons.receipt_long_outlined),
                        title: 'Receipt',
                        onTap: () {
                          Navigator.pop(sheetContext);
                          _ReceiptPage.open(context, contribution, jarData);
                        },
                      ),
                      const Divider(height: 1, color: AppColors.line),
                    ],
                    if (contribution.transactionReference != null) ...[
                      DsRow(
                        leading: const _SheetIcon(Icons.copy_rounded),
                        title: 'Copy reference',
                        onTap: () {
                          Navigator.pop(sheetContext);
                          _copyReference(context, contribution);
                        },
                      ),
                      const Divider(height: 1, color: AppColors.line),
                    ],
                    DsRow(
                      leading: const _SheetIcon(Icons.help_outline_rounded),
                      title: localizations.help,
                      onTap: () {
                        Navigator.pop(sheetContext);
                        _openHelp();
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
    );
  }

  static void _copyReference(BuildContext context, ContributionModel c) {
    Clipboard.setData(ClipboardData(text: c.transactionReference!));
    AppSnackBar.showSuccess(context, message: 'Reference copied!');
  }

  static void _openHelp() {
    launchUrl(Uri.parse(AppLinks.support), mode: LaunchMode.inAppBrowserView);
  }

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
    final awaitingApproval =
        contribution.isPayout &&
        contribution.paymentStatus == 'awaiting-approval';

    final canApprove =
        awaitingApproval &&
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

    final methodName = _methodName(contribution, localizations);
    final phone = contribution.contributorPhoneNumber;
    final hasPhone = phone != null && phone.isNotEmpty;
    final approvedCount =
        approvalDocs.where((a) => a['status'] == 'approved').length;
    final collectorLabel =
        '${(contribution.collector?.fullName.isNotEmpty ?? false) ? contribution.collector!.fullName : localizations.unknown}${contribution.viaPaymentLink ? ' · link' : ''}';
    final dateLabel = AppDateUtils.formatExactDateTime(
      contribution.createdAt,
      localizations,
    );
    final fee =
        contribution.charges != null && contribution.charges! > 0
            ? CurrencyUtils.formatAmount(
              contribution.charges!,
              jarData.currency,
            )
            : null;

    final referenceRow =
        contribution.transactionReference != null
            ? _TapValueRow(
              label: 'Reference',
              value: contribution.transactionReference!,
              icon: Icons.copy_rounded,
              onTap: () => _copyReference(context, contribution),
            )
            : null;

    // ---------------------------------------------------------------- rows
    final List<Widget> rows;
    if (contribution.isPayout) {
      final approvers = [
        for (final a in approvalDocs)
          '${(a['actionBy'] is Map ? (a['actionBy']['fullName'] as String? ?? 'Unknown') : 'Unknown').split(' ').first} ${a['status'] == 'rejected' ? '✗' : '✓'}',
        if (canApprove) 'You (waiting)',
      ];
      rows = [
        if (hasValidCollector)
          DsKeyValue('Requested by', contribution.collector!.fullName),
        DsKeyValue(
          'To',
          hasPhone ? '$methodName ${_masked(phone, phone: false)}' : methodName,
        ),
        if (fee != null) DsKeyValue('Fee', fee),
        DsKeyValue(localizations.date, dateLabel),
        if (referenceRow != null) referenceRow,
        if (approvers.isNotEmpty)
          DsKeyValue('Approved by', approvers.join(' · ')),
      ];
    } else if (refunded) {
      rows = [
        DsKeyValue(
          'Paid',
          [
            AppDateUtils.formatDateOnly(contribution.createdAt, localizations),
            hasPhone ? '$methodName ${_masked(phone)}' : methodName,
          ].join(' · '),
        ),
        DsKeyValue(localizations.jar, contribution.jar.name),
        if (referenceRow != null) referenceRow,
      ];
    } else {
      rows = [
        DsKeyValue(localizations.jar, contribution.jar.name),
        DsKeyValue('Method', hasPhone ? '$methodName · $phone' : methodName),
        if (contribution.accountNumber != null)
          DsKeyValue(localizations.accountNumber, contribution.accountNumber!),
        if (fee != null) DsKeyValue('Fee (paid by payer)', fee),
        if (!contribution.isRefund)
          _TapValueRow(
            label: 'Collected by',
            value: collectorLabel,
            highlight: hasValidCollector,
            onTap:
                () => _filterByCollector(
                  context,
                  contribution,
                  hasValidCollector,
                  localizations,
                ),
          ),
        DsKeyValue(localizations.date, dateLabel),
        if (referenceRow != null) referenceRow,
      ];
    }

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
                'Message',
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

    // ---------------------------------------------------------------- header
    final Widget tag;
    if (refunded) {
      tag = const DsTag('Refunded', tone: DsTone.info);
    } else if (awaitingApproval) {
      tag = DsTag(
        '$approvedCount of $requiredApprovals approvals',
        tone: DsTone.pending,
      );
    } else {
      tag = paymentStatusTag(
        contribution.paymentStatus,
        PaymentStatusUtils.getPaymentStatusLabel(
          contribution.paymentStatus,
          localizations,
        ),
      );
    }

    final amount = contribution.amountContributed.abs();
    final cents = ((amount * 100).round() % 100).toString().padLeft(2, '0');
    final struck = failed || refunded;
    final amountStyle = TextStyle(
      fontFamily: 'Chillax',
      fontWeight: FontWeight.w600,
      fontSize: contribution.isPayout ? 38 : 40,
      letterSpacing: -0.4,
      color: struck ? AppColors.muted : AppColors.navy,
      decoration: struck ? TextDecoration.lineThrough : null,
      fontFeatures: const [FontFeature.tabularFigures()],
    );

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: CollectTopBar(
        title: canApprove ? 'Approve transfer' : null,
        actions: [
          if (!canApprove)
            CollectBoxButton(
              icon: Icons.more_horiz_rounded,
              onTap: () => _openMore(context, contribution, localizations),
            ),
        ],
      ),
      bottomNavigationBar:
          canApprove
              ? CollectFooter(
                children: [_ApprovalActions(transactionId: contribution.id)],
              )
              : null,
      body: ListView(
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
                provider: contribution.mobileMoneyProvider,
                isPayout: contribution.isPayout,
                isRefund: contribution.isRefund,
                size: 52,
              ),
              const SizedBox(height: 8),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text:
                            '${contribution.isPayout ? '' : (contribution.isTransfer ? '−' : '+')}${DsMoney.group(amount)}',
                      ),
                      TextSpan(
                        text: '.$cents',
                        style:
                            struck
                                ? null
                                : const TextStyle(color: AppColors.faint),
                      ),
                    ],
                  ),
                  style: amountStyle,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                contribution.isPayout
                    ? 'from ${contribution.jar.name}'
                    : (contribution.contributor ?? 'Hogapay'),
                style: DsText.small,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              tag,
            ],
          ),
          const SizedBox(height: 18),

          DsListCard(children: rows),

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
                text: "Refunded payments don't count toward the jar total.",
              ),
            ],
          ],

          // Approvals still waiting on others (you can't act on this one)
          if (awaitingApproval && !canApprove && approvalDocs.isEmpty) ...[
            const SizedBox(height: 12),
            const DsNote(
              tone: DsTone.neutral,
              icon: Icons.hourglass_empty_rounded,
              text: 'No one has approved this transfer yet.',
            ),
          ],

          if (!contribution.isPayout && !refunded) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: CollectButton(
                    label: 'Receipt',
                    icon: Icons.receipt_long_outlined,
                    onTap:
                        () => _ReceiptPage.open(context, contribution, jarData),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: CollectButton(
                    label: localizations.help,
                    icon: Icons.help_outline_rounded,
                    onTap: _openHelp,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
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

      // Close the detail page
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
    final reason = refund['reason'] as String?;

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
    final parsedDate =
        refundDate != null ? DateTime.tryParse(refundDate) : null;

    final amountText = Text(
      '−${DsMoney.group(refundAmount)}.$cents',
      style: DsText.rowTitle.copyWith(
        fontFamily: 'Chillax',
        fontWeight: FontWeight.w600,
        fontSize: 14,
      ),
    );
    return DsRow(
      leading: const DsIconTile(
        Icons.south_west_rounded,
        tone: DsTone.info,
        size: 32,
      ),
      title: 'Refund to $refundName',
      subtitle: [
        if (parsedDate != null)
          AppDateUtils.formatDateOnly(parsedDate, localizations),
        if (reason != null && reason.isNotEmpty) reason,
      ].join(' · '),
      trailing:
          refundStatus == 'completed'
              ? amountText
              : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  amountText,
                  const SizedBox(height: 3),
                  paymentStatusTag(refundStatus, statusLabel),
                ],
              ),
    );
  }
}

/// White 32px icon box used in the "more" sheet rows.
class _SheetIcon extends StatelessWidget {
  final IconData icon;
  const _SheetIcon(this.icon);

  @override
  Widget build(BuildContext context) => Container(
    width: 32,
    height: 32,
    decoration: BoxDecoration(
      color: AppColors.surfaceWhite,
      borderRadius: BorderRadius.circular(10),
    ),
    child: Icon(icon, size: 17, color: AppColors.navy),
  );
}

/// The shareable receipt: a ticket with the amount on top and the details
/// below a dashed tear line, plus the jar's thank-you message.
class _ReceiptPage extends StatelessWidget {
  final ContributionModel contribution;
  final JarSummaryModel jar;

  const _ReceiptPage({required this.contribution, required this.jar});

  static void open(
    BuildContext context,
    ContributionModel contribution,
    JarSummaryModel jar,
  ) {
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => _ReceiptPage(contribution: contribution, jar: jar),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final c = contribution;
    final phone = c.contributorPhoneNumber;
    final method = _methodName(c, localizations);
    void share(BuildContext ctx) =>
        ContributionView._shareReceipt(ctx, c, jar, localizations);

    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: CollectTopBar(
        title: 'Receipt',
        leadingIcon: Icons.close_rounded,
        actions: [
          Builder(
            builder:
                (btnContext) => CollectBoxButton(
                  icon: Icons.ios_share_rounded,
                  onTap: () => share(btnContext),
                ),
          ),
        ],
      ),
      bottomNavigationBar: CollectFooter(
        children: [
          Builder(
            builder:
                (btnContext) => AppButton.filled(
                  text: localizations.share,
                  icon: const Icon(
                    Icons.ios_share_rounded,
                    size: 18,
                    color: Colors.white,
                  ),
                  onPressed: () => share(btnContext),
                ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
            decoration: const BoxDecoration(
              color: AppColors.surfaceWhite,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(20),
                bottom: Radius.circular(6),
              ),
            ),
            child: Column(
              children: [
                Image.asset('assets/images/logo.png', height: 18),
                const SizedBox(height: 16),
                const Text('Payment received', style: DsText.caption),
                const SizedBox(height: 2),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: DsMoney(
                    c.amountContributed.abs(),
                    currency: jar.currency.toUpperCase(),
                    size: 40,
                  ),
                ),
                const SizedBox(height: 4),
                paymentStatusTag(
                  c.paymentStatus,
                  PaymentStatusUtils.getPaymentStatusLabel(
                    c.paymentStatus,
                    localizations,
                  ),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: _DashedLine(),
          ),
          Container(
            decoration: const BoxDecoration(
              color: AppColors.surfaceWhite,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(6),
                bottom: Radius.circular(20),
              ),
            ),
            child: Column(
              children: [
                if (c.contributor != null) DsKeyValue('From', c.contributor!),
                DsKeyValue('To jar', jar.name),
                DsKeyValue(
                  'Paid with',
                  phone != null && phone.isNotEmpty
                      ? '$method · ${_masked(phone)}'
                      : method,
                ),
                DsKeyValue(
                  localizations.date,
                  AppDateUtils.formatExactDateTime(c.createdAt, localizations),
                ),
                if (c.transactionReference != null)
                  DsKeyValue('Reference', c.transactionReference!),
              ],
            ),
          ),
          if (jar.thankYouMessage != null &&
              jar.thankYouMessage!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              jar.thankYouMessage!,
              style: DsText.caption,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

/// Dashed tear line between the two halves of the receipt.
class _DashedLine extends StatelessWidget {
  const _DashedLine();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const dash = 6.0, gap = 4.0;
        final count = (constraints.maxWidth / (dash + gap)).floor();
        return Row(
          children: [
            for (var i = 0; i < count; i++) ...[
              Container(width: dash, height: 2, color: AppColors.line),
              const SizedBox(width: gap),
            ],
          ],
        );
      },
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
