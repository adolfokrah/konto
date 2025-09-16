import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/utils/category_translation_utils.dart';

/// A reusable horizontal category selector widget
/// Displays a horizontal list of selectable categories with visual feedback
class CategorySelector extends StatelessWidget {
  /// The list of category names to display
  final List<String> categories;

  /// The currently selected category
  final String? selectedCategory;

  /// Callback function when a category is selected
  final Function(String) onCategorySelected;

  /// Optional title to display above the category list
  final String? title;

  /// Height of the category selector (defaults to 80.0)
  final double height;

  /// Width of each category item (defaults to 120.0)
  final double itemWidth;

  const CategorySelector({
    super.key,
    required this.categories,
    required this.onCategorySelected,
    this.selectedCategory,
    this.title,
    this.height = 80.0,
    this.itemWidth = 120.0,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(
            title!,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: AppSpacing.spacingS),
        ],
        SizedBox(
          height: 30,
          child: ListView.builder(
            itemCount: categories.length,
            scrollDirection: Axis.horizontal,
            itemBuilder: (context, index) {
              final category = categories[index];
              final isSelected = selectedCategory == category;

              return GestureDetector(
                onTap: () => onCategorySelected(category),
                child: Container(
                  margin: const EdgeInsets.only(right: AppSpacing.spacingXs),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.spacingXs,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    borderRadius: BorderRadius.circular(AppRadius.radiusL),
                    border: Border.all(
                      color:
                          isSelected
                              ? Theme.of(context).colorScheme.onSurface
                              : isDark
                              ? Theme.of(context).colorScheme.surface
                              : Theme.of(context).colorScheme.inversePrimary,
                      width: 1.0,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      CategoryTranslationUtils.translateCategory(
                        context,
                        category,
                      ),
                      style: TextStyles.titleMediumXs,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
