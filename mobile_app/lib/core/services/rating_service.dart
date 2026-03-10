import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _keyLastPrompted = 'rating_last_prompted_ms';
const _keyNeverAsk = 'rating_never_ask';
const _cooldownDays = 30;

/// Requests an in-app review at appropriate moments.
///
/// Guards:
/// - 30-day cooldown between prompts
/// - Respects system-level "don't ask again" via [_keyNeverAsk]
class RatingService {
  RatingService._();
  static final RatingService instance = RatingService._();

  final _review = InAppReview.instance;

  /// Call this after a high-satisfaction action (e.g. successful withdrawal).
  /// Silently skips if conditions are not met.
  Future<void> maybeRequestReview() async {
    try {
      if (!await _review.isAvailable()) return;

      final prefs = await SharedPreferences.getInstance();

      if (prefs.getBool(_keyNeverAsk) == true) return;

      final lastMs = prefs.getInt(_keyLastPrompted);
      if (lastMs != null) {
        final daysSince =
            DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(lastMs)).inDays;
        if (daysSince < _cooldownDays) return;
      }

      await prefs.setInt(_keyLastPrompted, DateTime.now().millisecondsSinceEpoch);
      await _review.requestReview();
    } catch (_) {
      // Never let rating errors surface to the user
    }
  }
}
