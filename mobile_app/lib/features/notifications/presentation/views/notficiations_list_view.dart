import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/features/notifications/logic/bloc/jar_invite_action_bloc.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/notifications/data/models/notification_model.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_loading_overlay/flutter_loading_overlay.dart';
import 'package:Hoga/features/notifications/presentation/widgets/notification_action_button.dart';

// NOTE: Class name has a typo (Notficiations). Retained to avoid breaking existing references.
// Consider renaming to `NotificationsListView` across the project when convenient.
class NotficiationsListView extends StatelessWidget {
  const NotficiationsListView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: MultiBlocListener(
        listeners: [
          BlocListener<JarInviteActionBloc, JarInviteActionState>(
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
                // Optionally show a loading indicator or disable interactions
                // For simplicity, we skip this here
                startLoading();
              } else {
                stopLoading();
              }
            },
          ),
        ],
        child: BlocBuilder<JarInviteActionBloc, JarInviteActionState>(
          builder: (context, acceptDeclineState) {
            return BlocBuilder<NotificationsBloc, NotificationsState>(
              builder: (context, state) {
                if (state is NotificationsLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is NotificationsError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.error_outline,
                            size: 48,
                            color: Colors.red,
                          ),
                          const SizedBox(height: 12),
                          Text(state.message, textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed:
                                () => context.read<NotificationsBloc>().add(
                                  FetchNotifications(limit: 20, page: 1),
                                ),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                if (state is NotificationsLoaded) {
                  final notifications = state.notifications;
                  if (notifications.isEmpty) {
                    return const Center(child: Text('No notifications yet'));
                  }
                  return ListView.builder(
                    itemCount: notifications.length,
                    padding: EdgeInsets.symmetric(
                      horizontal: AppSpacing.spacingXs,
                    ),
                    itemBuilder: (context, index) {
                      final n = notifications[index];
                      return AppCard(
                        variant: CardVariant.secondary,
                        margin: EdgeInsets.only(
                          top: index == 0 ? AppSpacing.spacingM : 0,
                          bottom: AppSpacing.spacingM,
                        ),
                        child: BuildNotificationType(notification: n),
                      );
                    },
                  );
                }
                // Fallback (e.g., initial state) -> trigger fetch & show loader
                context.read<NotificationsBloc>().add(
                  FetchNotifications(limit: 20, page: 1),
                );
                return const Center(child: CircularProgressIndicator());
              },
            );
          },
        ),
      ),
    );
  }
}

// Helper widget to visually differentiate notification types.
class BuildNotificationType extends StatelessWidget {
  final NotificationModel notification;
  const BuildNotificationType({super.key, required this.notification});

  @override
  Widget build(BuildContext context) {
    final content = Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(child: Text(notification.message)),
        Text(
          _formatTimestamp(notification.createdAt),
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.grey),
        ),
      ],
    );
    switch (notification.type) {
      case NotificationType.jarInvite:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            content,
            if (notification.status == NotificationStatus.unread) ...[
              Row(
                children: [
                  NotificationActionButton(
                    label: 'Accept',
                    onTap: () {
                      context.read<JarInviteActionBloc>().add(
                        AcceptDeclineJarInvite(
                          jarId: notification.data?['jarId'] ?? '',
                          action: 'accept',
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: AppSpacing.spacingM),
                  NotificationActionButton(
                    label: 'Decline',
                    onTap: () {
                      context.read<JarInviteActionBloc>().add(
                        AcceptDeclineJarInvite(
                          jarId: notification.data?['jarId'] ?? '',
                          action: 'decline',
                        ),
                      );
                    },
                    textColor: Colors.red,
                  ),
                ],
              ),
            ],
          ],
        );
      case NotificationType.kycFailed:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            content,
            if (notification.status == NotificationStatus.unread) ...[
              const SizedBox(height: AppSpacing.spacingS),
              NotificationActionButton(
                label: 'Re submit KYC',
                onTap: () {
                  context.read<KycBloc>().add(RequestKycSession());
                  final notificationsBloc = context.read<NotificationsBloc>();
                  notificationsBloc.add(
                    MarkjarInviteAsRead(notificationId: notification.id),
                  );
                },
              ),
            ],
          ],
        );
      case NotificationType.info:
        return content;
    }
  }
}

String _formatTimestamp(DateTime? dt) {
  if (dt == null) return '';
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inSeconds < 60) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return '${dt.year}/${dt.month.toString().padLeft(2, '0')}/${dt.day.toString().padLeft(2, '0')}';
}
