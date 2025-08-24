import 'package:flutter/material.dart';
import 'package:konto/core/constants/jar_groups.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/generic_picker.dart';

class JarGroupPicker {
  /// Shows a jar group picker dialog using the GenericPicker component
  static void show(
    BuildContext context, {
    required String currentJarGroup,
    required Function(String selectedGroup) onJarGroupSelected,
  }) {
    GenericPicker.showPickerDialog<String>(
      context,
      selectedValue: currentJarGroup,
      items: JarGroups.groups,
      onItemSelected: onJarGroupSelected,
      itemBuilder: (String group, bool isSelected, VoidCallback onTap) {
        return ListTile(
          onTap: onTap,
          title: Text(group, style: AppTextStyles.titleMediumS),
          trailing: isSelected ? const Icon(Icons.check) : null,
        );
      },
      recentItemBuilder: (String group, bool isSelected, VoidCallback onTap) {
        return ListTile(
          onTap: onTap,
          title: Text(group, style: AppTextStyles.titleMediumS),
          trailing: isSelected ? const Icon(Icons.check) : null,
        );
      },
      searchResultBuilder: (String group, bool isSelected, VoidCallback onTap) {
        return ListTile(
          onTap: onTap,
          title: Text(group, style: AppTextStyles.titleMediumS),
          trailing: isSelected ? const Icon(Icons.check) : null,
        );
      },
      searchFilter: (String group) => group,
      isItemSelected:
          (String group, String selectedValue) => group == selectedValue,
      title: 'Select Jar Group',
      showSearch: false, // Since there are only a few jar groups
    );
  }
}
