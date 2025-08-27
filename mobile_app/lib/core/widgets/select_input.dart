import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/generic_picker.dart';
import 'package:konto/l10n/app_localizations.dart';

class SelectInput<T> extends StatelessWidget {
  final String? label;
  final String? hintText;
  final T? value;
  final String? displayText;
  final List<SelectOption<T>> options;
  final Function(T value)? onChanged;
  final Widget? suffixIcon;
  final bool enabled;
  final bool filled;

  const SelectInput({
    super.key,
    this.label,
    this.hintText,
    this.value,
    this.displayText,
    required this.options,
    this.onChanged,
    this.suffixIcon,
    this.enabled = true,
    this.filled = true,
  });

  @override
  Widget build(BuildContext context) {
    final hasValue = value != null || displayText != null;
    final effectiveDisplayText =
        displayText ??
        (value != null
            ? options
                .firstWhere(
                  (option) => option.value == value,
                  orElse:
                      () => SelectOption(
                        value: value as T,
                        label: value.toString(),
                      ),
                )
                .label
            : null);

    return GestureDetector(
      onTap: enabled ? () => _showSelectionBottomSheet(context) : null,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.spacingXs),
        decoration: BoxDecoration(
          color:
              filled
                  ? Theme.of(context).colorScheme.primary
                  : Colors.transparent,
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Label (always show at top when there's a value or label)
                  if (label != null && hasValue)
                    Text(
                      label!,
                      style: TextStyles.titleRegularXs.copyWith(
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),

                  // Small gap between label and value
                  if (label != null && hasValue) const SizedBox(height: 2),

                  // Display value or placeholder
                  Opacity(
                    opacity: enabled ? 1.0 : 0.6,
                    child: Text(
                      effectiveDisplayText ?? label ?? hintText ?? '',
                      style: TextStyles.titleMedium.copyWith(
                        color: Theme.of(context).colorScheme.onSurface
                            .withValues(alpha: hasValue ? 1.0 : 0.6),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Suffix icon (chevron or custom)
            Opacity(
              opacity: enabled ? 1.0 : 0.6,
              child:
                  suffixIcon ?? const Icon(Icons.keyboard_arrow_down, size: 20),
            ),
          ],
        ),
      ),
    );
  }

  void _showSelectionBottomSheet(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    GenericPicker.showPickerDialog<T>(
      context,
      selectedValue: value?.toString() ?? '',
      items: options.map((option) => option.value).toList(),
      onItemSelected: (selectedValue) {
        onChanged?.call(selectedValue);
      },
      searchHint: localizations.searchOptions,
      recentSectionTitle: localizations.recentSelection,
      otherSectionTitle: localizations.allOptions,
      searchResultsTitle: localizations.searchResults,
      noResultsMessage: localizations.noOptionsFound,
      maxHeight: 0.9,
      searchFilter: (item) => _getOptionLabel(item),
      isItemSelected:
          (item, selectedString) => item.toString() == selectedString,
      itemBuilder:
          (item, isSelected, onTap) =>
              _buildOptionTile(item, isSelected, onTap),
      recentItemBuilder:
          (item, isSelected, onTap) =>
              _buildOptionTile(item, isSelected, onTap),
      searchResultBuilder:
          (item, isSelected, onTap) =>
              _buildOptionTile(item, isSelected, onTap),
    );
  }

  String _getOptionLabel(T item) {
    final option = options.firstWhere(
      (opt) => opt.value == item,
      orElse: () => SelectOption(value: item, label: item.toString()),
    );
    return option.label;
  }

  Widget _buildOptionTile(T item, bool isSelected, VoidCallback onTap) {
    final option = options.firstWhere(
      (opt) => opt.value == item,
      orElse: () => SelectOption(value: item, label: item.toString()),
    );

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: option.icon,
      title: Text(
        option.label,
        style: TextStyles.titleMedium.copyWith(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      trailing: isSelected ? const Icon(Icons.check, size: 18) : null,
      onTap: onTap,
    );
  }
}

class SelectOption<T> {
  final T value;
  final String label;
  final Widget? icon;

  const SelectOption({required this.value, required this.label, this.icon});
}
