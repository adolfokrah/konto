import 'package:flutter/material.dart';
import 'package:Hoga/l10n/app_localizations.dart';

/// Utility class for translating category names
class CategoryTranslationUtils {
  /// Translates a category name from English to the localized version
  /// Returns the translated category name based on the provided category
  static String translateCategory(BuildContext context, String category) {
    final l10n = AppLocalizations.of(context)!;

    switch (category.toLowerCase()) {
      case 'funeral':
        return l10n.categoryFuneral;
      case 'parties':
        return l10n.categoryParties;
      case 'trips':
        return l10n.categoryTrips;
      case 'weddings':
        return l10n.categoryWeddings;
      case 'saving groups':
        return l10n.categorySavingGroups;
      case 'other':
        return l10n.categoryOther;
      default:
        return category; // Fallback to original category name
    }
  }
}
