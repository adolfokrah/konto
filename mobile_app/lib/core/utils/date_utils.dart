import 'package:intl/intl.dart';
import 'package:konto/l10n/app_localizations.dart';

/// Utility class for date formatting operations
class AppDateUtils {
  /// Format timestamp similar to contribution list item
  /// Shows relative time for recent dates and exact date/time for older ones
  static String formatTimestamp(
    DateTime dateTime,
    AppLocalizations localizations,
  ) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    // If more than 2 days ago, show exact date and time
    if (difference.inDays > 2) {
      return formatExactDateTime(dateTime, localizations);
    } else if (difference.inDays > 0) {
      return difference.inDays == 1
          ? localizations.dayAgo(difference.inDays)
          : localizations.daysAgo(difference.inDays);
    } else if (difference.inHours > 0) {
      return difference.inHours == 1
          ? localizations.hourAgo(difference.inHours)
          : localizations.hoursAgo(difference.inHours);
    } else if (difference.inMinutes > 0) {
      return difference.inMinutes == 1
          ? localizations.minuteAgo(difference.inMinutes)
          : localizations.minutesAgo(difference.inMinutes);
    } else {
      return localizations.justNow;
    }
  }

  /// Format the exact date and time for contributions older than 2 days
  /// Returns format like: "Aug 23, 2025, 4:43 PM"
  static String formatExactDateTime(
    DateTime dateTime,
    AppLocalizations localizations,
  ) {
    // Use Flutter's built-in date and time formatting with proper locale
    final dateFormatter = DateFormat.yMMMd(localizations.localeName);
    final timeFormatter = DateFormat.jm(localizations.localeName);

    final formattedDate = dateFormatter.format(dateTime);
    final formattedTime = timeFormatter.format(dateTime);

    return '$formattedDate, $formattedTime';
  }

  /// Format date only (without time) for display purposes
  /// Returns format like: "Aug 23, 2025"
  static String formatDateOnly(
    DateTime dateTime,
    AppLocalizations localizations,
  ) {
    final dateFormatter = DateFormat.yMMMd(localizations.localeName);
    return dateFormatter.format(dateTime);
  }

  /// Format time only for display purposes
  /// Returns format like: "4:43 PM"
  static String formatTimeOnly(
    DateTime dateTime,
    AppLocalizations localizations,
  ) {
    final timeFormatter = DateFormat.jm(localizations.localeName);
    return timeFormatter.format(dateTime);
  }

  /// Check if a date is today
  static bool isToday(DateTime dateTime) {
    final now = DateTime.now();
    return dateTime.year == now.year &&
        dateTime.month == now.month &&
        dateTime.day == now.day;
  }

  /// Check if a date is yesterday
  static bool isYesterday(DateTime dateTime) {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return dateTime.year == yesterday.year &&
        dateTime.month == yesterday.month &&
        dateTime.day == yesterday.day;
  }

  /// Get a safe formatted timestamp that handles null dates
  /// Returns "Unknown" if the date is null
  static String formatTimestampSafe(
    DateTime? dateTime,
    AppLocalizations localizations, {
    String fallback = 'Unknown',
  }) {
    if (dateTime == null) return fallback;
    return formatTimestamp(dateTime, localizations);
  }
}
