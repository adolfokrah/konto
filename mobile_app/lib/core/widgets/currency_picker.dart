import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/constants/currencies.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/card.dart';
import 'package:konto/core/widgets/generic_picker.dart';
import 'package:konto/core/widgets/small_button.dart';

class CurrencyPicker extends StatefulWidget {
  final Function(Currency)? onCurrencySelected;
  final Currency? selectedCurrency;

  const CurrencyPicker({
    super.key,
    this.onCurrencySelected,
    this.selectedCurrency,
  });

  @override
  State<CurrencyPicker> createState() => _CurrencyPickerState();
}

class _CurrencyPickerState extends State<CurrencyPicker> {
  late Currency _selectedCurrency;

  @override
  void initState() {
    super.initState();
    // Default to Ghanaian Cedi if no currency selected
    _selectedCurrency = widget.selectedCurrency ?? Currencies.defaultCurrency;
  }

  void _showCurrencyPicker() {
    GenericPicker.showPickerDialog<Currency>(
      context,
      selectedValue: _selectedCurrency.code,
      items: Currencies.all,
      onItemSelected: (currency) {
        setState(() {
          _selectedCurrency = currency;
        });
        widget.onCurrencySelected?.call(currency);
      },
      itemBuilder: _buildCurrencyItem,
      recentItemBuilder: _buildCurrencyItem,
      searchResultBuilder: _buildCurrencyItem,
      searchFilter: (currency) => '${currency.name} ${currency.code}',
      isItemSelected:
          (currency, selectedValue) => currency.code == selectedValue,
      searchHint: 'Search currencies...',
      title: 'Select Currency',
      recentSectionTitle: 'Selected Currency',
      otherSectionTitle: 'Available Currencies',
      showSearch: true, // Enable search with 4 currencies
      initialHeight: 0.9, // Adjusted height for 4 currencies
    );
  }

  Widget _buildCurrencyItem(
    Currency currency,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: CircleAvatar(backgroundImage: NetworkImage(currency.flagUrl)),
      title: Text(currency.name, style: TextStyles.titleMedium),
      subtitle: Text(currency.code, style: TextStyles.titleRegularSm),
      trailing:
          isSelected
              ? Icon(
                Icons.check_circle,
                color: Theme.of(context).colorScheme.primary,
              )
              : null,
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AppCard(
      padding: EdgeInsets.symmetric(horizontal: AppSpacing.spacingS),
      variant: CardVariant.secondary,
      child: ListTile(
        contentPadding: EdgeInsets.all(0),
        leading: CircleAvatar(
          backgroundImage: NetworkImage(_selectedCurrency.flagUrl),
        ),
        title: Text(
          _selectedCurrency.name,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        subtitle: Text(
          _selectedCurrency.code,
          style: TextStyles.titleRegularSm,
        ),
        trailing: AppSmallButton(
          padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.spacingS,
            vertical: 6,
          ),
          backgroundColor:
              isDark ? AppColors.onSurfaceDark : AppColors.backgroundLight,
          onPressed: _showCurrencyPicker,
          child: const Text("Change", style: TextStyles.titleMediumM),
        ),
      ),
    );
  }
}
