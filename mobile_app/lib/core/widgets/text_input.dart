import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';

class AppTextInput extends StatelessWidget {
  final String? label;
  final String? hintText;
  final String? value;
  final TextEditingController? controller;
  final Function(String)? onChanged;
  final Widget? suffixIcon;
  final bool enabled;
  final TextInputType keyboardType;
  final int? maxLines;
  final bool filled;

  const AppTextInput({
    super.key,
    this.label,
    this.hintText,
    this.value,
    this.controller,
    this.onChanged,
    this.suffixIcon,
    this.enabled = true,
    this.keyboardType = TextInputType.text,
    this.maxLines = 1,
    this.filled = true,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveController =
        controller ?? TextEditingController(text: value);

    return Container(
      decoration: BoxDecoration(
        color:
            filled
                ? Theme.of(context).colorScheme.primary
                : Colors.transparent, // Match number_input
        borderRadius: BorderRadius.circular(AppRadius.radiusM),
        border:
            !filled
                ? Border.all(
                  color: Theme.of(
                    context,
                  ).colorScheme.outline.withValues(alpha: 0.2),
                  width: 1,
                )
                : null,
      ),
      child: Row(
        children: [
          Expanded(
            child: TextFormField(
              controller: effectiveController,
              onChanged: onChanged,
              enabled: enabled,
              keyboardType: keyboardType,
              maxLines: maxLines,
              cursorColor:
                  Theme.of(context).colorScheme.onSurface, // Match number_input
              style: TextStyles.titleMedium, // Match number_input
              decoration: InputDecoration(
                labelText: label,
                hintText: hintText,
                labelStyle: TextStyles.titleMedium.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
                floatingLabelStyle: TextStyles.titleMedium.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
                hintStyle: TextStyles.titleMedium.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
                floatingLabelBehavior: FloatingLabelBehavior.auto,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(AppSpacing.spacingXs),
                isDense: true,
              ),
            ),
          ),

          // Suffix icon if provided
          if (suffixIcon != null) ...[
            const SizedBox(width: AppSpacing.spacingM),
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.spacingXs),
              child: suffixIcon!,
            ),
          ],
        ],
      ),
    );
  }
}
