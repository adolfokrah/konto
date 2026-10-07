import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/jar_groups.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
import 'package:Hoga/l10n/app_localizations.dart';

/// Emoji shown next to a jar category, as in the redesign pickers.
String jarGroupEmoji(String group) {
  final g = group.toLowerCase();
  if (g.contains('wedding') || g.contains('engagement')) return '💍';
  if (g.contains('funeral')) return '🕊️';
  if (g.contains('church')) return '⛪';
  if (g.contains('susu') || g.contains('saving')) return '🤝';
  if (g.contains('birthday')) return '🎂';
  if (g.contains('naming') || g.contains('baby')) return '👶';
  if (g.contains('part')) return '🎉';
  if (g.contains('trip')) return '✈️';
  if (g.contains('alumni') || g.contains('school') || g.contains('graduat')) {
    return '🎓';
  }
  if (g.contains('medical') || g.contains('emergency')) return '🩺';
  if (g.contains('family') || g.contains('reunion')) return '👨‍👩‍👧';
  if (g.contains('charity') || g.contains('donation')) return '💛';
  if (g.contains('community')) return '🏘️';
  if (g.contains('business') || g.contains('investment')) return '💼';
  if (g.contains('rent') || g.contains('house')) return '🏠';
  if (g.contains('sport')) return '⚽';
  if (g.contains('anniversar')) return '🥂';
  if (g.contains('corporate')) return '🏢';
  if (g.contains('cultural') || g.contains('festival')) return '🥁';
  return '🫙';
}

class JarGroupPicker {
  /// Shows a jar group picker dialog using the GenericPicker component
  static void show(
    BuildContext context, {
    required String currentJarGroup,
    required Function(String selectedGroup) onJarGroupSelected,
  }) {
    Widget row(String group, bool isSelected, VoidCallback onTap) {
      return InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Text(jarGroupEmoji(group), style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(child: Text(group, style: DsText.rowTitle)),
              DsRadio(selected: isSelected),
            ],
          ),
        ),
      );
    }

    GenericPicker.showPickerDialog<String>(
      context,
      selectedValue: currentJarGroup,
      items: JarGroups.groups,
      onItemSelected: onJarGroupSelected,
      showSearch: true,
      itemBuilder: row,
      recentItemBuilder: row,
      searchResultBuilder: row,
      searchFilter: (String group) => group,
      isItemSelected:
          (String group, String selectedValue) => group == selectedValue,
      title: AppLocalizations.of(context)!.selectJarGroup,
    );
  }
}
