import 'package:Hoga/route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/notifications/data/models/notification_model.dart';
import 'package:Hoga/core/widgets/icon_button.dart';

/// Reusable notification icon button with optional red badge indicator.
/// Wraps an [IconButton]-like appearance with a stack badge.
class NotificationIconButton extends StatelessWidget {
  const NotificationIconButton({super.key});

  // Internal styling constants (tweak here if needed globally)
  static const double _badgeSize = 12;
  static const double _buttonSize = 40; // visual size hint for badge placement
  static const Color _badgeColor = Colors.red;
  static const IconData _icon = Icons.notifications;

  @override
  Widget build(BuildContext context) {
    // If NotificationsBloc is not provided in the tree (e.g. test environment),
    // fall back to a plain icon button to avoid ProviderNotFoundException.
    NotificationsBloc? bloc;
    try {
      bloc = context.read<NotificationsBloc>();
    } catch (_) {
      bloc = null;
    }

    if (bloc == null) {
      return AppIconButton(
        key: const Key('notifications_button'),
        icon: _icon,
        size: const Size(_buttonSize, _buttonSize),
        onPressed:
            () => Navigator.of(context).pushNamed(AppRoutes.notifications),
      );
    }

    return BlocBuilder<NotificationsBloc, NotificationsState>(
      buildWhen: (prev, curr) => curr is NotificationsLoaded,
      builder: (context, state) {
        int unreadCount = 0;
        if (state is NotificationsLoaded) {
          unreadCount =
              state.notifications
                  .where((n) => n.status == NotificationStatus.unread)
                  .length;
        }
        final showBadge = unreadCount > 0;
        return Stack(
          clipBehavior: Clip.none,
          children: [
            AppIconButton(
              key: const Key('notifications_button'),
              icon: _icon,
              size: const Size(_buttonSize, _buttonSize),
              onPressed:
                  () =>
                      Navigator.of(context).pushNamed(AppRoutes.notifications),
            ),
            if (showBadge)
              Positioned(
                right: 6,
                top: 6,
                child: CircleAvatar(
                  radius: _badgeSize * 0.5,
                  backgroundColor: _badgeColor,
                ),
              ),
          ],
        );
      },
    );
  }
}
