/// Small redesign pieces shared by the jar screens (nav bars, thumbs, sheets,
/// toggles, chips). Everything here composes the core `ds.dart` blocks.
library;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/sheet_surface.dart';
import 'package:go_router/go_router.dart';

// ---------------------------------------------------------------- nav

/// 40x40 rounded icon button used in screen headers (mockup `.ib`).
class JarNavButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool fill;
  final bool dot;

  const JarNavButton({
    super.key,
    required this.icon,
    this.onTap,
    this.fill = false,
    this.dot = false,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: onTap == null ? 0.35 : 1,
      child: Material(
        color: fill ? SheetSurface.fillOf(context) : AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: SizedBox(
            width: 40,
            height: 40,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(icon, size: 20, color: AppColors.navy),
                if (dot)
                  Positioned(
                    top: 9,
                    right: 9,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: AppColors.negative,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.cream, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Text action in a header ("Save", "Remove", "Done").
class JarBarLink extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  final bool destructive;
  final bool loading;

  const JarBarLink(
    this.text, {
    super.key,
    this.onTap,
    this.destructive = false,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.navy),
      );
    }
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
        child: Text(
          text,
          style: TextStyle(
            fontFamily: 'Supreme',
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color:
                onTap == null
                    ? AppColors.faint
                    : destructive
                    ? AppColors.negative
                    : AppColors.navy,
          ),
        ),
      ),
    );
  }
}

/// Header for pushed screens: leading button, centred title, trailing actions.
class JarTopBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final IconData leadingIcon;
  final VoidCallback? onLeading;
  final List<Widget> actions;
  final bool showLeading;
  final bool fillButtons;

  const JarTopBar({
    super.key,
    this.title,
    this.leadingIcon = Icons.arrow_back_rounded,
    this.onLeading,
    this.actions = const [],
    this.showLeading = true,
    this.fillButtons = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: SizedBox(
        height: 60,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              SizedBox(
                width: 72,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child:
                      showLeading
                          ? JarNavButton(
                            icon: leadingIcon,
                            fill: fillButtons,
                            onTap:
                                onLeading ??
                                () {
                                  if (context.canPop()) {
                                    context.pop();
                                  } else {
                                    Navigator.of(context).maybePop();
                                  }
                                },
                          )
                          : null,
                ),
              ),
              Expanded(
                child: Text(
                  title ?? '',
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.rowTitle.copyWith(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              ConstrainedBox(
                constraints: const BoxConstraints(minWidth: 72),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    for (var i = 0; i < actions.length; i++) ...[
                      if (i > 0) const SizedBox(width: 8),
                      actions[i],
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- media

/// Rounded jar photo (mockup `.thumb`), with an icon fallback.
class JarThumb extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final IconData icon;

  const JarThumb({
    super.key,
    this.imageUrl,
    this.size = 48,
    this.icon = Icons.savings_outlined,
  });

  @override
  Widget build(BuildContext context) {
    final fallback = Center(
      child: Icon(icon, size: size * 0.45, color: AppColors.navy),
    );
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: SheetSurface.fillOf(context),
        borderRadius: BorderRadius.circular(size * 0.3),
      ),
      clipBehavior: Clip.antiAlias,
      child:
          imageUrl == null
              ? fallback
              : Image.network(
                imageUrl!,
                width: size,
                height: size,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => fallback,
              ),
    );
  }
}

/// Small initials avatar for people in lists.
class JarInitialsAvatar extends StatelessWidget {
  final String name;
  final double size;
  final String? imageUrl;

  const JarInitialsAvatar({
    super.key,
    required this.name,
    this.size = 40,
    this.imageUrl,
  });

  static String initials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: AppColors.limeSoft,
        shape: BoxShape.circle,
      ),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child:
          imageUrl != null
              ? Image.network(
                imageUrl!,
                width: size,
                height: size,
                fit: BoxFit.cover,
                errorBuilder:
                    (_, __, ___) => Text(initials(name), style: _style),
              )
              : Text(initials(name), style: _style),
    );
  }

  TextStyle get _style => TextStyle(
    fontFamily: 'Supreme',
    fontWeight: FontWeight.w700,
    fontSize: size * 0.34,
    color: AppColors.navy,
  );
}

// ---------------------------------------------------------------- controls

/// Navy-on toggle (mockup `.tg`).
class JarToggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;

  const JarToggle({super.key, required this.value, this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Transform.scale(
      scale: 0.8,
      child: CupertinoSwitch(
        value: value,
        onChanged: onChanged,
        activeTrackColor: AppColors.navy,
        inactiveTrackColor: const Color(0xFFDADDE3),
      ),
    );
  }
}

/// Toggle that keeps its own state, so the switch moves straight away while
/// the update request runs (same behaviour as the old CustomCupertinoSwitch).
class JarStatefulToggle extends StatefulWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;

  const JarStatefulToggle({super.key, required this.value, this.onChanged});

  @override
  State<JarStatefulToggle> createState() => _JarStatefulToggleState();
}

class _JarStatefulToggleState extends State<JarStatefulToggle> {
  late bool _value = widget.value;

  @override
  void didUpdateWidget(covariant JarStatefulToggle oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) _value = widget.value;
  }

  @override
  Widget build(BuildContext context) {
    return JarToggle(
      value: _value,
      onChanged:
          widget.onChanged == null
              ? null
              : (v) {
                setState(() => _value = v);
                widget.onChanged!(v);
              },
    );
  }
}

/// Chip (mockup `.chip`, `.chip.on`).
class JarChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final IconData? icon;

  const JarChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final fg = selected ? AppColors.surfaceWhite : AppColors.navy;
    return Material(
      color: selected ? AppColors.navy : AppColors.surfaceWhite,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side:
            selected
                ? BorderSide.none
                : const BorderSide(color: AppColors.line),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          height: 34,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 15, color: fg),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Supreme',
                  fontSize: 13.5,
                  fontWeight: FontWeight.w500,
                  color: fg,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Radio dot (mockup `.rd`).
class JarRadio extends StatelessWidget {
  final bool selected;
  const JarRadio({super.key, required this.selected});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: selected ? AppColors.navy : AppColors.faint,
          width: selected ? 7 : 2,
        ),
      ),
    );
  }
}

/// White field shell with a small label on top (mockup `.fl`).
class JarField extends StatelessWidget {
  final String label;
  final Widget child;
  final bool focused;
  final VoidCallback? onTap;
  final Widget? trailing;

  const JarField({
    super.key,
    required this.label,
    required this.child,
    this.focused = false,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 58),
        padding: const EdgeInsets.fromLTRB(14, 9, 14, 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.circular(AppRadius.radiusButton),
          border: Border.all(
            color: focused ? AppColors.navy : AppColors.line,
            width: focused ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: DsText.caption),
                  const SizedBox(height: 2),
                  child,
                ],
              ),
            ),
            if (trailing != null) ...[const SizedBox(width: 8), trailing!],
          ],
        ),
      ),
    );
  }
}

/// Borderless text input that sits inside a [JarField].
class JarBareInput extends StatelessWidget {
  final TextEditingController controller;
  final String? hintText;
  final FocusNode? focusNode;
  final int? maxLines;
  final int? minLines;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final bool enabled;

  const JarBareInput({
    super.key,
    required this.controller,
    this.hintText,
    this.focusNode,
    this.maxLines = 1,
    this.minLines,
    this.keyboardType,
    this.onChanged,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      maxLines: maxLines,
      minLines: minLines,
      enabled: enabled,
      keyboardType: keyboardType,
      onChanged: onChanged,
      cursorColor: AppColors.navy,
      textCapitalization: TextCapitalization.sentences,
      style: DsText.rowTitle.copyWith(fontSize: 15.5),
      decoration: InputDecoration(
        isDense: true,
        filled: false,
        contentPadding: EdgeInsets.zero,
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        disabledBorder: InputBorder.none,
        hintText: hintText,
        hintStyle: DsText.rowTitle.copyWith(
          fontSize: 15.5,
          fontWeight: FontWeight.w400,
          color: AppColors.faint,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- lists

/// Fill-coloured list (mockup `.card.fill.list`); cream inside white sheets.
class JarFillList extends StatelessWidget {
  final List<Widget> children;
  const JarFillList({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) rows.add(const Divider(height: 1, color: AppColors.line));
      rows.add(children[i]);
    }
    return Container(
      decoration: BoxDecoration(
        color: SheetSurface.fillOf(context),
        borderRadius: BorderRadius.circular(16),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(mainAxisSize: MainAxisSize.min, children: rows),
    );
  }
}

/// A tag-style trailing value with a chevron ("Missing ›", "2 ›").
class JarRowValue extends StatelessWidget {
  final String? text;
  final Widget? tag;
  final bool chevron;

  const JarRowValue({super.key, this.text, this.tag, this.chevron = true});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (tag != null) tag!,
        if (text != null)
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 170),
            child: Text(
              text!,
              style: DsText.caption.copyWith(fontSize: 13),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
            ),
          ),
        if (chevron) ...[
          const SizedBox(width: 4),
          const Icon(
            Icons.chevron_right_rounded,
            size: 20,
            color: AppColors.faint,
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------- sheets

/// White bottom sheet frame: grab handle, optional title row with close.
class JarSheetFrame extends StatelessWidget {
  final String? title;
  final List<Widget> children;
  final bool showClose;
  final EdgeInsets padding;

  const JarSheetFrame({
    super.key,
    this.title,
    required this.children,
    this.showClose = true,
    this.padding = const EdgeInsets.fromLTRB(16, 8, 16, 16),
  });

  @override
  Widget build(BuildContext context) {
    return SheetSurface(child: _frame(context));
  }

  Widget _frame(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppRadius.radiusSheet),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: padding,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDADDE3),
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              ),
              if (title != null) ...[
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title!,
                        style: DsText.section.copyWith(fontSize: 20),
                      ),
                    ),
                    if (showClose)
                      JarNavButton(
                        icon: Icons.close_rounded,
                        fill: true,
                        onTap: () => Navigator.of(context).maybePop(),
                      ),
                  ],
                ),
                const SizedBox(height: 14),
              ],
              ...children,
            ],
          ),
        ),
      ),
    );
  }
}

/// Confirm sheet with a big icon tile (Seal, Reopen, Close, Leave, Delete).
class JarConfirmSheet {
  static Future<bool?> show({
    required BuildContext context,
    required IconData icon,
    required DsTone tone,
    required String title,
    required String message,
    required String confirmText,
    String cancelText = 'Cancel',
    List<Widget> extra = const [],
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (ctx) => JarSheetFrame(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: DsIconTile(icon, tone: tone, size: 56),
              ),
              const SizedBox(height: 14),
              Text(title, style: DsText.section.copyWith(fontSize: 20)),
              const SizedBox(height: 6),
              Text(message, style: DsText.small),
              for (final w in extra) ...[const SizedBox(height: 14), w],
              const SizedBox(height: 18),
              JarPrimaryButton(
                label: confirmText,
                onTap: () => Navigator.of(ctx).pop(true),
              ),
              const SizedBox(height: 6),
              JarGhostButton(
                label: cancelText,
                onTap: () => Navigator.of(ctx).pop(false),
              ),
            ],
          ),
    );
  }
}

/// Full-width navy button (mockup `.btn`).
class JarPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool loading;
  final IconData? icon;
  final Color? color;

  const JarPrimaryButton({
    super.key,
    required this.label,
    this.onTap,
    this.loading = false,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null && !loading;
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: Material(
        color:
            enabled || loading
                ? (color ?? AppColors.navy)
                : AppColors.navy.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(AppRadius.radiusButton),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.radiusButton),
          onTap: enabled ? onTap : null,
          child: Center(
            child:
                loading
                    ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.surfaceWhite,
                      ),
                    )
                    : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (icon != null) ...[
                          Icon(icon, size: 18, color: AppColors.surfaceWhite),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          label,
                          style: const TextStyle(
                            fontFamily: 'Supreme',
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: AppColors.surfaceWhite,
                          ),
                        ),
                      ],
                    ),
          ),
        ),
      ),
    );
  }
}

/// Text-only or fill-coloured secondary button (mockup `.btn.ghost` / `.btn.fill`).
class JarGhostButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool filled;
  final Color color;
  final IconData? icon;

  const JarGhostButton({
    super.key,
    required this.label,
    this.onTap,
    this.filled = false,
    this.color = AppColors.navy,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: Material(
        color: filled ? SheetSurface.fillOf(context) : Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.radiusButton),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.radiusButton),
          onTap: onTap,
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 18, color: color),
                  const SizedBox(width: 8),
                ],
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Supreme',
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Bottom action area for full screens (mockup `.foot`).
class JarFooter extends StatelessWidget {
  final List<Widget> children;
  const JarFooter({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Column(mainAxisSize: MainAxisSize.min, children: children),
      ),
    );
  }
}

/// Faded overlay with a spinner, for "Updating jar…".
class JarBusyOverlay extends StatelessWidget {
  final String label;
  const JarBusyOverlay({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: AppColors.cream.withValues(alpha: 0.75),
        alignment: Alignment.center,
        child: DsCard(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(
                strokeWidth: 2.5,
                color: AppColors.navy,
              ),
              const SizedBox(height: 14),
              Text(label, style: DsText.rowTitle),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- skeletons

/// Generic first-load skeleton for a jar screen: a header card, a group
/// label and a card of rows. Prefer a screen-specific skeleton below.
class JarLoading extends StatelessWidget {
  const JarLoading({super.key});

  @override
  Widget build(BuildContext context) => const DsSkeletonPage(
    children: [
      DsSkeletonCard(height: 96),
      SizedBox(height: 18),
      DsSkeletonLabel(),
      DsSkeletonListCard(rows: 4),
    ],
  );
}

/// Jar screen (dashboard) first load: identity row, balance card, quick
/// actions, statement rows. Sits under the jar header.
class JarDetailSkeleton extends StatelessWidget {
  const JarDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const DsSkeletonPage(
    padding: EdgeInsets.fromLTRB(16, 10, 16, 32),
    children: [
      Row(
        children: [
          DsSkeletonBox(width: 56, height: 56, radius: 16),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DsSkeletonLine(width: 160, height: 18),
                SizedBox(height: 8),
                DsSkeletonLine(width: 60, height: 12),
              ],
            ),
          ),
        ],
      ),
      SizedBox(height: 16),
      DsSkeletonCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DsSkeletonLine(width: 90, height: 10),
            SizedBox(height: 10),
            DsSkeletonLine(width: 200, height: 34),
            SizedBox(height: 14),
            DsSkeletonLine(width: 140, height: 10),
          ],
        ),
      ),
      SizedBox(height: 12),
      _QuickActionsSkeleton(count: 3),
      SizedBox(height: 18),
      DsSkeletonLabel(width: 90),
      DsSkeletonListCard(rows: 4, circleLeading: true),
    ],
  );
}

/// Jars tab / sheet first load: search box, group tabs, list of jars.
/// Sits under the "Jars" title row.
class JarsListSkeleton extends StatelessWidget {
  const JarsListSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const DsSkeletonPage(
    padding: EdgeInsets.fromLTRB(16, 0, 16, 24),
    children: [
      DsSkeletonCard(
        height: 44,
        padding: EdgeInsets.symmetric(horizontal: 14),
        child: Align(
          alignment: Alignment.centerLeft,
          child: DsSkeletonLine(width: 130, height: 12),
        ),
      ),
      SizedBox(height: 12),
      Row(
        children: [
          DsSkeletonBox(width: 64, height: 34, radius: AppRadius.radiusL),
          SizedBox(width: 8),
          DsSkeletonBox(width: 84, height: 34, radius: AppRadius.radiusL),
          SizedBox(width: 8),
          DsSkeletonBox(width: 72, height: 34, radius: AppRadius.radiusL),
        ],
      ),
      SizedBox(height: 16),
      DsSkeletonListCard(rows: 5),
    ],
  );
}

/// Home first load (below the greeting header): total, quick actions,
/// jar cards, recent activity. Use as a single child of Home's ListView.
class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const DsSkeleton(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(4, 6, 4, 2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DsSkeletonLine(width: 110, height: 11),
              SizedBox(height: 10),
              DsSkeletonLine(width: 230, height: 40),
              SizedBox(height: 10),
              DsSkeletonLine(width: 54, height: 22),
            ],
          ),
        ),
        SizedBox(height: 14),
        _QuickActionsSkeleton(count: 3),
        SizedBox(height: 18),
        DsSkeletonLabel(width: 80),
        SizedBox(
          height: 168,
          child: ClipRect(
            child: OverflowBox(
              alignment: Alignment.centerLeft,
              maxWidth: double.infinity,
              child: Row(
                children: [
                  DsSkeletonCard(height: 168, child: SizedBox(width: 188)),
                  SizedBox(width: 10),
                  DsSkeletonCard(height: 168, child: SizedBox(width: 188)),
                ],
              ),
            ),
          ),
        ),
        SizedBox(height: 18),
        DsSkeletonLabel(width: 110),
        DsSkeletonListCard(rows: 3, circleLeading: true),
      ],
    ),
  );
}

/// Recent-activity card while the current jar loads (Home).
class JarActivitySkeleton extends StatelessWidget {
  final int rows;
  const JarActivitySkeleton({super.key, this.rows = 3});

  @override
  Widget build(BuildContext context) =>
      DsSkeleton(child: DsSkeletonListCard(rows: rows, circleLeading: true));
}

/// Jar settings first load: jar header card, then grouped setting rows.
class JarSettingsSkeleton extends StatelessWidget {
  const JarSettingsSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const DsSkeletonPage(
    padding: EdgeInsets.fromLTRB(16, 4, 16, 32),
    children: [
      DsSkeletonCard(
        child: Row(
          children: [
            DsSkeletonBox(width: 64, height: 64, radius: 16),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DsSkeletonLine(width: 150, height: 16),
                  SizedBox(height: 8),
                  DsSkeletonLine(width: 90, height: 11),
                ],
              ),
            ),
          ],
        ),
      ),
      SizedBox(height: 20),
      DsSkeletonLabel(),
      DsSkeletonListCard(rows: 3, leading: false),
      SizedBox(height: 20),
      DsSkeletonLabel(width: 90),
      DsSkeletonListCard(rows: 4, leading: false),
    ],
  );
}

/// Row of quick-action tiles (76 high), like `DsQuickAction`s.
class _QuickActionsSkeleton extends StatelessWidget {
  final int count;
  const _QuickActionsSkeleton({required this.count});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      for (var i = 0; i < count; i++) ...[
        if (i > 0) const SizedBox(width: 8),
        const Expanded(
          child: DsSkeletonCard(
            height: 76,
            padding: EdgeInsets.symmetric(vertical: 14),
            child: Column(
              children: [
                DsSkeletonCircle(size: 24),
                SizedBox(height: 9),
                DsSkeletonLine(width: 44, height: 10),
              ],
            ),
          ),
        ),
      ],
    ],
  );
}
