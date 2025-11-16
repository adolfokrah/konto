import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/core/widgets/small_button.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/features/jars/data/models/jar_model.dart';

class InvitedCollectorItem extends StatelessWidget {
  final InvitedCollector invitedCollector;
  final bool isNew;
  final VoidCallback? onRemind;
  final VoidCallback? onCancel;
  final Color? backgroundColor;

  const InvitedCollectorItem({
    super.key,
    required this.invitedCollector,
    this.isNew = true,
    this.onRemind,
    this.onCancel,
    this.backgroundColor,
  });

  /// Show bottom sheet with collector options
  void _showCollectorOptionsBottomSheet(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return Container(
          padding: EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
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
              // Drag handle
              const DragHandle(),

              // Header with name
              Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: AppSpacing.spacingXs,
                ),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    invitedCollector.name ?? 'Unknown',
                    style: TextStyles.titleMediumLg,
                  ),
                ),
              ),

              // Remind option - only show when status is pending
              if (invitedCollector.status == 'pending' && !isNew) ...[
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
                      backgroundColor: Theme.of(context).colorScheme.surface,
                      child: Icon(
                        Icons.notifications_outlined,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    title: Text('Remind', style: TextStyles.titleMedium),
                    onTap: () {
                      Navigator.pop(context);
                      onRemind?.call();
                    },
                  ),
                ),
                const SizedBox(height: AppSpacing.spacingS),
              ],

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
                    backgroundColor: Theme.of(context).colorScheme.surface,
                    child: Icon(
                      Icons.delete_outline,
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  title:
                      invitedCollector.status == 'pending'
                          ? Text('Cancel Invitation')
                          : const Text('Revoke access'),
                  onTap: () {
                    Navigator.pop(context);
                    onCancel?.call();
                  },
                ),
              ),

              // Bottom padding for safe area
              SizedBox(height: MediaQuery.of(context).padding.bottom),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Only pass avatarUrl if photo is not null and not empty
    final avatarUrl =
        invitedCollector.photo != null && invitedCollector.photo!.isNotEmpty
            ? invitedCollector.photo
            : null;

    return ListTile(
      contentPadding: EdgeInsets.all(0),
      onTap: () {
        _showCollectorOptionsBottomSheet(context);
      },
      leading: ContributorAvatar(
        contributorName: invitedCollector.name ?? 'Unknown',
        avatarUrl: avatarUrl,
        radius: 20,
        showStatusOverlay: false,
        backgroundColor:
            backgroundColor ?? Theme.of(context).colorScheme.primary,
      ),
      title: Text(
        invitedCollector.name ?? 'Unknown',
        style: Theme.of(context).textTheme.titleMedium,
      ),
      trailing:
          invitedCollector.status == 'pending' && !isNew
              ? AppSmallButton(
                backgroundColor:
                    backgroundColor ?? Theme.of(context).colorScheme.primary,
                padding: EdgeInsets.symmetric(
                  horizontal: AppSpacing.spacingS,
                  vertical: 6,
                ),
                onPressed: onRemind,
                child: const Text("Remind", style: TextStyles.titleMediumS),
              )
              : const SizedBox.shrink(),
    );
  }
}
