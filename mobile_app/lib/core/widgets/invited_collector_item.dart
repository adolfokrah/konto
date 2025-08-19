import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/small_button.dart';
import 'package:konto/features/jars/data/models/jar_model.dart';

class InvitedCollectorItem extends StatelessWidget {
  final InvitedCollector invitedCollector;
  const InvitedCollectorItem({super.key, required this.invitedCollector});

  /// Generate initials from the invited collector's name
  String _getInitials(String? name) {
    if (name == null || name.isEmpty) {
      return '?';
    }

    final words = name.trim().split(' ');
    if (words.length == 1) {
      return words[0].substring(0, 1).toUpperCase();
    } else {
      return '${words[0].substring(0, 1)}${words[1].substring(0, 1)}'
          .toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.all(0),
      leading: CircleAvatar(
        child: Text(
          _getInitials(invitedCollector.name),
          style: TextStyles.titleBoldM.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
      title: Text(
        invitedCollector.name ?? 'Unknown',
        style: Theme.of(context).textTheme.titleMedium,
      ),
      trailing:
          invitedCollector.status == 'pending'
              ? AppSmallButton(
                padding: EdgeInsets.symmetric(
                  horizontal: AppSpacing.spacingS,
                  vertical: 6,
                ),
                onPressed: () {},
                child: const Text("Remind", style: TextStyles.titleMediumS),
              )
              : const SizedBox.shrink(),
    );
  }
}
