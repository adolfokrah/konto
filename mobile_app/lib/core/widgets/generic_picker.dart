import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/utils/haptic_utils.dart';
import 'package:konto/core/widgets/searh_input.dart';
import 'package:konto/l10n/app_localizations.dart';

class GenericPicker<T> extends StatelessWidget {
  final String selectedValue;
  final Function(T item) onItemSelected;

  const GenericPicker({
    super.key,
    required this.selectedValue,
    required this.onItemSelected,
  });

  static void showPickerDialog<T>(
    BuildContext context, {
    required String selectedValue,
    required List<T> items,
    required Function(T item) onItemSelected,
    required Widget Function(T item, bool isSelected, VoidCallback onTap)
    itemBuilder,
    required Widget Function(T item, bool isSelected, VoidCallback onTap)
    recentItemBuilder,
    required Widget Function(T item, bool isSelected, VoidCallback onTap)
    searchResultBuilder,
    required String Function(T item) searchFilter,
    required bool Function(T item, String selectedValue) isItemSelected,
    String? title,
    String? searchHint,
    String? recentSectionTitle,
    String? otherSectionTitle,
    String? searchResultsTitle,
    String? noResultsMessage,
    bool showSearch = true,
    double maxHeight = 0.9,
    double minHeight = 0.3,
    double initialHeight = 0.9,
  }) {
    // Provide heavy haptic feedback when opening the picker modal
    HapticUtils.heavy();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return _GenericPickerContent<T>(
          selectedValue: selectedValue,
          items: items,
          onItemSelected: onItemSelected,
          itemBuilder: itemBuilder,
          recentItemBuilder: recentItemBuilder,
          searchResultBuilder: searchResultBuilder,
          searchFilter: searchFilter,
          isItemSelected: isItemSelected,
          title: title,
          searchHint: searchHint,
          recentSectionTitle: recentSectionTitle,
          otherSectionTitle: otherSectionTitle,
          searchResultsTitle: searchResultsTitle,
          noResultsMessage: noResultsMessage,
          showSearch: showSearch,
          maxHeight: maxHeight,
          minHeight: minHeight,
          initialHeight: initialHeight,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showPickerDialog(context),
      child: const Icon(Icons.chevron_right, size: 18),
    );
  }

  void _showPickerDialog(BuildContext context) {
    // This is a placeholder - actual implementation would need the required parameters
    // This class is mainly for the static showPickerDialog method
  }
}

class _GenericPickerContent<T> extends StatefulWidget {
  final String selectedValue;
  final List<T> items;
  final Function(T item) onItemSelected;
  final Widget Function(T item, bool isSelected, VoidCallback onTap)
  itemBuilder;
  final Widget Function(T item, bool isSelected, VoidCallback onTap)
  recentItemBuilder;
  final Widget Function(T item, bool isSelected, VoidCallback onTap)
  searchResultBuilder;
  final String Function(T item) searchFilter;
  final bool Function(T item, String selectedValue) isItemSelected;
  final String? title;
  final String? searchHint;
  final String? recentSectionTitle;
  final String? otherSectionTitle;
  final String? searchResultsTitle;
  final String? noResultsMessage;
  final bool showSearch;
  final double maxHeight;
  final double minHeight;
  final double initialHeight;

  const _GenericPickerContent({
    required this.selectedValue,
    required this.items,
    required this.onItemSelected,
    required this.itemBuilder,
    required this.recentItemBuilder,
    required this.searchResultBuilder,
    required this.searchFilter,
    required this.isItemSelected,
    this.title,
    this.searchHint,
    this.recentSectionTitle,
    this.otherSectionTitle,
    this.searchResultsTitle,
    this.noResultsMessage,
    this.showSearch = true,
    this.maxHeight = 0.9,
    this.minHeight = 0.3,
    this.initialHeight = 0.9,
  });

  @override
  State<_GenericPickerContent<T>> createState() =>
      _GenericPickerContentState<T>();
}

class _GenericPickerContentState<T> extends State<_GenericPickerContent<T>> {
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<T> get _filteredItems {
    if (_searchQuery.isEmpty) {
      return widget.items;
    }
    return widget.items.where((item) {
      final searchText = widget.searchFilter(item).toLowerCase();
      return searchText.contains(_searchQuery.toLowerCase());
    }).toList();
  }

  T? get _selectedItem {
    try {
      return widget.items.firstWhere(
        (item) => widget.isItemSelected(item, widget.selectedValue),
      );
    } catch (e) {
      return null;
    }
  }

  int _getItemCount() {
    final selectedItem = _selectedItem;
    final filteredItems = _filteredItems;
    final otherItems =
        filteredItems
            .where((item) => !widget.isItemSelected(item, widget.selectedValue))
            .toList();
    final selectedItemInResults =
        selectedItem != null && filteredItems.contains(selectedItem);

    int count = 0;

    // Recent Selection section (when no search) OR selected item in search results
    if ((_searchQuery.isEmpty && selectedItemInResults) ||
        (_searchQuery.isNotEmpty && selectedItemInResults)) {
      count += 2; // header + selected item
    }

    // Other Items section
    if (otherItems.isNotEmpty) {
      count += 1; // header
      count += otherItems.length; // other items
    }

    return count;
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.spacingM),
      child: Text(title, style: TextStyles.titleBoldLg),
    );
  }

  Widget _buildListItem(BuildContext context, int index) {
    final selectedItem = _selectedItem;
    final filteredItems = _filteredItems;
    final otherItems =
        filteredItems
            .where((item) => !widget.isItemSelected(item, widget.selectedValue))
            .toList();
    final selectedItemInResults =
        selectedItem != null && filteredItems.contains(selectedItem);
    final localizations = AppLocalizations.of(context)!;

    int currentIndex = 0;

    // Recent Selection section (when no search) OR selected item in search results
    if ((_searchQuery.isEmpty && selectedItemInResults) ||
        (_searchQuery.isNotEmpty && selectedItemInResults)) {
      if (index == currentIndex) {
        // Header changes based on search state
        final headerTitle =
            _searchQuery.isEmpty
                ? (widget.recentSectionTitle ?? localizations.recentSelection)
                : (widget.searchResultsTitle ?? localizations.searchResults);
        return _buildSectionHeader(headerTitle);
      }
      currentIndex++;

      if (index == currentIndex) {
        // Selected item
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary,
            borderRadius: BorderRadius.circular(AppRadius.radiusM),
          ),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingXs),
          child:
              _searchQuery.isEmpty
                  ? widget.recentItemBuilder(
                    selectedItem,
                    true,
                    () => _onItemSelected(selectedItem),
                  )
                  : widget.searchResultBuilder(
                    selectedItem,
                    true,
                    () => _onItemSelected(selectedItem),
                  ),
        );
      }
      currentIndex++;
    }

    // Other Items section
    if (otherItems.isNotEmpty) {
      if (index == currentIndex) {
        // Other Items header
        final headerTitle =
            _searchQuery.isEmpty
                ? (widget.otherSectionTitle ?? localizations.allOptions)
                : (selectedItemInResults
                    ? (widget.searchResultsTitle ?? localizations.searchResults)
                    : (widget.searchResultsTitle ??
                        localizations.searchResults));
        return _buildSectionHeader(headerTitle);
      }
      currentIndex++;

      // Other items
      final otherItemIndex = index - currentIndex;
      if (otherItemIndex >= 0 && otherItemIndex < otherItems.length) {
        final item = otherItems[otherItemIndex];
        final isFirst = otherItemIndex == 0;
        final isLast = otherItemIndex == otherItems.length - 1;

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
          child:
              _searchQuery.isEmpty
                  ? widget.itemBuilder(item, false, () => _onItemSelected(item))
                  : widget.searchResultBuilder(
                    item,
                    false,
                    () => _onItemSelected(item),
                  ),
        );
      }
    }

    return const SizedBox.shrink();
  }

  void _onItemSelected(T item) {
    widget.onItemSelected(item);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return DraggableScrollableSheet(
      initialChildSize:
          widget.initialHeight <= widget.maxHeight
              ? widget.initialHeight
              : widget.maxHeight,
      minChildSize: widget.minHeight,
      maxChildSize: widget.maxHeight,
      snap: true,
      snapSizes: [
        widget.initialHeight <= widget.maxHeight
            ? widget.initialHeight
            : widget.maxHeight,
      ],
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(AppRadius.radiusM),
              topRight: Radius.circular(AppRadius.radiusM),
            ),
          ),
          padding: const EdgeInsets.only(
            top: AppSpacing.spacingXs,
            left: AppSpacing.spacingM,
            right: AppSpacing.spacingM,
          ),
          child: Column(
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.only(bottom: AppSpacing.spacingXs),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Title
              if (widget.title != null) ...[
                Text(widget.title!, style: TextStyles.titleBoldLg),
                const SizedBox(height: AppSpacing.spacingM),
              ],

              // Search Input
              if (widget.showSearch) ...[
                SearchInput(
                  controller: _searchController,
                  hintText: widget.searchHint ?? localizations.searchOptions,
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
                const SizedBox(height: AppSpacing.spacingM),
              ],

              // Items list
              Flexible(
                child:
                    _getItemCount() == 0
                        ? Center(
                          child: Text(
                            widget.noResultsMessage ??
                                localizations.noOptionsFound,
                            style: TextStyles.titleMedium.copyWith(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withValues(alpha: 0.6),
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
