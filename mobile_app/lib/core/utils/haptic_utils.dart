import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Utility class for haptic feedback throughout the app
class HapticUtils {
  /// Light haptic feedback - for general button taps, switches, etc.
  /// Feels like iPhone button tap
  static void light() {
    HapticFeedback.lightImpact();
  }

  /// Medium haptic feedback - for important actions like confirmations
  /// Stronger than light, used for moderate importance actions
  static void medium() {
    HapticFeedback.mediumImpact();
  }

  /// Heavy haptic feedback - for critical actions like deletions, errors
  /// Strongest haptic feedback available
  static void heavy() {
    HapticFeedback.heavyImpact();
  }

  /// Selection haptic feedback - for scrolling through lists, pickers
  /// Quick light feedback for selection changes
  static void selection() {
    HapticFeedback.selectionClick();
  }

  /// Vibrate haptic feedback - platform-specific vibration
  /// Fallback vibration for older devices
  static void vibrate() {
    HapticFeedback.vibrate();
  }
}
