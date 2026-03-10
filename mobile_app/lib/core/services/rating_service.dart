import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _keyHasPrompted = 'rating_has_prompted';

/// Requests an in-app review at appropriate moments.
/// Only ever prompts once per install.
class RatingService {
  RatingService._();
  static final RatingService instance = RatingService._();

  final _review = InAppReview.instance;

  Future<void> maybeRequestReview() async {
    try {
      if (!await _review.isAvailable()) return;

      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(_keyHasPrompted) == true) return;

      await prefs.setBool(_keyHasPrompted, true);
      await _review.requestReview();
    } catch (_) {
      // Never let rating errors surface to the user
    }
  }
}
