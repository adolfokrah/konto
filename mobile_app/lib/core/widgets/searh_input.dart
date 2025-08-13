import 'package:flutter/material.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';

class SearchInput extends StatefulWidget {
  final String? hintText;
  final Function(String)? onChanged;
  final Function(String)? onSubmitted;
  final TextEditingController? controller;
  final bool autofocus;
  final Color? backgroundColor;
  final Color? iconColor;

  const SearchInput({
    super.key,
    this.hintText = 'Search',
    this.onChanged,
    this.onSubmitted,
    this.controller,
    this.autofocus = false,
    this.backgroundColor,
    this.iconColor,
  });

  @override
  State<SearchInput> createState() => _SearchInputState();
}

class _SearchInputState extends State<SearchInput> {
  late TextEditingController _controller;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _focusNode = FocusNode();

    if (widget.autofocus) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _focusNode.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    _focusNode.dispose();
    super.dispose();
  }

  void _clearSearch() {
    _controller.clear();
    widget.onChanged?.call('');
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color:
            widget.backgroundColor ??
            (Theme.of(context).brightness == Brightness.light
                ? Theme.of(context).colorScheme.onPrimary
                : Theme.of(context).colorScheme.primary),
        borderRadius: BorderRadius.circular(AppRadius.radiusL),
      ),
      child: TextField(
        controller: _controller,
        focusNode: _focusNode,
        style: TextStyles.titleMedium.copyWith(
          color: Theme.of(context).colorScheme.onSurface,
        ),
        cursorColor: Theme.of(context).colorScheme.onSurface,
        decoration: InputDecoration(
          hintText: widget.hintText,
          hintStyle: TextStyles.titleMedium.copyWith(
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.6),
          ),
          prefixIcon: Icon(
            Icons.search,
            color: widget.iconColor ?? Theme.of(context).colorScheme.onSurface,
            size: 20,
          ),
          suffixIcon:
              _controller.text.isNotEmpty
                  ? IconButton(
                    onPressed: _clearSearch,
                    icon: Icon(
                      Icons.clear,
                      color:
                          widget.iconColor ??
                          Theme.of(context).colorScheme.onSurface,
                      size: 18,
                    ),
                  )
                  : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.spacingS,
            vertical: AppSpacing.spacingS,
          ),
          isDense: false,
        ),
        onChanged: (value) {
          setState(() {}); // To update the clear button visibility
          widget.onChanged?.call(value);
        },
        onSubmitted: widget.onSubmitted,
      ),
    );
  }
}
