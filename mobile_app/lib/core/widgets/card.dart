import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_radius.dart';
import 'package:konto/core/constants/app_spacing.dart';

/// Card variant types
enum CardVariant { primary, secondary }

/// A card widget with primary/secondary variants and optional collapsible functionality
class AppCard extends StatefulWidget {
  /// The child widget to be displayed inside the card
  final Widget child;

  /// The variant of the card (primary or secondary)
  final CardVariant variant;

  /// Whether the card is collapsible
  final bool isCollapsible;

  /// The title for collapsible cards (optional)
  final String? title;

  /// Initial expanded state for collapsible cards
  final bool initiallyExpanded;

  /// Custom padding for the card content (defaults to AppSpacing.spacingM)
  final EdgeInsetsGeometry? padding;

  /// Custom margin around the card (defaults to EdgeInsets.zero)
  final EdgeInsetsGeometry? margin;

  /// Creates a Card widget
  const AppCard({
    super.key,
    required this.child,
    this.variant = CardVariant.primary,
    this.isCollapsible = false,
    this.title,
    this.initiallyExpanded = false,
    this.padding,
    this.margin,
  });

  @override
  State<AppCard> createState() => _CardState();
}

class _CardState extends State<AppCard> with SingleTickerProviderStateMixin {
  late bool _isExpanded;
  late AnimationController _animationController;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;

    if (widget.isCollapsible) {
      _animationController = AnimationController(
        duration: const Duration(milliseconds: 300),
        vsync: this,
      );
      _expandAnimation = CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      );

      if (_isExpanded) {
        _animationController.value = 1.0;
      }
    }
  }

  @override
  void dispose() {
    if (widget.isCollapsible) {
      _animationController.dispose();
    }
    super.dispose();
  }

  void _toggleExpanded() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    });
  }

  Color _getCardColor(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (widget.variant) {
      case CardVariant.primary:
        return isDark
            ? Theme.of(context).colorScheme.primary
            : AppColors.onPrimaryWhite;
      case CardVariant.secondary:
        return Theme.of(context).colorScheme.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: widget.margin ?? EdgeInsets.zero,
      child: Material(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.radiusM),
        ),
        color: _getCardColor(context),
        clipBehavior: Clip.antiAlias,
        child:
            widget.isCollapsible
                ? _buildCollapsibleCard(context)
                : _buildRegularCard(),
      ),
    );
  }

  Widget _buildRegularCard() {
    return Padding(
      padding: widget.padding ?? const EdgeInsets.all(AppSpacing.spacingM),
      child: widget.child,
    );
  }

  Widget _buildCollapsibleCard(BuildContext context) {
    final defaultPadding = const EdgeInsets.all(AppSpacing.spacingM);
    final customPadding = widget.padding ?? defaultPadding;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: _toggleExpanded,
          child: Padding(
            padding: customPadding,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (widget.title != null)
                  Expanded(
                    child: Text(
                      widget.title!,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                AnimatedRotation(
                  turns: _isExpanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 300),
                  child: const Icon(Icons.keyboard_arrow_down),
                ),
              ],
            ),
          ),
        ),
        SizeTransition(
          sizeFactor: _expandAnimation,
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              customPadding.horizontal / 2,
              0,
              customPadding.horizontal / 2,
              customPadding.vertical / 2,
            ),
            child: widget.child,
          ),
        ),
      ],
    );
  }
}
