import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class Country {
  final String name;
  final String code;
  final String flag;

  const Country({required this.name, required this.code, required this.flag});
}

class NumberCountryPicker extends StatelessWidget {
  final String selectedCountryCode;
  final Function(Country country) onCountrySelected;

  const NumberCountryPicker({
    super.key,
    required this.selectedCountryCode,
    required this.onCountrySelected,
  });

  static const List<Country> _countries = [
    Country(name: 'Ghana', code: '+233', flag: '🇬🇭'),
    Country(name: 'United States', code: '+1', flag: '🇺🇸'),
    Country(name: 'United Kingdom', code: '+44', flag: '🇬🇧'),
    Country(name: 'Nigeria', code: '+234', flag: '🇳🇬'),
    Country(name: 'South Africa', code: '+27', flag: '🇿🇦'),
    Country(name: 'Kenya', code: '+254', flag: '🇰🇪'),
    Country(name: 'Canada', code: '+1', flag: '🇨🇦'),
    Country(name: 'Germany', code: '+49', flag: '🇩🇪'),
    Country(name: 'France', code: '+33', flag: '🇫🇷'),
    Country(name: 'Australia', code: '+61', flag: '🇦🇺'),
  ];

  static Widget _buildCountryTile(
    Country country,
    bool isSelected,
    Function(Country) onCountrySelected, [
    BuildContext? context,
  ]) {
    return DsRow(
      leading: Text(country.flag, style: const TextStyle(fontSize: 22)),
      title:
          context != null
              ? getLocalizedCountryName(context, country.name)
              : country.name,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(country.code, style: DsText.caption),
          const SizedBox(width: 12),
          DsRadio(selected: isSelected),
        ],
      ),
      onTap: () => onCountrySelected(country),
    );
  }

  static void showCountryPickerDialog(
    BuildContext context, {
    required String selectedCountryCode,
    required Function(Country country) onCountrySelected,
  }) {
    final localizations = AppLocalizations.of(context)!;

    GenericPicker.showPickerDialog<Country>(
      context,
      selectedValue: selectedCountryCode,
      items: _countries,
      onItemSelected: onCountrySelected,
      title: localizations.country,
      searchHint: localizations.searchCountries,
      recentSectionTitle: localizations.recentSelection,
      otherSectionTitle: localizations.otherCountries,
      searchResultsTitle: localizations.searchResults,
      noResultsMessage: localizations.noCountriesFound,
      searchFilter:
          (country) =>
              '${getLocalizedCountryName(context, country.name)} ${country.code}',
      isItemSelected: (country, selectedCode) => country.code == selectedCode,
      itemBuilder:
          (country, isSelected, onTap) =>
              _buildCountryTile(country, isSelected, (_) => onTap(), context),
      recentItemBuilder:
          (country, isSelected, onTap) =>
              _buildCountryTile(country, isSelected, (_) => onTap(), context),
      searchResultBuilder:
          (country, isSelected, onTap) =>
              _buildCountryTile(country, isSelected, (_) => onTap(), context),
    );
  }

  void _showCountryPickerDialog(BuildContext context) {
    NumberCountryPicker.showCountryPickerDialog(
      context,
      selectedCountryCode: selectedCountryCode,
      onCountrySelected: onCountrySelected,
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showCountryPickerDialog(context),
      child: const Icon(Icons.chevron_right, size: 18),
    );
  }

  static Country? getCountryByCode(String code) {
    try {
      return _countries.firstWhere((country) => country.code == code);
    } catch (e) {
      return null;
    }
  }

  static Country get defaultCountry => _countries.first;

  // Helper method to get localized country name
  static String getLocalizedCountryName(
    BuildContext context,
    String countryName,
  ) {
    final localizations = AppLocalizations.of(context)!;

    switch (countryName) {
      case 'Ghana':
        return localizations.countryGhana;
      case 'United States':
        return localizations.countryUnitedStates;
      case 'France':
        return localizations.countryFrance;
      case 'Germany':
        return localizations.countryGermany;
      default:
        return countryName; // Fallback to original name
    }
  }
}
