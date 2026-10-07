import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/number_country_picker.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class NumberInput extends StatefulWidget {
  final String? selectedCountry;
  final String? countryCode;
  final String? phoneNumber;
  final Function(String country, String code)? onCountryChanged;
  final Function(String phoneNumber)? onPhoneNumberChanged;
  final String placeholder;
  final Key? textFieldKey;

  const NumberInput({
    super.key,
    this.selectedCountry = 'Ghana',
    this.countryCode = '+233',
    this.phoneNumber,
    this.onCountryChanged,
    this.onPhoneNumberChanged,
    this.placeholder = 'Phone number',
    this.textFieldKey,
  });

  @override
  State<NumberInput> createState() => _NumberInputState();
}

class _NumberInputState extends State<NumberInput> {
  late TextEditingController _phoneController;
  late String _selectedCountry;
  late String _countryCode;
  final FocusNode _focusNode = FocusNode();
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      if (_focusNode.hasFocus != _focused) {
        setState(() => _focused = _focusNode.hasFocus);
      }
    });

    _phoneController = TextEditingController(text: widget.phoneNumber);

    // Get country from country picker or use defaults
    final country = NumberCountryPicker.getCountryByCode(
      widget.countryCode ?? '+233',
    );
    _selectedCountry = country?.name ?? widget.selectedCountry ?? 'Ghana';
    _countryCode = country?.code ?? widget.countryCode ?? '+233';
  }

  @override
  void didUpdateWidget(NumberInput oldWidget) {
    super.didUpdateWidget(oldWidget);

    // Update phone number if it changed
    if (widget.phoneNumber != oldWidget.phoneNumber) {
      _phoneController.text = widget.phoneNumber ?? '';
    }

    // Update country and country code if they changed
    if (widget.countryCode != oldWidget.countryCode ||
        widget.selectedCountry != oldWidget.selectedCountry) {
      final country = NumberCountryPicker.getCountryByCode(
        widget.countryCode ?? '+233',
      );
      setState(() {
        _selectedCountry = country?.name ?? widget.selectedCountry ?? 'Ghana';
        _countryCode = country?.code ?? widget.countryCode ?? '+233';
      });
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _focusNode.dispose();
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
    final localizations = AppLocalizations.of(context)!;
    final flag = NumberCountryPicker.getCountryByCode(_countryCode)?.flag;

    return Row(
      children: [
        // Country tile: flag and dialling code
        GestureDetector(
          onTap: () {
            NumberCountryPicker.showCountryPickerDialog(
              context,
              selectedCountryCode: _countryCode,
              onCountrySelected: _onCountrySelected,
            );
          },
          child: Container(
            width: 104,
            constraints: const BoxConstraints(minHeight: 58),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: AppColors.surfaceWhite,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(localizations.country, style: DsText.caption),
                const SizedBox(height: 2),
                Text(
                  flag == null ? _countryCode : '$flag $_countryCode',
                  style: DsText.rowTitle.copyWith(fontSize: 15.5),
                  maxLines: 1,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Number field: navy border while focused
        Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            constraints: const BoxConstraints(minHeight: 58),
            padding: EdgeInsets.symmetric(
              horizontal: _focused ? 13 : 14,
              vertical: _focused ? 8 : 9,
            ),
            decoration: BoxDecoration(
              color: AppColors.surfaceWhite,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _focused ? AppColors.navy : AppColors.line,
                width: _focused ? 2 : 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(widget.placeholder, style: DsText.caption),
                TextField(
                  key: widget.textFieldKey,
                  controller: _phoneController,
                  focusNode: _focusNode,
                  keyboardType: TextInputType.phone,
                  cursorColor: AppColors.navy,
                  style: DsText.rowTitle.copyWith(fontSize: 15.5),
                  decoration: const InputDecoration(
                    isDense: true,
                    filled: false,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: EdgeInsets.only(top: 2),
                    hintText: '24 123 4567',
                    hintStyle: TextStyle(color: AppColors.faint),
                  ),
                  onChanged: (value) {
                    widget.onPhoneNumberChanged?.call(value);
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
