/// Form and sheet pieces from the redesign mockups (floating-label fields,
/// grouped fields, segmented control, radio, toggle, sheet frame).
///
/// Lives here rather than in core/ so the account, payout, inbox, referral and
/// media screens can share them without touching the shared design system.
library;

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';

// ---------------------------------------------------------------- sheet

/// White bottom-sheet frame: 24 top radius, grab handle, 14 gap between
/// children, safe-area and keyboard padding at the bottom.
class AccSheet extends StatelessWidget {
  final List<Widget> children;
  final double gap;

  const AccSheet({super.key, required this.children, this.gap = 14});

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppRadius.radiusSheet),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        16,
        8,
        16,
        16 + media.padding.bottom + media.viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: gap,
        children: [const Center(child: AccGrab()), ...children],
      ),
    );
  }
}

class AccGrab extends StatelessWidget {
  const AccGrab({super.key});

  @override
  Widget build(BuildContext context) => Container(
    width: 36,
    height: 5,
    decoration: BoxDecoration(
      color: const Color(0xFFDADDE3),
      borderRadius: BorderRadius.circular(5),
    ),
  );
}

/// Sheet header: title on the left, round close button on the right.
class AccSheetHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onClose;

  const AccSheetHeader(this.title, {super.key, this.onClose});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Text(title, style: AccText.h2)),
        AccRoundButton(
          icon: Icons.close_rounded,
          onTap: onClose ?? () => Navigator.of(context).maybePop(),
        ),
      ],
    );
  }
}

/// 36px fill-coloured round icon button (sheet close, copy).
class AccRoundButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final Color background;
  final Color foreground;
  final double size;

  const AccRoundButton({
    super.key,
    required this.icon,
    this.onTap,
    this.background = AppColors.fill,
    this.foreground = AppColors.navy,
    this.size = 36,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      borderRadius: BorderRadius.circular(size * 0.33),
      child: InkWell(
        borderRadius: BorderRadius.circular(size * 0.33),
        onTap: onTap,
        child: SizedBox(
          width: size,
          height: size,
          child: Icon(icon, size: size * 0.5, color: foreground),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- type

class AccText {
  static const bigTitle = TextStyle(
    fontFamily: 'Chillax',
    fontWeight: FontWeight.w600,
    fontSize: 31,
    height: 1.05,
    letterSpacing: -0.5,
    color: AppColors.navy,
  );
  static const h1 = TextStyle(
    fontFamily: 'Chillax',
    fontWeight: FontWeight.w600,
    fontSize: 27,
    height: 1.1,
    letterSpacing: -0.4,
    color: AppColors.navy,
  );
  static const h2 = TextStyle(
    fontFamily: 'Chillax',
    fontWeight: FontWeight.w600,
    fontSize: 19,
    letterSpacing: -0.1,
    color: AppColors.navy,
  );
  static const h3 = TextStyle(
    fontFamily: 'Supreme',
    fontWeight: FontWeight.w600,
    fontSize: 15,
    color: AppColors.navy,
  );
}

// ---------------------------------------------------------------- fields

/// White group holding several fields separated by hairlines.
class AccFieldGroup extends StatelessWidget {
  final List<Widget> children;
  const AccFieldGroup({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) rows.add(const Divider(height: 1, color: AppColors.line));
      rows.add(children[i]);
    }
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(AppRadius.radiusButton),
        border: Border.all(color: AppColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(mainAxisSize: MainAxisSize.min, children: rows),
    );
  }
}

BoxDecoration _fieldDecoration({
  required bool grouped,
  required bool focused,
  required bool error,
  required bool locked,
}) {
  if (locked) {
    return BoxDecoration(
      color: AppColors.fill,
      borderRadius:
          grouped ? null : BorderRadius.circular(AppRadius.radiusButton),
    );
  }
  if (grouped) return const BoxDecoration(color: AppColors.surfaceWhite);
  return BoxDecoration(
    color: AppColors.surfaceWhite,
    borderRadius: BorderRadius.circular(AppRadius.radiusButton),
    border: Border.all(
      color:
          error
              ? AppColors.negative
              : focused
              ? AppColors.navy
              : AppColors.line,
      width: error || focused ? 2 : 1,
    ),
  );
}

const _fieldValueStyle = TextStyle(
  fontFamily: 'Supreme',
  fontSize: 15.5,
  fontWeight: FontWeight.w500,
  color: AppColors.navy,
);

const _fieldLabelStyle = TextStyle(
  fontFamily: 'Supreme',
  fontSize: 12,
  color: AppColors.muted,
);

/// Floating-label text field: small grey label above the value.
class AccField extends StatefulWidget {
  final String label;
  final TextEditingController? controller;
  final String? hint;
  final TextInputType keyboardType;
  final bool enabled;

  /// Read-only with a lock icon on fill background.
  final bool locked;
  final bool error;
  final bool grouped;
  final Widget? trailing;
  final Widget? leading;
  final ValueChanged<String>? onChanged;
  final int maxLines;
  final TextCapitalization textCapitalization;

  const AccField({
    super.key,
    required this.label,
    this.controller,
    this.hint,
    this.keyboardType = TextInputType.text,
    this.enabled = true,
    this.locked = false,
    this.error = false,
    this.grouped = false,
    this.trailing,
    this.leading,
    this.onChanged,
    this.maxLines = 1,
    this.textCapitalization = TextCapitalization.none,
  });

  @override
  State<AccField> createState() => _AccFieldState();
}

class _AccFieldState extends State<AccField> {
  final FocusNode _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final editable = widget.enabled && !widget.locked;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: editable ? () => _focus.requestFocus() : null,
      child: Container(
        constraints: const BoxConstraints(minHeight: 58),
        padding: const EdgeInsets.fromLTRB(14, 9, 14, 10),
        decoration: _fieldDecoration(
          grouped: widget.grouped,
          focused: _focus.hasFocus,
          error: widget.error,
          locked: widget.locked,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(widget.label, style: _fieldLabelStyle),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      if (widget.leading != null) ...[
                        widget.leading!,
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        child: TextField(
                          controller: widget.controller,
                          focusNode: _focus,
                          enabled: editable,
                          keyboardType: widget.keyboardType,
                          onChanged: widget.onChanged,
                          maxLines: widget.maxLines,
                          minLines: 1,
                          textCapitalization: widget.textCapitalization,
                          cursorColor: AppColors.navy,
                          style: _fieldValueStyle.copyWith(
                            color:
                                widget.enabled || widget.locked
                                    ? AppColors.navy
                                    : AppColors.muted,
                          ),
                          decoration: InputDecoration.collapsed(
                            hintText: widget.hint,
                            hintStyle: _fieldValueStyle.copyWith(
                              color: AppColors.faint,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (widget.locked)
              const Padding(
                padding: EdgeInsets.only(left: 8),
                child: Icon(
                  Icons.lock_outline_rounded,
                  size: 18,
                  color: AppColors.muted,
                ),
              )
            else if (widget.trailing != null)
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: widget.trailing!,
              ),
          ],
        ),
      ),
    );
  }
}

/// Floating-label picker field: label, value (with optional leading logo) and
/// a down chevron. Tapping opens whatever picker [onTap] shows.
class AccSelectField extends StatelessWidget {
  final String label;
  final String? value;
  final String? placeholder;
  final Widget? leading;
  final VoidCallback? onTap;
  final bool grouped;
  final bool showChevron;

  const AccSelectField({
    super.key,
    required this.label,
    this.value,
    this.placeholder,
    this.leading,
    this.onTap,
    this.grouped = false,
    this.showChevron = true,
  });

  @override
  Widget build(BuildContext context) {
    final hasValue = value != null && value!.isNotEmpty;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius:
            grouped ? null : BorderRadius.circular(AppRadius.radiusButton),
        child: Ink(
          decoration: _fieldDecoration(
            grouped: grouped,
            focused: false,
            error: false,
            locked: false,
          ),
          child: Container(
            constraints: const BoxConstraints(minHeight: 58),
            padding: const EdgeInsets.fromLTRB(14, 9, 14, 10),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(label, style: _fieldLabelStyle),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          if (hasValue && leading != null) ...[
                            leading!,
                            const SizedBox(width: 8),
                          ],
                          Expanded(
                            child: Text(
                              hasValue ? value! : (placeholder ?? ''),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style:
                                  hasValue
                                      ? _fieldValueStyle
                                      : _fieldValueStyle.copyWith(
                                        color: AppColors.faint,
                                        fontWeight: FontWeight.w400,
                                      ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (showChevron)
                  Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 20,
                    color: onTap == null ? AppColors.faint : AppColors.muted,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Small grey helper line under a field group.
class AccHelp extends StatelessWidget {
  final String text;
  final String? linkText;
  final VoidCallback? onLink;

  const AccHelp(this.text, {super.key, this.linkText, this.onLink});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 4,
        children: [
          Text(text, style: DsText.caption),
          if (linkText != null)
            GestureDetector(
              onTap: onLink,
              child: Text(
                linkText!,
                style: const TextStyle(
                  fontFamily: 'Supreme',
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                  decoration: TextDecoration.underline,
                  decorationColor: AppColors.lime,
                  decorationThickness: 3,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------- controls

/// Two-or-more option segmented control on a fill track.
class AccSegmented<T> extends StatelessWidget {
  final List<(T value, String label)> options;
  final T selected;
  final ValueChanged<T>? onChanged;

  const AccSegmented({
    super.key,
    required this.options,
    required this.selected,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.fill,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          for (final (value, label) in options)
            Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap:
                    onChanged == null || value == selected
                        ? null
                        : () => onChanged!(value),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  height: 36,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color:
                        value == selected
                            ? AppColors.surfaceWhite
                            : Colors.transparent,
                    borderRadius: BorderRadius.circular(9),
                    border:
                        value == selected
                            ? Border.all(color: AppColors.line)
                            : null,
                  ),
                  child: Text(
                    label,
                    style: TextStyle(
                      fontFamily: 'Supreme',
                      fontSize: 13.5,
                      fontWeight:
                          value == selected ? FontWeight.w600 : FontWeight.w500,
                      color:
                          value == selected ? AppColors.navy : AppColors.ink2,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// 22px radio dot: grey ring off, thick navy ring on.
class AccRadio extends StatelessWidget {
  final bool on;
  const AccRadio(this.on, {super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 140),
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: on ? AppColors.navy : const Color(0xFFD0D4DB),
          width: on ? 7 : 2,
        ),
      ),
    );
  }
}

/// Toggle: navy track with a lime thumb when on.
class AccSwitch extends StatelessWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;

  const AccSwitch({super.key, required this.value, this.onChanged});

  @override
  Widget build(BuildContext context) {
    return CupertinoSwitch(
      value: value,
      onChanged: onChanged,
      activeTrackColor: AppColors.navy,
      inactiveTrackColor: const Color(0xFFDADDE3),
      thumbColor: value ? AppColors.lime : AppColors.surfaceWhite,
    );
  }
}

/// Full-width ghost button (transparent, navy text) used under sheet actions.
class AccGhostButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;

  const AccGhostButton({super.key, required this.text, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: TextButton(
        onPressed: onPressed,
        style: TextButton.styleFrom(
          foregroundColor: AppColors.navy,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.radiusButton),
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontFamily: 'Supreme',
            fontWeight: FontWeight.w600,
            fontSize: 15.5,
            color: AppColors.navy,
          ),
        ),
      ),
    );
  }
}

/// Small rounded leading tile for list rows (32px, 10 radius).
class AccRowIcon extends StatelessWidget {
  final IconData icon;
  final Color background;
  final Color foreground;

  const AccRowIcon(
    this.icon, {
    super.key,
    this.background = AppColors.fill,
    this.foreground = AppColors.navy,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, size: 17, color: foreground),
    );
  }
}

// ---------------------------------------------------------------- option sheet

/// One choice in [showAccOptionSheet].
class AccOption<T> {
  final T value;
  final String label;
  final String? subtitle;
  final Widget? leading;

  const AccOption({
    required this.value,
    required this.label,
    this.subtitle,
    this.leading,
  });
}

/// Short picker sheet: title + close, a cream list of rows with radios and an
/// optional footnote. Resolves with the picked value, or null on dismiss.
Future<T?> showAccOptionSheet<T>(
  BuildContext context, {
  required String title,
  required List<AccOption<T>> options,
  T? selected,
  String? footnote,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder:
        (sheetContext) => AccSheet(
          children: [
            AccSheetHeader(title),
            Flexible(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(AppRadius.radiusCard),
                ),
                clipBehavior: Clip.antiAlias,
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      for (var i = 0; i < options.length; i++) ...[
                        if (i > 0)
                          const Divider(height: 1, color: AppColors.line),
                        DsRow(
                          leading: options[i].leading,
                          title: options[i].label,
                          subtitle: options[i].subtitle,
                          trailing: AccRadio(options[i].value == selected),
                          onTap:
                              () => Navigator.of(
                                sheetContext,
                              ).pop(options[i].value),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            if (footnote != null) Text(footnote, style: DsText.caption),
          ],
        ),
  );
}
