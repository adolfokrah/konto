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

  /// Static country options (without localization)
  static const List<SelectOption<String>> staticCountryOptions = [
    SelectOption(value: 'ghana', label: 'Ghana'),
    SelectOption(value: 'nigeria', label: 'Nigeria'),
    SelectOption(value: 'kenya', label: 'Kenya'),
    SelectOption(value: 'south_africa', label: 'South Africa'),
  ];

  /// Mobile money operator options
  static const List<SelectOption<String>> operatorOptions = [
    SelectOption(value: 'mtn', label: 'MTN Mobile Money'),
    SelectOption(value: 'vodafone', label: 'Vodafone Cash'),
    SelectOption(value: 'airteltigo', label: 'AirtelTigo Money'),
  ];
}
