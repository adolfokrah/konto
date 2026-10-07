import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/utils/haptic_utils.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/l10n/app_localizations.dart';

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
      useSafeArea: true,
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

  /// Selected item first, then the rest, all in one list card.
  List<T> get _orderedItems {
    final filtered = _filteredItems;
    final selected = _selectedItem;
    if (selected == null || !filtered.contains(selected)) return filtered;
    return [selected, ...filtered.where((item) => item != selected)];
  }

  void _onItemSelected(T item) {
    widget.onItemSelected(item);
    Navigator.pop(context);
  }

  Widget _buildRow(T item, bool isFirst, bool isLast) {
    final isSelected = widget.isItemSelected(item, widget.selectedValue);
    final onTap = () => _onItemSelected(item);
    final child =
        _searchQuery.isNotEmpty
            ? widget.searchResultBuilder(item, isSelected, onTap)
            : isSelected
            ? widget.recentItemBuilder(item, isSelected, onTap)
            : widget.itemBuilder(item, isSelected, onTap);

    const radius = Radius.circular(AppRadius.radiusCard);
    // Material (not a decorated Container) so rows can paint ink splashes.
    return Material(
      color: AppColors.fill,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: isFirst ? radius : Radius.zero,
          bottom: isLast ? radius : Radius.zero,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!isFirst)
            const Divider(height: 1, thickness: 1, color: AppColors.line),
          child,
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final media = MediaQuery.of(context);
    final items = _orderedItems;
    final maxHeight = media.size.height * widget.maxHeight;

    final list =
        items.isEmpty
            ? Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text(
                  widget.noResultsMessage ?? localizations.noOptionsFound,
                  style: DsText.small.copyWith(color: AppColors.muted),
                ),
              ),
            )
            : ListView.builder(
              shrinkWrap: !widget.showSearch,
              padding: EdgeInsets.zero,
              itemCount: items.length,
              itemBuilder:
                  (context, index) => _buildRow(
                    items[index],
                    index == 0,
                    index == items.length - 1,
                  ),
            );

    return Padding(
      padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
      child: Container(
        // A searchable sheet keeps a fixed height so it doesn't jump while
        // the list filters; a short plain list hugs its content.
        height:
            widget.showSearch
                ? media.size.height *
                    (widget.initialHeight <= widget.maxHeight
                        ? widget.initialHeight
                        : widget.maxHeight)
                : null,
        constraints: BoxConstraints(maxHeight: maxHeight),
        decoration: const BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppRadius.radiusSheet),
          ),
        ),
        padding: EdgeInsets.fromLTRB(16, 8, 16, 16 + media.padding.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 5,
                margin: const EdgeInsets.only(bottom: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFDADDE3),
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title ?? '',
                    style: DsText.section.copyWith(fontSize: 19),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Semantics(
                  button: true,
                  label: localizations.close,
                  child: Material(
                    color: AppColors.fill,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => Navigator.pop(context),
                      child: const SizedBox(
                        width: 40,
                        height: 40,
                        child: Icon(
                          Icons.close_rounded,
                          size: 20,
                          color: AppColors.navy,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (widget.showSearch) ...[
              _PickerSearch(
                controller: _searchController,
                hintText: widget.searchHint ?? localizations.searchOptions,
                onChanged: (value) => setState(() => _searchQuery = value),
              ),
              const SizedBox(height: 14),
            ],
            if (widget.showSearch)
              Expanded(child: list)
            else
              Flexible(child: list),
          ],
        ),
      ),
    );
  }
}

/// Search field in the picker sheet (mockup `.search`): fill, 44 tall.
class _PickerSearch extends StatefulWidget {
  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String> onChanged;

  const _PickerSearch({
    required this.controller,
    required this.hintText,
    required this.onChanged,
  });

  @override
  State<_PickerSearch> createState() => _PickerSearchState();
}

class _PickerSearchState extends State<_PickerSearch> {
  @override
  Widget build(BuildContext context) {
    final hasText = widget.controller.text.isNotEmpty;
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.fill,
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.only(left: 12),
      child: Row(
        children: [
          const Icon(Icons.search_rounded, size: 20, color: AppColors.muted),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: widget.controller,
              style: DsText.rowTitle,
              cursorColor: AppColors.navy,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: widget.hintText,
                hintStyle: DsText.rowTitle.copyWith(
                  color: AppColors.muted,
                  fontWeight: FontWeight.w400,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: (value) {
                setState(() {});
                widget.onChanged(value);
              },
            ),
          ),
          if (hasText)
            IconButton(
              onPressed: () {
                widget.controller.clear();
                setState(() {});
                widget.onChanged('');
              },
              icon: const Icon(
                Icons.close_rounded,
                size: 18,
                color: AppColors.muted,
              ),
            ),
        ],
      ),
    );
  }
}
