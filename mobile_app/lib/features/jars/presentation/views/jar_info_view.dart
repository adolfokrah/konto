import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_images.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/contribution/logic/bloc/export_contributions_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart'
    hide MediaModel;
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_group_picker.dart';
import 'package:Hoga/features/jars/presentation/views/jar_photos_view.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/withdrawal_account_picker.dart';
import 'package:Hoga/route.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

/// Jar settings: grouped lists with values on the right, amber tags for
/// anything missing, and confirm sheets for sealing and closing.
class JarInfoView extends StatefulWidget {
  const JarInfoView({super.key});

  @override
  State<JarInfoView> createState() => _JarInfoViewState();
}

class _JarInfoViewState extends State<JarInfoView> {
  bool _isBreakingJar = false;

  /// What the jar raised before it was closed, for the "Jar closed" screen.
  ({String name, double raised, int count, String currency, String jarId})?
  _closedSummary;

  /// Photos live on their own screen; refresh the summary when coming back
  /// so the header count is current (photo updates are silent).
  Future<void> _openPhotos() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const JarPhotosView()));
    if (!mounted) return;
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
  }

  void _showJarGroupPicker(String currentJarGroup, String jarId) {
    JarGroupPicker.show(
      context,
      currentJarGroup: currentJarGroup,
      onJarGroupSelected: (String selectedGroup) {
        context.read<UpdateJarBloc>().add(
          UpdateJarRequested(
            jarId: jarId,
            updates: {'jarGroup': selectedGroup},
          ),
        );
      },
    );
  }

  /// Opens the shared account picker to change the jar's linked payout account.
  Future<void> _openPayoutAccountPicker(String jarId, String? currentId) async {
    await WithdrawalAccountPicker.show(
      context,
      currentId: currentId,
      onSelected: (selectedId) {
        if (!mounted) return;
        if (selectedId != currentId) {
          context.read<UpdateJarBloc>().add(
            UpdateJarRequested(
              jarId: jarId,
              updates: {'withdrawalAccount': selectedId},
            ),
          );
        }
      },
    );
  }

  /// Sends a settings update unless one is already running.
  void _update(String jarId, Map<String, dynamic> updates) {
    if (context.read<UpdateJarBloc>().state is UpdateJarInProgress) return;
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(jarId: jarId, updates: updates),
    );
  }

  /// Confirm sheet from the mockup: big icon tile, title, message, a
  /// coloured confirm button and a ghost cancel.
  Future<bool?> _confirmSheet({
    required IconData icon,
    required DsTone tone,
    required String title,
    required String message,
    required String confirmText,
    Color? confirmColor,
    String cancelText = 'Cancel',
    List<Widget> extra = const [],
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (ctx) => JarSheetFrame(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: DsIconTile(icon, tone: tone, size: 52),
              ),
              const SizedBox(height: 14),
              Text(title, style: DsText.section.copyWith(fontSize: 20)),
              const SizedBox(height: 6),
              Text(message, style: DsText.small),
              for (final w in extra) ...[const SizedBox(height: 14), w],
              const SizedBox(height: 18),
              JarPrimaryButton(
                label: confirmText,
                color: confirmColor,
                onTap: () => Navigator.of(ctx).pop(true),
              ),
              const SizedBox(height: 6),
              JarGhostButton(
                label: cancelText,
                onTap: () => Navigator.of(ctx).pop(false),
              ),
            ],
          ),
    );
  }

  Future<void> _confirmSealOrReopen(JarSummaryModel jarData) async {
    final isCurrentlyClosed = jarData.status == JarStatus.sealed;
    final ok =
        isCurrentlyClosed
            ? await _confirmSheet(
              icon: Icons.lock_open_rounded,
              tone: DsTone.positive,
              title: 'Reopen this jar?',
              message:
                  'People can pay into it again through your link and QR code.',
              confirmText: 'Reopen jar',
            )
            : await _confirmSheet(
              icon: Icons.lock_outline_rounded,
              tone: DsTone.pending,
              title: 'Seal this jar?',
              message:
                  'New payments stop. The balance stays and you can still transfer it. You can reopen any time.',
              confirmText: 'Seal jar',
              confirmColor: AppColors.pending,
            );
    if (ok != true || !mounted) return;
    // Handle jar closing/reopening logic
    final newStatus = isCurrentlyClosed ? 'open' : 'sealed';
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(jarId: jarData.id, updates: {'status': newStatus}),
    );
  }

  Future<void> _confirmBreak(JarSummaryModel jarData) async {
    final available = jarData.balanceBreakDown.totalAmountTobeTransferred;
    final cur = jarData.currency.toUpperCase();
    final ok = await _confirmSheet(
      icon: Icons.heart_broken_outlined,
      tone: DsTone.negative,
      title: 'Close this jar for good?',
      message:
          'Nobody can pay into it again and it can\'t be reopened. Its history stays in Activity.',
      confirmText: 'Close jar',
      confirmColor: AppColors.negative,
      cancelText: 'Keep it open',
      extra: [
        if (available > 0) ...[
          JarFillList(
            children: [
              DsKeyValue(
                'Still available',
                _money(available, cur),
                strong: true,
              ),
            ],
          ),
          const DsNote(
            tone: DsTone.pending,
            icon: Icons.error_outline_rounded,
            text:
                'Transfer the balance first, or it stays here until you contact support.',
          ),
        ],
      ],
    );
    if (ok != true || !mounted) return;
    final b = jarData.balanceBreakDown;
    _closedSummary = (
      name: jarData.name,
      raised: b.totalContributedAmount,
      count:
          b.cash.totalCount +
          b.bankTransfer.totalCount +
          b.mobileMoney.totalCount,
      currency: cur,
      jarId: jarData.id,
    );
    _isBreakingJar = true;
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(jarId: jarData.id, updates: {'status': 'broken'}),
    );
  }

  static String _money(double v, String cur, {bool cents = true}) {
    final c = ((v.abs() * 100).round() % 100).toString().padLeft(2, '0');
    return '$cur ${DsMoney.group(v)}${cents ? '.$c' : ''}';
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    return MultiBlocListener(
      listeners: [
        BlocListener<JarSummaryBloc, JarSummaryState>(
          listener: (context, state) {
            if (_isBreakingJar) {
              context.pop();
            }
          },
        ),
        BlocListener<UpdateJarBloc, UpdateJarState>(
          listener: (context, state) {
            if (state is UpdateJarSuccess) {
              // Skip refresh for silent updates (e.g. photo uploads — UI already updated locally)
              if (!state.silent) {
                context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
              }
              // If we were breaking a jar, show success modal and then navigate
              if (_isBreakingJar) {
                _isBreakingJar = false;
                final summary = _closedSummary;
                Navigator.of(context).push(
                  MaterialPageRoute(
                    fullscreenDialog: true,
                    builder:
                        (_) => _JarClosedView(
                          name: summary?.name ?? '',
                          raised: _money(
                            summary?.raised ?? 0,
                            summary?.currency ?? '',
                            cents: false,
                          ),
                          count: summary?.count ?? 0,
                          jarId: summary?.jarId,
                          onBack: () {
                            context.read<JarSummaryBloc>().add(
                              ClearCurrentJarRequested(),
                            );
                            Navigator.of(context).pop();
                            context.pop(); // Go back to previous screen
                          },
                        ),
                  ),
                );
              }
            } else if (state is UpdateJarFailure) {
              AppSnackBar.showError(context, message: state.errorMessage);
              _isBreakingJar = false; // Reset the flag on failure too
            }
          },
        ),
      ],
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is JarSummaryLoading) {
            return const Scaffold(
              backgroundColor: AppColors.cream,
              appBar: JarTopBar(title: 'Jar settings'),
              body: JarLoading(),
            );
          }

          if (state is JarSummaryError) {
            return Scaffold(
              backgroundColor: AppColors.cream,
              appBar: const JarTopBar(title: 'Jar settings'),
              body: Center(
                child: DsEmptyState(
                  icon: Icons.error_outline_rounded,
                  tone: DsTone.negative,
                  title: localizations.error,
                  message: state.message,
                ),
              ),
            );
          }

          if (state is! JarSummaryLoaded) {
            return Scaffold(
              backgroundColor: AppColors.cream,
              appBar: const JarTopBar(title: 'Jar settings'),
              body: Center(
                child: Text(
                  localizations.noJarDataAvailable,
                  style: DsText.small,
                ),
              ),
            );
          }

          final jarData = state.jarData;

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: const JarTopBar(title: 'Jar settings'),
            body: Stack(
              children: [
                ListView(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                  children: _buildSections(context, jarData),
                ),
                // Loading overlay during jar update
                BlocBuilder<UpdateJarBloc, UpdateJarState>(
                  builder: (context, updateState) {
                    if (updateState is UpdateJarInProgress) {
                      return JarBusyOverlay(label: localizations.updatingJar);
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  List<Widget> _buildSections(BuildContext context, JarSummaryModel jarData) {
    final l = AppLocalizations.of(context)!;
    final imageUrl =
        jarData.image?.url != null
            ? ImageUtils.constructImageUrl(jarData.image!.url!)
            : null;
    const missing = DsTag('Missing', tone: DsTone.pending);
    final canRename = jarData.contributions.isEmpty;
    final cur = jarData.currency.toUpperCase();
    final photoCount = (jarData.image != null ? 1 : 0) + jarData.images.length;

    String? preview(String? text) {
      if (text == null || text.trim().isEmpty) return null;
      final t = text.trim().replaceAll('\n', ' ');
      return t.length > 14 ? '${t.substring(0, 14).trimRight()}…' : t;
    }

    final goalValue =
        jarData.goalAmount > 0
            ? [
              _money(jarData.goalAmount, cur, cents: false),
              if (jarData.deadline != null)
                DateFormat('d MMM', l.localeName).format(jarData.deadline!),
            ].join(' · ')
            : 'Off';

    final fixedValue =
        jarData.isFixedContribution
            ? _money(
              jarData.acceptedContributionAmount,
              cur,
              cents: jarData.acceptedContributionAmount % 1 != 0,
            )
            : 'Off';

    final payout = jarData.withdrawalAccount;
    final payoutValue =
        payout == null
            ? null
            : '${payout.label?.isNotEmpty == true
                ? payout.label!
                : payout.isMobileMoney
                ? 'MoMo'
                : withdrawalAccountLabel(payout)} ${payout.maskedAccountNumber}';

    final frozen = jarData.isJarFrozen;
    final sealed = jarData.status == JarStatus.sealed;

    return [
      // Header: photo, name, "3 photos · Wedding", Edit (name).
      DsCard(
        padding: const EdgeInsets.all(14),
        onTap: _openPhotos,
        child: Row(
          children: [
            JarThumb(imageUrl: imageUrl, size: 56),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    jarData.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: DsText.rowTitle.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(
                        '$photoCount photo${photoCount == 1 ? '' : 's'}',
                        style: DsText.caption,
                      ),
                      Text(' · ', style: DsText.caption),
                      // Category: tap to change it in the picker sheet.
                      Flexible(
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap:
                              () => _showJarGroupPicker(
                                jarData.jarGroup ?? l.other,
                                jarData.id,
                              ),
                          child: Text(
                            jarData.jarGroup ?? 'Add category',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: DsText.caption,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (canRename) ...[
              const SizedBox(width: 8),
              _XsButton(
                label: 'Edit',
                onTap: () => context.push(AppRoutes.jarNameEdit),
              ),
            ],
          ],
        ),
      ),

      const SizedBox(height: 12),
      const DsGroupLabel('Page'),
      const SizedBox(height: 12),
      DsListCard(
        children: [
          DsRow(
            title: l.description,
            trailing:
                preview(jarData.description) != null
                    ? JarRowValue(text: preview(jarData.description))
                    : const JarRowValue(tag: missing),
            onTap: () => context.push(AppRoutes.jarDescriptionEdit),
          ),
          DsRow(
            title: 'Thank-you message',
            trailing:
                preview(jarData.thankYouMessage) != null
                    ? JarRowValue(text: preview(jarData.thankYouMessage))
                    : const JarRowValue(tag: missing),
            onTap: () => context.push(AppRoutes.jarThankYouMessageEdit),
          ),
          if (jarData.isCreator)
            DsRow(
              title: 'Custom questions',
              trailing: JarRowValue(
                text: '${jarData.customFields?.length ?? 0}',
              ),
              onTap:
                  () => context.push(
                    '${AppRoutes.jarCustomFields}?jarId=${jarData.id}',
                  ),
            ),
          DsRow(
            title: 'Say "Donate"',
            trailing: JarStatefulToggle(
              value: jarData.donationLabel == 'donate',
              onChanged:
                  (value) => _update(jarData.id, {
                    'donationLabel': value ? 'donate' : 'contribute',
                  }),
            ),
          ),
        ],
      ),

      const SizedBox(height: 12),
      const DsGroupLabel('Money'),
      const SizedBox(height: 12),
      DsListCard(
        children: [
          DsRow(
            title: l.goal,
            trailing: JarRowValue(text: goalValue),
            onTap: () => context.push(AppRoutes.jarGoal),
          ),
          DsRow(
            title: 'Fixed amount',
            trailing: JarRowValue(text: fixedValue),
            onTap: () => context.push(AppRoutes.jarFixedContributionAmountEdit),
          ),
          if (jarData.isCreator)
            DsRow(
              title: 'Payout account',
              trailing:
                  payoutValue != null
                      ? JarRowValue(text: payoutValue)
                      : const JarRowValue(tag: missing),
              onTap:
                  () => _openPayoutAccountPicker(
                    jarData.id,
                    jarData.withdrawalAccount?.id,
                  ),
            ),
        ],
      ),

      const SizedBox(height: 12),
      const DsGroupLabel('Privacy'),
      const SizedBox(height: 12),
      DsListCard(
        children: [
          DsRow(
            title: 'Show goal publicly',
            trailing: JarStatefulToggle(
              value: jarData.showGoal ?? false,
              onChanged: (value) => _update(jarData.id, {'showGoal': value}),
            ),
          ),
          DsRow(
            title: 'Allow anonymous',
            trailing: JarStatefulToggle(
              value: jarData.allowAnonymousContributions ?? false,
              onChanged:
                  (value) => _update(jarData.id, {
                    'allowAnonymousContributions': value,
                  }),
            ),
          ),
          DsRow(
            title: 'Show recent contributions',
            trailing: JarStatefulToggle(
              value: jarData.showRecentContributions ?? false,
              onChanged:
                  (value) =>
                      _update(jarData.id, {'showRecentContributions': value}),
            ),
          ),
        ],
      ),

      const SizedBox(height: 12),
      Opacity(
        opacity: frozen ? 0.35 : 1.0,
        child: IgnorePointer(
          ignoring: frozen,
          child: DsListCard(
            children: [
              DsRow(
                title: sealed ? 'Reopen jar' : 'Seal jar',
                trailing: JarRowValue(
                  text:
                      sealed ? 'Take payments again' : 'Stop new contributions',
                  chevron: false,
                ),
                onTap: () => _confirmSealOrReopen(jarData),
              ),
              DsRow(
                title: 'Close jar',
                titleColor: AppColors.negative,
                onTap: () => _confirmBreak(jarData),
              ),
            ],
          ),
        ),
      ),
    ];
  }
}

/// Small fill button (mockup `.btn.fill.xs`).
class _XsButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _XsButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.fill,
      borderRadius: BorderRadius.circular(9),
      child: InkWell(
        borderRadius: BorderRadius.circular(9),
        onTap: onTap,
        child: Container(
          height: 30,
          padding: const EdgeInsets.symmetric(horizontal: 11),
          alignment: Alignment.center,
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: 'Supreme',
              fontWeight: FontWeight.w700,
              fontSize: 12.5,
              color: AppColors.navy,
            ),
          ),
        ),
      ),
    );
  }
}

/// "Jar closed" success screen: what it raised, back to jars, statement.
class _JarClosedView extends StatelessWidget {
  final String name;
  final String raised;
  final int count;
  final String? jarId;
  final VoidCallback onBack;

  const _JarClosedView({
    required this.name,
    required this.raised,
    required this.count,
    required this.jarId,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) onBack();
      },
      child: BlocListener<ExportContributionsBloc, ExportContributionsState>(
        listener: (context, state) {
          if (state is ExportContributionsSuccess) {
            AppSnackBar.showSuccess(context, message: state.message);
          } else if (state is ExportContributionsFailure) {
            AppSnackBar.showError(context, message: state.message);
          }
        },
        child: Scaffold(
          backgroundColor: AppColors.surfaceWhite,
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    AppImages.brokenJar,
                    width: 150,
                    height: 150,
                    fit: BoxFit.contain,
                  ),
                  const SizedBox(height: 12),
                  const Text('Jar closed', style: DsText.title),
                  const SizedBox(height: 12),
                  Text.rich(
                    TextSpan(
                      style: DsText.body,
                      children: [
                        TextSpan(text: '$name raised '),
                        TextSpan(
                          text: raised,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.navy,
                          ),
                        ),
                        TextSpan(
                          text:
                              ' from $count contribution${count == 1 ? '' : 's'}. Its statement stays in Activity.',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          bottomNavigationBar: JarFooter(
            children: [
              JarPrimaryButton(label: 'Back to jars', onTap: onBack),
              const SizedBox(height: 6),
              BlocBuilder<ExportContributionsBloc, ExportContributionsState>(
                builder: (context, state) {
                  final busy = state is ExportContributionsInProgress;
                  return JarGhostButton(
                    label: busy ? 'Sending statement…' : 'Download statement',
                    icon: Icons.download_rounded,
                    onTap:
                        busy || jarId == null
                            ? null
                            : () => context.read<ExportContributionsBloc>().add(
                              TriggerExportContributions(jarId: jarId!),
                            ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
