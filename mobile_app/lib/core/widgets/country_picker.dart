import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/searh_input.dart';
import 'package:konto/l10n/app_localizations.dart';

class Country {
  final String name;
  final String code;
  final String flag;

  const Country({
    required this.name,
    required this.code,
    required this.flag,
  });
}

class CountryPicker extends StatelessWidget {
  final String selectedCountryCode;
  final Function(Country country) onCountrySelected;

  const CountryPicker({
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

  static Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingM),
      child: Text(
        title,
        style: TextStyles.titleBoldLg,
      ),
    );
  }

  static Widget _buildCountryTile(Country country, bool isSelected, Function(Country) onCountrySelected, [BuildContext? context]) {
    return Column(
      children: [
        ListTile(
          contentPadding: const EdgeInsets.all(0),
          title: Text(
            context != null ? getLocalizedCountryName(context, country.name) : country.name,
            style: TextStyles.titleMediumM,
          ),
          trailing: Text(
                country.code,
                style: TextStyles.titleRegularSm,
              ),
          onTap: () {
            onCountrySelected(country);
          },
        ),
      ],
    );
  }

  static void showCountryPickerDialog(
    BuildContext context, {
    required String selectedCountryCode,
    required Function(Country country) onCountrySelected,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return _CountryPickerContent(
          selectedCountryCode: selectedCountryCode,
          onCountrySelected: onCountrySelected,
        );
      },
    );
  }

  void _showCountryPickerDialog(BuildContext context) {
    CountryPicker.showCountryPickerDialog(
      context,
      selectedCountryCode: selectedCountryCode,
      onCountrySelected: onCountrySelected,
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showCountryPickerDialog(context),
      child: const Icon(
        Icons.chevron_right,
        size: 18,
      ),
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
  static String getLocalizedCountryName(BuildContext context, String countryName) {
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

class _CountryPickerContent extends StatefulWidget {
  final String selectedCountryCode;
  final Function(Country country) onCountrySelected;

  const _CountryPickerContent({
    required this.selectedCountryCode,
    required this.onCountrySelected,
  });

  @override
  State<_CountryPickerContent> createState() => _CountryPickerContentState();
}

class _CountryPickerContentState extends State<_CountryPickerContent> {
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Country> get _filteredCountries {
    if (_searchQuery.isEmpty) {
      return CountryPicker._countries;
    }
    return CountryPicker._countries.where((country) {
      return country.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
             country.code.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  int _getItemCount() {
    final selectedCountry = CountryPicker.getCountryByCode(widget.selectedCountryCode);
    final filteredCountries = _filteredCountries;
    final otherCountries = filteredCountries.where((country) => country.code != widget.selectedCountryCode).toList();
    final selectedCountryInResults = selectedCountry != null && filteredCountries.contains(selectedCountry);
    
    int count = 0;
    
    // Recent Selection section (when no search) OR selected country in search results
    if ((_searchQuery.isEmpty && selectedCountryInResults) || 
        (_searchQuery.isNotEmpty && selectedCountryInResults)) {
      count += 2; // header + selected country
    }
    
    // Other Countries section
    if (otherCountries.isNotEmpty) {
      count += 1; // header
      count += otherCountries.length; // other countries
    }
    
    return count;
  }

  Widget _buildListItem(BuildContext context, int index) {
    final localizations = AppLocalizations.of(context)!;
    final selectedCountry = CountryPicker.getCountryByCode(widget.selectedCountryCode);
    final filteredCountries = _filteredCountries;
    final otherCountries = filteredCountries.where((country) => country.code != widget.selectedCountryCode).toList();
    final selectedCountryInResults = selectedCountry != null && filteredCountries.contains(selectedCountry);
    
    int currentIndex = 0;
    
    // Recent Selection section (when no search) OR selected country in search results
    if ((_searchQuery.isEmpty && selectedCountryInResults) || 
        (_searchQuery.isNotEmpty && selectedCountryInResults)) {
      if (index == currentIndex) {
        // Header changes based on search state
        final headerTitle = _searchQuery.isEmpty ? localizations.recentSelection : localizations.selectedCountry;
        return CountryPicker._buildSectionHeader(headerTitle);
      }
      currentIndex++;
      
      if (index == currentIndex) {
        // Selected country
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary,
            borderRadius: BorderRadius.circular(AppRadius.radiusM),
          ),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
          child: CountryPicker._buildCountryTile(selectedCountry, true, _onCountrySelected, context),
        );
      }
      currentIndex++;
    }
    
    // Other Countries section
    if (otherCountries.isNotEmpty) {
      if (index == currentIndex) {
        // Other Countries header
        final headerTitle = _searchQuery.isEmpty ? localizations.otherCountries : 
                           selectedCountryInResults ? localizations.otherResults : localizations.searchResults;
        return CountryPicker._buildSectionHeader(headerTitle);
      }
      currentIndex++;
      
      // Other countries
      final otherCountryIndex = index - currentIndex;
      if (otherCountryIndex >= 0 && otherCountryIndex < otherCountries.length) {
        final isFirst = otherCountryIndex == 0;
        final isLast = otherCountryIndex == otherCountries.length - 1;
        
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(isFirst ? AppRadius.radiusM : 0),
              topRight: Radius.circular(isFirst ? AppRadius.radiusM : 0),
              bottomLeft: Radius.circular(isLast ? AppRadius.radiusM : 0),
              bottomRight: Radius.circular(isLast ? AppRadius.radiusM : 0),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
          child: CountryPicker._buildCountryTile(
            otherCountries[otherCountryIndex], 
            false, // Never show as selected in the "Other Countries" section
            _onCountrySelected,
            context
          ),
        );
      }
    }
    
    return const SizedBox.shrink();
  }

  void _onCountrySelected(Country country) {
    widget.onCountrySelected(country);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.9, // Allow near full screen
      snap: true,
      snapSizes: const [0.9], // Better snap positions
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(AppRadius.radiusM),
              topRight: Radius.circular(AppRadius.radiusM),
            ),
          ),
          padding: const EdgeInsets.only(top: AppSpacing.spacingXs, left: AppSpacing.spacingM, right: AppSpacing.spacingM),
          child: Column(
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.only(bottom: AppSpacing.spacingXs),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Search Input
              SearchInput(
                controller: _searchController,
                hintText: localizations.searchCountries,
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
              const SizedBox(height: AppSpacing.spacingM),
              // Country list - Use Flexible to handle overflow gracefully
              Flexible(
                child: _getItemCount() == 0
                    ? Center(
                        child: Text(
                          localizations.noCountriesFound,
                          style: TextStyles.titleMedium.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                          ),
                        ),
                      )
                    : ListView.builder(
                        controller: scrollController,
                        padding: EdgeInsets.zero,
                        itemCount: _getItemCount(),
                        itemBuilder: (context, index) {
                          return _buildListItem(context, index);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
