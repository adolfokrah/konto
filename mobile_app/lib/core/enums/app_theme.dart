/// Theme options for the app
enum AppTheme {
  light('light'),
  dark('dark'),
  system('system');

  const AppTheme(this.value);
  final String value;

  static AppTheme fromString(String value) {
    switch (value) {
      case 'light':
        return AppTheme.light;
      case 'dark':
        return AppTheme.dark;
      case 'system':
        return AppTheme.system;
      default:
        return AppTheme.system; // Default to system theme
    }
  }

  @override
  String toString() => value;
}
