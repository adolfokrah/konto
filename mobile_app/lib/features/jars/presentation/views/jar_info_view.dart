import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_images.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/operation_complete_modal.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart'
    hide MediaModel;
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_group_picker.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/media/data/models/media_model.dart';
import 'package:Hoga/features/media/presentation/views/image_uploader_bottom_sheet.dart';
import 'package:Hoga/core/enums/media_upload_context.dart';
import 'package:Hoga/core/config/backend_config.dart';
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
  List<MediaModel> _photos = [];
  bool _photosInitialized = false;

  void _showImageUploaderSheet() {
    ImageUploaderBottomSheet.show(
      context,
      uploadContext: MediaUploadContext.jarImage,
      maxImages: 3 - _photos.length,
    );
  }

  void _removePhoto(int index, String jarId) {
    final newPhotos = List<MediaModel>.from(_photos)..removeAt(index);
    setState(() => _photos = newPhotos);
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(
        jarId: jarId,
        updates: {
          'images': newPhotos.map((m) => {'image': m.id}).toList(),
        },
      ),
    );
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

  Future<void> _confirmSealOrReopen(JarSummaryModel jarData) async {
    final l = AppLocalizations.of(context)!;
    final isCurrentlyClosed = jarData.status == JarStatus.sealed;
    final ok = await JarConfirmSheet.show(
      context: context,
      icon: isCurrentlyClosed ? Icons.lock_open_rounded : Icons.lock_outline,
      tone: isCurrentlyClosed ? DsTone.positive : DsTone.pending,
      title: isCurrentlyClosed ? l.reopenJar : l.sealJar,
      message: isCurrentlyClosed ? l.reopenJarMessage : l.sealJarMessage,
      confirmText: isCurrentlyClosed ? l.reopen : l.seal,
    );
    if (ok != true || !mounted) return;
    // Handle jar closing/reopening logic
    final newStatus = isCurrentlyClosed ? 'open' : 'sealed';
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(jarId: jarData.id, updates: {'status': newStatus}),
    );
  }

  Future<void> _confirmBreak(JarSummaryModel jarData) async {
    final l = AppLocalizations.of(context)!;
    final available = jarData.balanceBreakDown.totalAmountTobeTransferred;
    final ok = await JarConfirmSheet.show(
      context: context,
      icon: Icons.heart_broken_outlined,
      tone: DsTone.negative,
      title: l.breakJar,
      message: l.breakJarConfirmationMessage,
      confirmText: l.breakButton,
      cancelText: 'Keep it open',
      extra: [
        if (available > 0) ...[
          JarFillList(
            children: [
              DsKeyValue(
                'Still available',
                CurrencyUtils.formatAmount(available, jarData.currency),
                strong: true,
              ),
            ],
          ),
          const DsNote(
            tone: DsTone.pending,
            icon: Icons.warning_amber_rounded,
            text:
                'Transfer the balance first, or it stays here until you contact support.',
          ),
        ],
      ],
    );
    if (ok != true || !mounted) return;
    _isBreakingJar = true;
    context.read<UpdateJarBloc>().add(
      UpdateJarRequested(jarId: jarData.id, updates: {'status': 'broken'}),
    );
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
        BlocListener<MediaBloc, MediaState>(
          listener: (context, state) {
            if (state is MediaLoaded &&
                state.context == MediaUploadContext.jarImage) {
              if (_photos.length < 3) {
                final jarState = context.read<JarSummaryBloc>().state;
                if (jarState is JarSummaryLoaded) {
                  final newPhotos = <MediaModel>[..._photos, state.media];
                  setState(() => _photos = newPhotos);
                  context.read<UpdateJarBloc>().add(
                    UpdateJarRequested(
                      jarId: jarState.jarData.id,
                      updates: {
                        'images':
                            newPhotos.map((m) => {'image': m.id}).toList(),
                      },
                    ),
                  );
                }
              }
            } else if (state is MediaError) {
              AppSnackBar.showError(context, message: state.errorMessage);
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
                OperationCompleteModal.show(
                  context,
                  image: Image.asset(
                    AppImages.brokenJar,
                    width: 200,
                    height: 200,
                    fit: BoxFit.contain,
                    color: AppColors.navy,
                    colorBlendMode: BlendMode.srcIn,
                  ),
                  title: localizations.jarBroken,
                  subtitle: localizations.jarBrokenDescription,
                  buttonText: localizations.okay,
                  onButtonPressed: () {
                    context.read<JarSummaryBloc>().add(
                      ClearCurrentJarRequested(),
                    );
                    Navigator.of(context).pop();
                    context.pop(); // Go back to previous screen
                  },
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

          // Initialize photos from jar data on first build
          if (!_photosInitialized) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && !_photosInitialized) {
                setState(() {
                  _photos =
                      jarData.images
                          .map(
                            (m) => MediaModel(
                              id: m.id,
                              alt: m.alt,
                              url: m.url,
                              filename: m.filename,
                              updatedAt: m.updatedAt ?? DateTime.now(),
                              createdAt: m.createdAt ?? DateTime.now(),
                            ),
                          )
                          .toList();
                  _photosInitialized = true;
                });
              }
            });
          }

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
    final missing = const DsTag('Missing', tone: DsTone.pending);
    final canRename = jarData.contributions.isEmpty;
    final cur = jarData.currency.toUpperCase();

    String? preview(String? text) {
      if (text == null || text.trim().isEmpty) return null;
      final t = text.trim().replaceAll('\n', ' ');
      return t.length > 22 ? '${t.substring(0, 22)}…' : t;
    }

    final goalValue =
        jarData.goalAmount > 0
            ? [
              '$cur ${DsMoney.group(jarData.goalAmount)}',
              if (jarData.deadline != null)
                DateFormat('d MMM', l.localeName).format(jarData.deadline!),
            ].join(' · ')
            : 'Off';

    final payout = jarData.withdrawalAccount;
    final payoutValue =
        payout == null
            ? null
            : '${payout.label?.isNotEmpty == true ? payout.label! : withdrawalAccountLabel(payout)} ${payout.maskedAccountNumber}';

    final statusTag = switch (jarData.status) {
      JarStatus.open => const DsTag('Open', tone: DsTone.positive),
      JarStatus.sealed => const DsTag('Sealed'),
      JarStatus.frozen => const DsTag('Frozen', tone: DsTone.negative),
      JarStatus.broken => const DsTag('Closed'),
    };

    final frozen = jarData.isJarFrozen;

    return [
      // Header: photo, name, photos count and category
      DsCard(
        child: Row(
          children: [
            JarThumb(imageUrl: imageUrl, size: 52),
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
                  Text(
                    [
                      '${_photos.length} photo${_photos.length == 1 ? '' : 's'}',
                      if (jarData.jarGroup != null) jarData.jarGroup!,
                    ].join(' · '),
                    style: DsText.caption,
                  ),
                ],
              ),
            ),
            if (canRename)
              DsSmallButton(
                label: 'Edit',
                secondary: true,
                onTap: () => context.push(AppRoutes.jarNameEdit),
              ),
          ],
        ),
      ),

      const SizedBox(height: 14),
      const DsGroupLabel('Details'),
      const SizedBox(height: 8),
      DsListCard(
        children: [
          DsRow(
            title: l.jarGroup,
            trailing: JarRowValue(text: jarData.jarGroup ?? l.notAvailable),
            onTap:
                () => _showJarGroupPicker(
                  jarData.jarGroup ?? l.other,
                  jarData.id,
                ),
          ),
          DsRow(
            title: l.currency,
            trailing: JarRowValue(text: cur, chevron: false),
          ),
          DsRow(title: l.status, trailing: statusTag),
        ],
      ),

      const SizedBox(height: 14),
      DsGroupLabel('Photos · ${_photos.length} of 3'),
      const SizedBox(height: 8),
      DsCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              child: Row(
                children: [
                  ..._photos.asMap().entries.map((entry) {
                    final i = entry.key;
                    final photo = entry.value;
                    final photoUrl =
                        photo.url != null
                            ? '${BackendConfig.imageBaseUrl}${photo.url}'
                            : null;
                    return Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          JarThumb(imageUrl: photoUrl, size: 72),
                          Positioned(
                            top: -6,
                            right: -6,
                            child: GestureDetector(
                              onTap: () => _removePhoto(i, jarData.id),
                              child: Container(
                                width: 24,
                                height: 24,
                                decoration: const BoxDecoration(
                                  color: AppColors.navy,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.close,
                                  size: 14,
                                  color: AppColors.surfaceWhite,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  if (_photos.length < 3)
                    GestureDetector(
                      onTap: _showImageUploaderSheet,
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: AppColors.fill,
                          borderRadius: BorderRadius.circular(21),
                        ),
                        child: const Icon(Icons.add, color: AppColors.navy),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Photos show on your contribution page.',
              style: DsText.caption,
            ),
          ],
        ),
      ),

      const SizedBox(height: 14),
      const DsGroupLabel('Page'),
      const SizedBox(height: 8),
      DsListCard(
        children: [
          DsRow(
            title: l.description,
            trailing:
                preview(jarData.description) != null
                    ? JarRowValue(text: preview(jarData.description))
                    : JarRowValue(tag: missing),
            onTap: () => context.push(AppRoutes.jarDescriptionEdit),
          ),
          DsRow(
            title: 'Thank-you message',
            trailing:
                preview(jarData.thankYouMessage) != null
                    ? JarRowValue(text: preview(jarData.thankYouMessage))
                    : JarRowValue(tag: missing),
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
            subtitle: 'Instead of "Contribute" on the pay button',
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

      const SizedBox(height: 14),
      const DsGroupLabel('Money'),
      const SizedBox(height: 8),
      DsListCard(
        children: [
          DsRow(
            title: l.goal,
            trailing: JarRowValue(text: goalValue),
            onTap: () => context.push(AppRoutes.jarGoal),
          ),
          DsRow(
            title: 'Fixed amount',
            subtitle: 'Everyone pays the same',
            trailing: JarStatefulToggle(
              value: jarData.isFixedContribution,
              onChanged: (value) {
                final updates = <String, dynamic>{'isFixedContribution': value};
                // Only set acceptedContributionAmount when enabling fixed contribution
                if (value) {
                  // Set to current amount if it exists, otherwise a default
                  updates['acceptedContributionAmount'] =
                      jarData.acceptedContributionAmount > 0
                          ? jarData.acceptedContributionAmount
                          : 10.0; // Reasonable default
                } else {
                  // When disabling fixed contribution, clear the amount
                  updates['acceptedContributionAmount'] = null;
                }
                _update(jarData.id, updates);
              },
            ),
          ),
          if (jarData.isFixedContribution)
            DsRow(
              title: l.fixedContributionAmount,
              trailing: JarRowValue(
                text:
                    '$cur ${jarData.acceptedContributionAmount.toStringAsFixed(2)}',
              ),
              onTap:
                  () => context.push(AppRoutes.jarFixedContributionAmountEdit),
            ),
          if (jarData.isCreator)
            DsRow(
              title: 'Payout account',
              trailing:
                  payoutValue != null
                      ? JarRowValue(text: payoutValue)
                      : JarRowValue(tag: missing),
              onTap:
                  () => _openPayoutAccountPicker(
                    jarData.id,
                    jarData.withdrawalAccount?.id,
                  ),
            ),
        ],
      ),

      const SizedBox(height: 14),
      const DsGroupLabel('Privacy'),
      const SizedBox(height: 8),
      DsListCard(
        children: [
          DsRow(
            title: 'Show goal publicly',
            subtitle: 'On your payment page',
            trailing: JarStatefulToggle(
              value: jarData.showGoal ?? false,
              onChanged: (value) => _update(jarData.id, {'showGoal': value}),
            ),
          ),
          DsRow(
            title: 'Allow anonymous',
            subtitle: 'No name or phone needed to pay',
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
            subtitle: 'On your payment page',
            trailing: JarStatefulToggle(
              value: jarData.showRecentContributions ?? false,
              onChanged:
                  (value) =>
                      _update(jarData.id, {'showRecentContributions': value}),
            ),
          ),
        ],
      ),

      const SizedBox(height: 18),
      Opacity(
        opacity: frozen ? 0.35 : 1.0,
        child: IgnorePointer(
          ignoring: frozen,
          child: DsListCard(
            children: [
              DsRow(
                title:
                    jarData.status == JarStatus.sealed
                        ? l.reopenJar
                        : l.sealJar,
                trailing: JarRowValue(
                  text:
                      jarData.status == JarStatus.sealed
                          ? 'Take payments again'
                          : 'Stop new contributions',
                ),
                onTap: () => _confirmSealOrReopen(jarData),
              ),
              DsRow(
                title: l.breakJar,
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
