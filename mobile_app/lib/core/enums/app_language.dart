/// Supported languages for the app
enum AppLanguage {
  english('en'),
  french('fr');

  const AppLanguage(this.value);
  final String value;

  static AppLanguage fromString(String value) {
    switch (value) {
      case 'en':
        return AppLanguage.english;
      case 'fr':
        return AppLanguage.french;
      default:
        return AppLanguage.english; // Default to English
    }
  }

  /// Get the display name for the language
  String get displayName {
    switch (this) {
      case AppLanguage.english:
        return 'English';
      case AppLanguage.french:
        return 'French';
    }
  }

  /// Get the locale code for internationalization
  String get localeCode => value;

  @override
  String toString() => value;
}
