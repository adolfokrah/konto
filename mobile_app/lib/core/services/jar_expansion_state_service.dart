import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class JarExpansionStateService {
  static const String _expansionStateKey = 'jar_expansion_state';
  static JarExpansionStateService? _instance;
  static SharedPreferences? _prefs;

  JarExpansionStateService._();

  static Future<JarExpansionStateService> getInstance() async {
    _instance ??= JarExpansionStateService._();
    _prefs ??= await SharedPreferences.getInstance();
    return _instance!;
  }

  /// Get the set of expanded group IDs
  Future<Set<String>> getExpandedGroupIds() async {
    try {
      final String? expansionStateJson = _prefs?.getString(_expansionStateKey);
      if (expansionStateJson == null) {
        return <String>{};
      }

      final List<dynamic> expansionStateList = json.decode(expansionStateJson);
      return expansionStateList.cast<String>().toSet();
    } catch (e) {
      debugPrint('Error reading expansion state: $e');
      return <String>{};
    }
  }

  /// Save the set of expanded group IDs
  Future<void> setExpandedGroupIds(Set<String> expandedGroupIds) async {
    try {
      final String expansionStateJson = json.encode(expandedGroupIds.toList());
      await _prefs?.setString(_expansionStateKey, expansionStateJson);
    } catch (e) {
      debugPrint('Error saving expansion state: $e');
    }
  }

  /// Toggle the expansion state of a specific group
  Future<void> toggleGroupExpansion(String groupId) async {
    final Set<String> currentExpanded = await getExpandedGroupIds();

    if (currentExpanded.contains(groupId)) {
      currentExpanded.remove(groupId);
    } else {
      currentExpanded.add(groupId);
    }

    await setExpandedGroupIds(currentExpanded);
  }

  /// Check if a specific group is expanded
  Future<bool> isGroupExpanded(String groupId) async {
    final Set<String> expandedGroups = await getExpandedGroupIds();
    return expandedGroups.contains(groupId);
  }

  /// Clear all expansion state (useful for debugging or reset)
  Future<void> clearExpansionState() async {
    await _prefs?.remove(_expansionStateKey);
  }

  /// Clean up stale expansion state for groups that no longer exist
  /// This should be called whenever jar groups are loaded to ensure
  /// we don't keep expansion state for deleted groups
  Future<void> cleanupStaleExpansionState(List<String> validGroupNames) async {
    try {
      final Set<String> currentExpanded = await getExpandedGroupIds();
      final Set<String> validGroupNamesSet = validGroupNames.toSet();

      // Filter out any expanded group IDs that are no longer valid
      final Set<String> cleanedExpanded =
          currentExpanded
              .where((groupId) => validGroupNamesSet.contains(groupId))
              .toSet();

      // Only update storage if we actually removed some stale entries
      if (cleanedExpanded.length != currentExpanded.length) {
        await setExpandedGroupIds(cleanedExpanded);
        debugPrint(
          'Cleaned up ${currentExpanded.length - cleanedExpanded.length} stale expansion states',
        );
      }
    } catch (e) {
      debugPrint('Error cleaning up stale expansion state: $e');
    }
  }
}
