import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/icon_button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/services/feedback_service.dart';

class FeedbackActionButton extends StatelessWidget {
  final Size? size;
  final Key? buttonKey;

  const FeedbackActionButton({
    super.key,
    this.size = const Size(40, 40),
    this.buttonKey,
  });

  @override
  Widget build(BuildContext context) {
    return AppIconButton(
      key: buttonKey ?? const Key('feedback_button'),
      opacity: 0.8,
      onPressed: () async {
        try {
          await FeedbackService.openFeedbackForm();
        } catch (e) {
          if (context.mounted) {
            AppSnackBar.show(
              context,
              message: 'Could not open feedback form. Please try again.',
              type: SnackBarType.error,
            );
          }
        }
      },
      icon: Icons.send,
      size: size!,
    );
  }
}
