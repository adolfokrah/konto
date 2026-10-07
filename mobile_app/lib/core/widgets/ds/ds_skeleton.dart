/// Skeleton placeholders shown while a page or section loads for the first
/// time, in place of a spinner.
///
/// Wrap the placeholder layout in one [DsSkeleton]; every [DsSkeletonBox],
/// [DsSkeletonLine] and [DsSkeletonCircle] under it shares a single soft
/// highlight that sweeps across the whole layout. Blocks sit on the cream
/// canvas in [AppColors.fill]; inside white cards ([DsSkeletonCard],
/// [DsSkeletonListCard]) they use a slightly lighter base.
///
/// With reduced motion on (`MediaQuery.disableAnimations`), the blocks are
/// drawn static.
library;

import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';

/// Base colour of a block on the cream canvas.
Color get _baseOnCanvas =>
    AppColors.isDark ? const Color(0xFF1B222B) : AppColors.fill;

/// Base colour of a block inside a white card: lighter than [AppColors.fill]
/// so it reads as the same tone on white.
Color get _baseOnCard =>
    AppColors.isDark ? const Color(0xFF232B36) : const Color(0xFFF6F1EA);

/// The sweeping highlight for a block of [base] colour: near white on light
/// blocks, a gentle lift on dark ones.
Color _highlightFor(Color base) =>
    Color.lerp(base, Colors.white, base.computeLuminance() > 0.5 ? 0.7 : 0.07)!;

// ---------------------------------------------------------------- scope

/// Runs one shimmer animation for every skeleton block below it.
class DsSkeleton extends StatefulWidget {
  final Widget child;

  /// Blocks sit on a white surface (a bottom sheet): use the lighter base.
  final bool onWhite;

  const DsSkeleton({super.key, required this.child, this.onWhite = false});

  @override
  State<DsSkeleton> createState() => _DsSkeletonState();
}

class _DsSkeletonState extends State<DsSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  );

  bool _static = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _static = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (_static) {
      _controller.stop();
    } else if (!_controller.isAnimating) {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Offset of [descendant] inside this skeleton, or null before layout.
  Offset? _offsetOf(RenderBox descendant) {
    final self = context.findRenderObject();
    if (self is! RenderBox || !self.hasSize || !descendant.attached) {
      return null;
    }
    return descendant.localToGlobal(Offset.zero, ancestor: self);
  }

  Size? get _size {
    final self = context.findRenderObject();
    return self is RenderBox && self.hasSize ? self.size : null;
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Loading',
      container: true,
      child: ExcludeSemantics(
        child: _SkeletonScope(
          state: this,
          animation: _controller,
          animated: !_static,
          child: widget.onWhite ? _OnCard(child: widget.child) : widget.child,
        ),
      ),
    );
  }
}

class _SkeletonScope extends InheritedWidget {
  final _DsSkeletonState state;
  final Animation<double> animation;
  final bool animated;

  const _SkeletonScope({
    required this.state,
    required this.animation,
    required this.animated,
    required super.child,
  });

  static _SkeletonScope? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_SkeletonScope>();

  @override
  bool updateShouldNotify(_SkeletonScope old) =>
      old.animated != animated || old.animation != animation;
}

/// Marks blocks as sitting inside a white card (lighter base).
class _OnCard extends InheritedWidget {
  const _OnCard({required super.child});

  static bool isIn(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_OnCard>() != null;

  @override
  bool updateShouldNotify(_OnCard oldWidget) => false;
}

// ---------------------------------------------------------------- primitives

/// A rounded placeholder block.
class DsSkeletonBox extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;

  /// Block colour; defaults to the canvas / card base. Set it on coloured
  /// surfaces (e.g. a translucent white on a navy card).
  final Color? color;

  const DsSkeletonBox({
    super.key,
    this.width,
    required this.height,
    this.radius = 8,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final base = color ?? (_OnCard.isIn(context) ? _baseOnCard : _baseOnCanvas);
    return _Shimmer(
      base: base,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: base,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

/// A text-line placeholder (pill-shaped).
class DsSkeletonLine extends StatelessWidget {
  final double? width;
  final double height;
  final Color? color;

  const DsSkeletonLine({super.key, this.width, this.height = 12, this.color});

  @override
  Widget build(BuildContext context) => DsSkeletonBox(
    width: width,
    height: height,
    radius: height / 2,
    color: color,
  );
}

/// A round placeholder (avatar, icon).
class DsSkeletonCircle extends StatelessWidget {
  final double size;

  const DsSkeletonCircle({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) =>
      DsSkeletonBox(width: size, height: size, radius: size / 2);
}

/// Paints [child] with the shared sweep when under an animated [DsSkeleton].
class _Shimmer extends StatelessWidget {
  final Color base;
  final Widget child;

  const _Shimmer({required this.base, required this.child});

  @override
  Widget build(BuildContext context) {
    final scope = _SkeletonScope.of(context);
    if (scope == null || !scope.animated) return child;
    final highlight = _highlightFor(base);
    return AnimatedBuilder(
      animation: scope.animation,
      child: child,
      builder: (context, child) {
        // Highlight centre runs from 20% off the left edge to 20% off the
        // right edge of the whole skeleton.
        final slide = scope.animation.value * 1.4 - 0.7;
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          // Runs at paint time, after layout, so positions are known.
          shaderCallback: (bounds) {
            final box = context.findRenderObject();
            final size = scope.state._size;
            final offset = box is RenderBox ? scope.state._offsetOf(box) : null;
            if (size == null || offset == null) {
              return LinearGradient(colors: [base, base]).createShader(bounds);
            }
            return LinearGradient(
              colors: [base, highlight, base],
              stops: const [0.3, 0.5, 0.7],
              transform: _Slide(slide),
            ).createShader(
              Rect.fromLTWH(-offset.dx, -offset.dy, size.width, size.height),
            );
          },
          child: child,
        );
      },
    );
  }
}

class _Slide extends GradientTransform {
  final double percent;

  const _Slide(this.percent);

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) =>
      Matrix4.translationValues(bounds.width * percent, 0, 0);
}

// ---------------------------------------------------------------- composed

/// Big page-title placeholder ("Activity", "Insights", ...).
class DsSkeletonHeader extends StatelessWidget {
  final double width;

  const DsSkeletonHeader({super.key, this.width = 150});

  @override
  Widget build(BuildContext context) =>
      DsSkeletonLine(width: width, height: 28);
}

/// Flat white card (20 radius) of [height]; by default it shows a short
/// label and a value line at the top, or [child] when given.
class DsSkeletonCard extends StatelessWidget {
  final double? height;
  final Widget? child;
  final EdgeInsetsGeometry padding;

  const DsSkeletonCard({
    super.key,
    this.height,
    this.child,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(AppRadius.radiusCard),
      ),
      child: _OnCard(
        child:
            child ??
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                DsSkeletonLine(width: 90, height: 10),
                SizedBox(height: 10),
                DsSkeletonLine(width: 170, height: 20),
              ],
            ),
      ),
    );
  }
}

/// One list row placeholder: leading tile, title + subtitle, trailing value.
/// Mirrors `DsRow` (16/12 padding, 40 leading).
class DsSkeletonRow extends StatelessWidget {
  final bool leading;
  final bool circleLeading;
  final bool trailing;
  final double titleWidth;
  final double subtitleWidth;

  const DsSkeletonRow({
    super.key,
    this.leading = true,
    this.circleLeading = false,
    this.trailing = true,
    this.titleWidth = 140,
    this.subtitleWidth = 90,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          if (leading) ...[
            circleLeading
                ? const DsSkeletonCircle(size: 40)
                : const DsSkeletonBox(width: 40, height: 40, radius: 12),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _Fit(child: DsSkeletonLine(width: titleWidth, height: 13)),
                const SizedBox(height: 8),
                _Fit(child: DsSkeletonLine(width: subtitleWidth, height: 10)),
              ],
            ),
          ),
          if (trailing) ...[
            const SizedBox(width: 12),
            const DsSkeletonLine(width: 56, height: 13),
          ],
        ],
      ),
    );
  }
}

/// Left-aligns a fixed-width line; a box wider than the row is clamped by
/// its constraints, so it never overflows. (No LayoutBuilder: skeletons must
/// answer intrinsic sizes, e.g. inside `SliverFillRemaining`.)
class _Fit extends StatelessWidget {
  final Widget child;

  const _Fit({required this.child});

  @override
  Widget build(BuildContext context) =>
      Align(alignment: Alignment.centerLeft, child: child);
}

/// White card of [rows] list-row placeholders separated by hairlines,
/// like `DsListCard` of `DsRow`s.
class DsSkeletonListCard extends StatelessWidget {
  final int rows;
  final bool leading;
  final bool circleLeading;
  final bool trailing;

  const DsSkeletonListCard({
    super.key,
    this.rows = 3,
    this.leading = true,
    this.circleLeading = false,
    this.trailing = true,
  });

  // Varied widths so the rows don't look stamped.
  static const _titles = [150.0, 120.0, 170.0, 110.0, 140.0];
  static const _subs = [90.0, 110.0, 70.0, 100.0, 80.0];

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];
    for (var i = 0; i < rows; i++) {
      if (i > 0) {
        children.add(Divider(height: 1, color: AppColors.line));
      }
      children.add(
        DsSkeletonRow(
          leading: leading,
          circleLeading: circleLeading,
          trailing: trailing,
          titleWidth: _titles[i % _titles.length],
          subtitleWidth: _subs[i % _subs.length],
        ),
      );
    }
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(AppRadius.radiusCard),
      ),
      clipBehavior: Clip.antiAlias,
      child: _OnCard(
        child: Column(mainAxisSize: MainAxisSize.min, children: children),
      ),
    );
  }
}

/// White card of label / value pairs, like `DsListCard` of `DsKeyValue`s
/// (receipts, breakdowns).
class DsSkeletonKeyValueCard extends StatelessWidget {
  final int rows;

  const DsSkeletonKeyValueCard({super.key, this.rows = 4});

  static const _labels = [70.0, 90.0, 60.0, 80.0, 100.0];
  static const _values = [110.0, 80.0, 130.0, 90.0, 70.0];

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];
    for (var i = 0; i < rows; i++) {
      if (i > 0) {
        children.add(Divider(height: 1, color: AppColors.line));
      }
      children.add(
        SizedBox(
          height: 46,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                DsSkeletonLine(width: _labels[i % _labels.length], height: 11),
                DsSkeletonLine(width: _values[i % _values.length], height: 13),
              ],
            ),
          ),
        ),
      );
    }
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(AppRadius.radiusCard),
      ),
      clipBehavior: Clip.antiAlias,
      child: _OnCard(
        child: Column(mainAxisSize: MainAxisSize.min, children: children),
      ),
    );
  }
}

/// Small group label above a card ("TODAY", "ACCOUNT", ...).
class DsSkeletonLabel extends StatelessWidget {
  final double width;

  const DsSkeletonLabel({super.key, this.width = 70});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 4, 0, 10),
    child: DsSkeletonLine(width: width, height: 10),
  );
}

/// A whole non-scrolling skeleton page: [children] in a padded column with
/// one shared shimmer. Safe in any box, including `SliverFillRemaining`
/// (it clips instead of overflowing).
class DsSkeletonPage extends StatelessWidget {
  final List<Widget> children;
  final EdgeInsetsGeometry padding;

  const DsSkeletonPage({
    super.key,
    required this.children,
    this.padding = const EdgeInsets.fromLTRB(16, 8, 16, 24),
  });

  @override
  Widget build(BuildContext context) {
    return DsSkeleton(
      child: ClipRect(
        child: SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          padding: padding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: children,
          ),
        ),
      ),
    );
  }
}
