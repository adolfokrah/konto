import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
import 'package:Hoga/l10n/app_localizations.dart';

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
      child: Opacity(
        opacity: enabled ? 1.0 : 0.6,
        child: Container(
          constraints: const BoxConstraints(minHeight: 58),
          padding: const EdgeInsets.fromLTRB(16, 9, 12, 9),
          decoration: BoxDecoration(
            color: filled ? AppColors.surfaceWhite : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.line),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Label sits on top once there's a value
                    if (label != null && hasValue) ...[
                      Text(
                        label!,
                        style: DsText.caption.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                    ],
                    Text(
                      effectiveDisplayText ?? label ?? hintText ?? '',
                      style:
                          hasValue
                              ? DsText.rowTitle.copyWith(fontSize: 16)
                              : DsText.body.copyWith(color: AppColors.muted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              suffixIcon ??
                  const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 22,
                    color: AppColors.muted,
                  ),
            ],
          ),
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
      title: label ?? hintText,
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

    return DsRow(
      leading: option.icon,
      title: option.label,
      trailing: DsRadio(selected: isSelected),
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
