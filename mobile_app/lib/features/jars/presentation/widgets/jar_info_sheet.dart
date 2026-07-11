import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/image_utils.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/core/widgets/scrollable_background_image.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/withdrawal_accounts/presentation/widgets/withdrawal_account_picker.dart';

/// Bottom sheet that shows jar info (image, description, organizer) for collectors.
class JarInfoSheet extends StatefulWidget {
  final JarSummaryModel jarData;

  const JarInfoSheet({super.key, required this.jarData});

  static Future<String?> show({
    required BuildContext context,
    required JarSummaryModel jarData,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      isScrollControlled: true,
      builder: (context) => JarInfoSheet(jarData: jarData),
    );
  }

  @override
  State<JarInfoSheet> createState() => _JarInfoSheetState();
}

class _JarInfoSheetState extends State<JarInfoSheet> {
  double _scrollOffset = 0.0;

  /// Opens the shared account picker to change the jar's linked payout account.
  Future<void> _openAccountPicker() async {
    final currentId = widget.jarData.withdrawalAccount?.id;

    await WithdrawalAccountPicker.show(
      context,
      currentId: currentId,
      onSelected: (selectedId) {
        if (!mounted) return;
        if (selectedId != currentId) {
          context.read<UpdateJarBloc>().add(
                UpdateJarRequested(
                  jarId: widget.jarData.id,
                  updates: {'withdrawalAccount': selectedId},
                ),
              );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = widget.jarData.image?.url;
    final isCreator = widget.jarData.isCreator;
    final payoutAccount = widget.jarData.withdrawalAccount;

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppRadius.radiusM),
            topRight: Radius.circular(AppRadius.radiusM),
          ),
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppRadius.radiusM),
            topRight: Radius.circular(AppRadius.radiusM),
          ),
          // Listen for update results and refresh the jar summary on success.
          child: BlocListener<UpdateJarBloc, UpdateJarState>(
            listener: (context, state) {
              if (state is UpdateJarSuccess && !state.silent) {
                context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
                AppSnackBar.show(
                  context,
                  message: 'Payout account updated',
                  type: SnackBarType.success,
                );
              } else if (state is UpdateJarFailure) {
                AppSnackBar.showError(context, message: state.errorMessage);
              }
            },
            child: Stack(
              children: [
                // Background jar image (same style as jar detail view)
                if (imageUrl != null)
                  ScrollableBackgroundImage(
                    imageUrl: ImageUtils.constructImageUrl(imageUrl),
                    scrollOffset: _scrollOffset,
                    height: 350,
                    maxScrollForOpacity: 150,
                    baseOpacity: 0.30,
                  ),

                // Content
                Column(
                  children: [
                    const Center(child: DragHandle()),
                    Expanded(
                      child: NotificationListener<ScrollNotification>(
                        onNotification: (notification) {
                          if (notification is ScrollUpdateNotification) {
                            setState(() {
                              _scrollOffset = notification.metrics.pixels;
                            });
                          }
                          return false;
                        },
                        child: ListView(
                          controller: scrollController,
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.spacingL,
                          ),
                          children: [
                            // Spacer to push content below the background image
                            if (imageUrl != null) const SizedBox(height: 170),

                            if (imageUrl == null)
                              const SizedBox(height: AppSpacing.spacingS),

                            // Jar name
                            Text(widget.jarData.name,
                                style: TextStyles.titleBoldLg),

                            // Jar description
                            if (widget.jarData.description != null &&
                                widget.jarData.description!.isNotEmpty) ...[
                              const SizedBox(height: AppSpacing.spacingXs),
                              Text(
                                widget.jarData.description!,
                                style: TextStyles.titleRegularM.copyWith(
                                  color: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.color
                                      ?.withValues(alpha: 0.7),
                                ),
                              ),
                            ],
                            const SizedBox(height: AppSpacing.spacingS),

                            // Organizer row
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  child: Text(
                                    widget.jarData.creator.fullName.isNotEmpty
                                        ? widget.jarData.creator.fullName[0]
                                            .toUpperCase()
                                        : '?',
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Organized by ${widget.jarData.creator.fullName}',
                                  style: TextStyles.titleRegularSm.copyWith(
                                    color: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.color
                                        ?.withValues(alpha: 0.6),
                                  ),
                                ),
                              ],
                            ),

                            // Payout account row (creator only)
                            if (isCreator) ...[
                              const SizedBox(height: AppSpacing.spacingM),
                              Container(
                                decoration: BoxDecoration(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .surfaceContainerHighest
                                      .withValues(alpha: 0.5),
                                  borderRadius: BorderRadius.circular(
                                    AppRadius.radiusM,
                                  ),
                                ),
                                child: ListTile(
                                  onTap: _openAccountPicker,
                                  leading: Icon(
                                    payoutAccount == null
                                        ? Icons.account_balance_wallet_outlined
                                        : (payoutAccount.isMobileMoney
                                            ? Icons.phone_android
                                            : Icons.account_balance),
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                  ),
                                  title: Text(
                                    'Payout account',
                                    style: TextStyles.titleMediumS.copyWith(
                                      color: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.color
                                          ?.withValues(alpha: 0.6),
                                    ),
                                  ),
                                  subtitle: Text(
                                    payoutAccount == null
                                        ? 'Not set'
                                        : '${payoutAccount.label?.isNotEmpty == true ? payoutAccount.label! : withdrawalAccountLabel(payoutAccount)}  •  ${payoutAccount.maskedAccountNumber}',
                                    style: TextStyles.titleMediumS,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  trailing: const Icon(Icons.chevron_right),
                                ),
                              ),
                            ],

                            const SizedBox(height: AppSpacing.spacingL),
                          ],
                        ),
                      ),
                    ),

                    // Report jar button
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.spacingL,
                      ),
                      child: SizedBox(
                        width: double.infinity,
                        child: AppButton.outlined(
                          text: 'Report Jar',
                          onPressed: () => Navigator.of(context).pop('report'),
                          textColor: Colors.grey,
                          borderColor: Colors.grey,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.spacingS),

                    // Leave jar button pinned at bottom
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.spacingL,
                      ),
                      child: SizedBox(
                        width: double.infinity,
                        child: AppButton.outlined(
                          text: 'Leave Jar',
                          onPressed: () async {
                            final confirmed = await showModalBottomSheet<bool>(
                              context: context,
                              backgroundColor: Colors.transparent,
                              builder: (ctx) => Container(
                                decoration: BoxDecoration(
                                  color: Theme.of(ctx).colorScheme.surface,
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(AppRadius.radiusM),
                                    topRight: Radius.circular(AppRadius.radiusM),
                                  ),
                                ),
                                padding:
                                    const EdgeInsets.all(AppSpacing.spacingL),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const DragHandle(),
                                    const SizedBox(height: AppSpacing.spacingM),
                                    Text(
                                      'Are you sure you want to leave this jar?',
                                      style: TextStyles.titleBoldM,
                                      textAlign: TextAlign.center,
                                    ),
                                    const SizedBox(height: AppSpacing.spacingL),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: AppButton.outlined(
                                            text: 'No',
                                            onPressed: () =>
                                                Navigator.of(ctx).pop(false),
                                          ),
                                        ),
                                        const SizedBox(
                                            width: AppSpacing.spacingM),
                                        Expanded(
                                          child: AppButton.outlined(
                                            text: 'Yes',
                                            onPressed: () =>
                                                Navigator.of(ctx).pop(true),
                                            textColor: Colors.red,
                                            borderColor: Colors.red,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: AppSpacing.spacingM),
                                  ],
                                ),
                              ),
                            );
                            if (confirmed == true && context.mounted) {
                              Navigator.of(context).pop('leave');
                            }
                          },
                          textColor: Colors.red,
                          borderColor: Colors.red,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.spacingM),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
