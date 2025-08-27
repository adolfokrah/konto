import 'package:konto/core/widgets/select_input.dart';
import 'package:konto/l10n/app_localizations.dart';

class AppSelectOptions {
  // Private constructor to prevent instantiation
  AppSelectOptions._();

  /// Country options for forms
  static List<SelectOption<String>> getCountryOptions(
    AppLocalizations localizations,
  ) {
    return [
      SelectOption(value: 'ghana', label: localizations.countryGhana),
      SelectOption(value: 'nigeria', label: localizations.countryNigeria),
    ];
  }
}
