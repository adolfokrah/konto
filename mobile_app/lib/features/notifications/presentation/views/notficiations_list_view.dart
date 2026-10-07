import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/notifications/logic/bloc/jar_invite_action_bloc.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/notifications/data/models/notification_model.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_loading_overlay/flutter_loading_overlay.dart';
import 'package:Hoga/features/notifications/presentation/widgets/jar_invite_preview_sheet.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_report_sheet.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/core/services/navigation_service.dart';

// NOTE: Class name has a typo (Notficiations). Retained to avoid breaking existing references.
// Consider renaming to `NotificationsListView` across the project when convenient.
/// Inbox: "Action needed" cards with buttons, and "Updates" rows by day.
class NotficiationsListView extends StatefulWidget {
  const NotficiationsListView({super.key});

  @override
  State<NotficiationsListView> createState() => _NotficiationsListViewState();
}

enum _InboxTab { action, updates }

class _NotficiationsListViewState extends State<NotficiationsListView> {
  _InboxTab? _tab;

  @override
  void initState() {
    super.initState();
    // Load notifications when the page opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationsBloc>().add(
        FetchNotifications(limit: 20, page: 1),
      );
    });
  }

  static bool _needsAction(NotificationModel n) =>
      n.status == NotificationStatus.unread &&
      (n.type == NotificationType.jarInvite ||
          n.type == NotificationType.kyc ||
          n.type == NotificationType.payoutApproval);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: JarTopBar(
        title: 'Inbox',
        actions: [
          BlocBuilder<NotificationsBloc, NotificationsState>(
            builder: (context, state) {
              final hasUnread =
                  state is NotificationsLoaded &&
                  state.notifications.any(
                    (n) => n.status == NotificationStatus.unread,
                  );
              if (!hasUnread) return const SizedBox.shrink();
              return DsLink(
                'Read',
                onTap:
                    () => context.read<NotificationsBloc>().add(
                      MarkAllNotificationsRead(),
                    ),
              );
            },
          ),
        ],
      ),
      body: BlocListener<JarInviteActionBloc, JarInviteActionState>(
        listener: (context, inviteState) {
          if (inviteState is JarInviteActionSuccess) {
            // Refetch notifications to update list (invite status change or removal)
            context.read<NotificationsBloc>().add(
              FetchNotifications(limit: 20, page: 1),
            );
            AppSnackBar.show(
              context,
              message: 'Invite processed successfully',
              type: SnackBarType.success,
            );
          } else if (inviteState is JarInviteActionError) {
            AppSnackBar.show(
              context,
              message: inviteState.message,
              type: SnackBarType.error,
            );
          }
          if (inviteState is JarInviteActionLoading) {
            startLoading();
          } else {
            stopLoading();
          }
        },
        child: BlocBuilder<NotificationsBloc, NotificationsState>(
          builder: (context, state) {
            if (state is NotificationsError) {
              return Align(
                alignment: const Alignment(0, -0.4),
                child: DsEmptyState(
                  icon: Icons.error_outline_rounded,
                  tone: DsTone.negative,
                  title: "Couldn't load your inbox",
                  message: state.message,
                  actionLabel: 'Try again',
                  onAction:
                      () => context.read<NotificationsBloc>().add(
                        FetchNotifications(limit: 20, page: 1),
                      ),
                ),
              );
            }
            if (state is NotificationsLoaded) {
              return _buildLoaded(context, state.notifications);
            }
            // Initial / loading state
            return const DsSkeletonPage(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 24),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: DsSkeletonBox(
                        height: 38,
                        radius: AppRadius.radiusL,
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: DsSkeletonBox(
                        height: 38,
                        radius: AppRadius.radiusL,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                DsSkeletonListCard(rows: 5, circleLeading: true),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildLoaded(
    BuildContext context,
    List<NotificationModel> notifications,
  ) {
    if (notifications.isEmpty) {
      return const Align(
        alignment: Alignment(0, -0.4),
        child: DsEmptyState(
          icon: Icons.notifications_none_rounded,
          title: "You're all caught up",
          message: 'Payments, invitations and approvals will show up here.',
        ),
      );
    }

    final actions = notifications.where(_needsAction).toList();
    final updates = notifications.where((n) => !_needsAction(n)).toList();
    final tab =
        _tab ?? (actions.isNotEmpty ? _InboxTab.action : _InboxTab.updates);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _InboxTabs(
            selected: tab,
            actionCount: actions.length,
            onChanged: (t) => setState(() => _tab = t),
          ),
        ),
        Expanded(
          child:
              tab == _InboxTab.action
                  ? _buildActions(context, actions)
                  : _buildUpdates(context, updates),
        ),
      ],
    );
  }

  Widget _buildActions(BuildContext context, List<NotificationModel> items) {
    if (items.isEmpty) {
      return const Align(
        alignment: Alignment(0, -0.5),
        child: DsEmptyState(
          icon: Icons.check_rounded,
          tone: DsTone.lime,
          title: 'Nothing needs you',
          message: 'Invitations and approvals waiting on you show up here.',
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, i) => _ActionCard(notification: items[i]),
    );
  }

  Widget _buildUpdates(BuildContext context, List<NotificationModel> items) {
    if (items.isEmpty) {
      return const Align(
        alignment: Alignment(0, -0.5),
        child: DsEmptyState(
          icon: Icons.notifications_none_rounded,
          title: 'No updates yet',
          message: 'Payments and status changes will show up here.',
        ),
      );
    }
    final now = DateTime.now();
    bool isToday(NotificationModel n) {
      final d = n.createdAt?.toLocal();
      return d != null &&
          d.year == now.year &&
          d.month == now.month &&
          d.day == now.day;
    }

    final today = items.where(isToday).toList();
    final earlier = items.where((n) => !isToday(n)).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        if (today.isNotEmpty) ...[
          const DsGroupLabel('Today'),
          const SizedBox(height: 8),
          DsListCard(
            children: [for (final n in today) _UpdateRow(notification: n)],
          ),
          const SizedBox(height: 12),
        ],
        if (earlier.isNotEmpty) ...[
          const DsGroupLabel('Earlier'),
          const SizedBox(height: 8),
          DsListCard(
            children: [for (final n in earlier) _UpdateRow(notification: n)],
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------- tabs

class _InboxTabs extends StatelessWidget {
  final _InboxTab selected;
  final int actionCount;
  final ValueChanged<_InboxTab> onChanged;

  const _InboxTabs({
    required this.selected,
    required this.actionCount,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    Widget tab(_InboxTab t, String label) {
      final on = t == selected;
      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onChanged(t),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: on ? AppColors.navy : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Supreme',
              fontSize: 14,
              fontWeight: on ? FontWeight.w600 : FontWeight.w500,
              color: on ? AppColors.navy : AppColors.muted,
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        spacing: 20,
        children: [
          tab(
            _InboxTab.action,
            actionCount > 0 ? 'Action needed · $actionCount' : 'Action needed',
          ),
          tab(_InboxTab.updates, 'Updates'),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------- items

(IconData, DsTone) _iconFor(NotificationType type) => switch (type) {
  NotificationType.jarInvite => (Icons.group_add_outlined, DsTone.lime),
  NotificationType.kyc => (Icons.badge_outlined, DsTone.negative),
  NotificationType.payoutApproval => (Icons.send_rounded, DsTone.pending),
  NotificationType.info => (Icons.notifications_none_rounded, DsTone.neutral),
};

/// Opens the jar invite preview and dispatches accept / decline / report.
Future<void> _openJarInvite(
  BuildContext context,
  NotificationModel notification,
) async {
  final result = await JarInvitePreviewSheet.show(
    context: context,
    notification: notification,
  );
  if (result == 'accept' || result == 'decline') {
    if (!context.mounted) return;
    context.read<JarInviteActionBloc>().add(
      AcceptDeclineJarInvite(
        jarId: notification.data?['jarId'] ?? '',
        action: result!,
      ),
    );
  } else if (result == 'report') {
    if (!context.mounted) return;
    final jarId = notification.data?['jarId'] ?? '';
    if (jarId.isNotEmpty) {
      final reported = await JarReportSheet.show(
        context: context,
        jarId: jarId,
      );
      if (reported == true && context.mounted) {
        AppSnackBar.show(
          context,
          message: 'Report submitted successfully',
          type: SnackBarType.success,
        );
      }
    }
  }
}

void _resubmitKyc(BuildContext context, NotificationModel notification) {
  context.read<KycBloc>().add(RequestKycSession());
  context.read<NotificationsBloc>().add(
    MarkjarInviteAsRead(notificationId: notification.id),
  );
}

void _viewPayoutApproval(BuildContext context, NotificationModel notification) {
  context.read<NotificationsBloc>().add(
    MarkjarInviteAsRead(notificationId: notification.id),
  );
  final jarId = notification.data?['jarId'] as String?;
  final transactionId =
      (notification.data?['contributionId'] ??
              notification.data?['transactionId'])
          as String?;
  if (jarId != null && transactionId != null) {
    NavigationService.navigateToContribution(
      context: context,
      jarId: jarId,
      contributionId: transactionId,
    );
  }
}

class _ActionCard extends StatelessWidget {
  final NotificationModel notification;
  const _ActionCard({required this.notification});

  @override
  Widget build(BuildContext context) {
    final (icon, tone) = _iconFor(notification.type);
    final buttons = switch (notification.type) {
      NotificationType.jarInvite => [
        DsSmallButton(
          label: 'View',
          onTap: () => _openJarInvite(context, notification),
        ),
        DsSmallButton(
          label: 'Decline',
          secondary: true,
          onTap: () {
            context.read<JarInviteActionBloc>().add(
              AcceptDeclineJarInvite(
                jarId: notification.data?['jarId'] ?? '',
                action: 'decline',
              ),
            );
          },
        ),
      ],
      NotificationType.kyc => [
        DsSmallButton(
          label: 'Resubmit ID',
          onTap: () => _resubmitKyc(context, notification),
        ),
      ],
      NotificationType.payoutApproval => [
        DsSmallButton(
          label: 'Review',
          onTap: () => _viewPayoutApproval(context, notification),
        ),
      ],
      NotificationType.info => <Widget>[],
    };

    return DsCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DsIconTile(icon, tone: tone),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.message,
                      style: DsText.small.copyWith(color: AppColors.navy),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatTimestamp(notification.createdAt),
                      style: DsText.caption,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (buttons.isNotEmpty) ...[
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.only(left: 52),
              child: Wrap(spacing: 8, runSpacing: 8, children: buttons),
            ),
          ],
        ],
      ),
    );
  }
}

class _UpdateRow extends StatelessWidget {
  final NotificationModel notification;
  const _UpdateRow({required this.notification});

  @override
  Widget build(BuildContext context) {
    final isUnread = notification.status == NotificationStatus.unread;
    final (icon, tone) = _iconFor(notification.type);
    final isPayout = notification.type == NotificationType.payoutApproval;

    return InkWell(
      onTap:
          isPayout
              ? () => _viewPayoutApproval(context, notification)
              : isUnread
              ? () => context.read<NotificationsBloc>().add(
                MarkjarInviteAsRead(notificationId: notification.id),
              )
              : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            DsIconTile(icon, tone: tone, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.message,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: DsText.rowTitle.copyWith(
                      fontSize: 14,
                      color: isUnread ? AppColors.navy : AppColors.ink2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _formatUpdateTime(notification.createdAt),
                    style: DsText.caption,
                  ),
                ],
              ),
            ),
            if (isUnread) ...[
              const SizedBox(width: 10),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.navy,
                  shape: BoxShape.circle,
                ),
              ),
            ] else if (isPayout) ...[
              const SizedBox(width: 6),
              Icon(
                Icons.chevron_right_rounded,
                size: 20,
                color: AppColors.faint,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Updates list: clock time today, "Yesterday", then "3 Oct".
String _formatUpdateTime(DateTime? dt) {
  if (dt == null) return '';
  final local = dt.toLocal();
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(local.year, local.month, local.day);
  final days = today.difference(day).inDays;
  if (days == 0) {
    return '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }
  if (days == 1) return 'Yesterday';
  return _formatDate(local, now);
}

String _formatTimestamp(DateTime? dt) {
  if (dt == null) return '';
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inSeconds < 60) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
  if (diff.inHours < 24) return '${diff.inHours} h ago';
  if (diff.inDays < 7) return '${diff.inDays} d ago';
  return _formatDate(dt.toLocal(), now);
}

String _formatDate(DateTime local, DateTime now) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final sameYear = local.year == now.year;
  return '${local.day} ${months[local.month - 1]}${sameYear ? '' : ' ${local.year}'}';
}
