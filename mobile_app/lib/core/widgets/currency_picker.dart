import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/constants/currencies.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/currency_utils.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/core/widgets/generic_picker.dart';
import 'package:Hoga/core/widgets/small_button.dart';
import 'package:Hoga/l10n/app_localizations.dart';

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
    final localizations = AppLocalizations.of(context)!;

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
      itemBuilder:
          (currency, isSelected, onTap) =>
              _buildCurrencyItem(currency, isSelected, onTap, localizations),
      recentItemBuilder:
          (currency, isSelected, onTap) =>
              _buildCurrencyItem(currency, isSelected, onTap, localizations),
      searchResultBuilder:
          (currency, isSelected, onTap) =>
              _buildCurrencyItem(currency, isSelected, onTap, localizations),
      searchFilter:
          (currency) =>
              '${CurrencyUtils.getLocalizedCurrencyName(currency.code, localizations)} ${currency.code}',
      isItemSelected:
          (currency, selectedValue) => currency.code == selectedValue,
      searchHint: AppLocalizations.of(context)!.searchCurrencies,
      title: AppLocalizations.of(context)!.selectCurrency,
      recentSectionTitle: AppLocalizations.of(context)!.selectedCurrency,
      otherSectionTitle: AppLocalizations.of(context)!.availableCurrencies,
      showSearch: true, // Enable search with 4 currencies
      initialHeight: 0.9, // Adjusted height for 4 currencies
    );
  }

  Widget _buildCurrencyItem(
    Currency currency,
    bool isSelected,
    VoidCallback onTap,
    AppLocalizations localizations,
  ) {
    return ListTile(
      leading: CircleAvatar(backgroundImage: NetworkImage(currency.flagUrl)),
      title: Text(
        CurrencyUtils.getLocalizedCurrencyName(currency.code, localizations),
        style: TextStyles.titleMedium,
      ),
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
    final localizations = AppLocalizations.of(context)!;

    return AppCard(
      padding: EdgeInsets.symmetric(horizontal: AppSpacing.spacingS),
      variant: CardVariant.secondary,
      child: ListTile(
        contentPadding: EdgeInsets.all(0),
        leading: CircleAvatar(
          backgroundImage: NetworkImage(_selectedCurrency.flagUrl),
        ),
        title: Text(
          CurrencyUtils.getLocalizedCurrencyName(
            _selectedCurrency.code,
            localizations,
          ),
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
          child: Text(
            AppLocalizations.of(context)!.change,
            style: TextStyles.titleMediumM,
          ),
        ),
      ),
    );
  }
}
