import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/divider.dart';
import 'package:konto/core/widgets/country_picker.dart';

class NumberInput extends StatefulWidget {
  final String? selectedCountry;
  final String? countryCode;
  final String? phoneNumber;
  final Function(String country, String code)? onCountryChanged;
  final Function(String phoneNumber)? onPhoneNumberChanged;
  final String placeholder;

  const NumberInput({
    super.key,
    this.selectedCountry = 'Ghana',
    this.countryCode = '+233',
    this.phoneNumber,
    this.onCountryChanged,
    this.onPhoneNumberChanged,
    this.placeholder = 'Phone number',
  });

  @override
  State<NumberInput> createState() => _NumberInputState();
}

class _NumberInputState extends State<NumberInput> {
  late TextEditingController _phoneController;
  late String _selectedCountry;
  late String _countryCode;

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController(text: widget.phoneNumber);
    
    // Get country from country picker or use defaults
    final country = CountryPicker.getCountryByCode(widget.countryCode ?? '+233');
    _selectedCountry = country?.name ?? widget.selectedCountry ?? 'Ghana';
    _countryCode = country?.code ?? widget.countryCode ?? '+233';
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  void _onCountrySelected(Country country) {
    setState(() {
      _selectedCountry = country.name;
      _countryCode = country.code;
    });
    widget.onCountryChanged?.call(_selectedCountry, _countryCode);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary, // theme-aware primary color
        borderRadius: BorderRadius.circular(AppRadius.radiusM),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row with country and chevron
          InkWell(
            onTap: () {
              CountryPicker.showCountryPickerDialog(
                context,
                selectedCountryCode: _countryCode,
                onCountrySelected: _onCountrySelected,
              );
            },
            child: Container(
              width: double.infinity,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _selectedCountry,
                    style: TextStyles.titleMedium,
                  ),
                  const Icon(
                    Icons.chevron_right,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: AppSpacing.spacingXs),
          
          const AppDivider(),
          
          const SizedBox(height: AppSpacing.spacingXs),
          
          // Bottom row with country code and phone input
          Row(
            children: [
              Text(
                _countryCode,
                style:  TextStyles.titleMedium,
              ),
              
              const SizedBox(width: 11),
              
              Expanded(
                child: TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style:  TextStyles.titleMedium,
                  cursorColor: Theme.of(context).colorScheme.onSurface, // Add explicit cursor color
                  decoration: InputDecoration(
                    hintText: widget.placeholder,
                    hintStyle:  TextStyles.titleMedium.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                    isDense: true,
                  ),
                  onChanged: (value) {
                    widget.onPhoneNumberChanged?.call(value);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
