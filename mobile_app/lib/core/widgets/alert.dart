import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/card.dart';

class Alert extends StatelessWidget {
  final String message;
  final VoidCallback? onTap;
  final String actionText;
  const Alert({
    super.key,
    required this.message,
    this.onTap,
    required this.actionText,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      variant: CardVariant.secondary,
      child: Column(
        children: [
          Text(message),
          InkWell(onTap: onTap, child: Text(actionText)),
        ],
      ),
    );
  }
}
