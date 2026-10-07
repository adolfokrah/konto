/// Shared pieces for the sign-in, sign-up and verification screens in the
/// redesign: the top bar with a boxed back button, the big Chillax header,
/// the pinned footer, the selectable option card and grouped text fields.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:Hoga/core/widgets/number_country_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';

/// Top bar: boxed back (or close) button, optional centered title or
/// progress bar.
class AuthTopBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final double? progress;
  final bool close;
  final VoidCallback? onBack;

  /// Where back goes when there is nothing to pop, e.g. after sign-out
  /// lands straight on this screen. Keeps the back button visible.
  final String? fallbackRoute;
  final Color? background;

  const AuthTopBar({
    super.key,
    this.title,
    this.progress,
    this.close = false,
    this.onBack,
    this.fallbackRoute,
    this.background,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    final canPop = onBack != null || fallbackRoute != null || context.canPop();
    Widget? middle;
    if (progress != null) {
      middle = SizedBox(width: 120, child: DsProgress(progress!, height: 5));
    } else if (title != null) {
      middle = Text(title!, style: DsText.section);
    }
    return AppBar(
      backgroundColor: background ?? AppColors.cream,
      automaticallyImplyLeading: false,
      centerTitle: true,
      toolbarHeight: 60,
      leadingWidth: 68,
      leading:
          canPop
              ? Padding(
                padding: const EdgeInsets.only(left: 16),
                child: Center(
                  child: AuthBoxButton(
                    icon:
                        close
                            ? Icons.close_rounded
                            : Icons.arrow_back_ios_new_rounded,
                    onTap:
                        onBack ??
                        () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go(fallbackRoute!);
                          }
                        },
                    filled: background == AppColors.surfaceWhite,
                  ),
                ),
              )
              : null,
      title: middle,
    );
  }
}

/// 42px rounded square icon button (white on cream, fill on white).
class AuthBoxButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool filled;

  const AuthBoxButton({
    super.key,
    required this.icon,
    this.onTap,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? AppColors.fill : AppColors.surfaceWhite,
      borderRadius: BorderRadius.circular(13),
      child: InkWell(
        borderRadius: BorderRadius.circular(13),
        onTap: onTap,
        child: SizedBox(
          width: 42,
          height: 42,
          child: Icon(icon, size: 18, color: AppColors.navy),
        ),
      ),
    );
  }
}

/// Big Chillax title with an optional supporting line.
class AuthHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? subtitleWidget;

  const AuthHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.subtitleWidget,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: DsText.title),
        if (subtitle != null || subtitleWidget != null) ...[
          const SizedBox(height: 8),
          subtitleWidget ?? Text(subtitle!, style: DsText.body),
        ],
      ],
    );
  }
}

/// Bottom-pinned action area that respects the safe area.
class AuthFooter extends StatelessWidget {
  final List<Widget> children;
  final Color? background;

  const AuthFooter({super.key, required this.children, this.background});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: background ?? AppColors.cream,
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < children.length; i++) ...[
              if (i > 0) const SizedBox(height: 10),
              children[i],
            ],
          ],
        ),
      ),
    );
  }
}

/// Selectable option card with icon, title, description, tags and a radio.
class AuthChoiceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final List<String> tags;
  final bool selected;
  final VoidCallback onTap;

  const AuthChoiceCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.tags,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceWhite,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? AppColors.navy : AppColors.line,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DsIconTile(
                icon,
                tone: selected ? DsTone.lime : DsTone.neutral,
                size: 42,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: DsText.section.copyWith(fontSize: 16)),
                    const SizedBox(height: 2),
                    Text(description, style: DsText.small),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [for (final t in tags) DsTag(t)],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _Radio(selected: selected),
            ],
          ),
        ),
      ),
    );
  }
}

class _Radio extends StatelessWidget {
  final bool selected;
  const _Radio({required this.selected});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? AppColors.navy : AppColors.surfaceWhite,
        border: Border.all(
          color: selected ? AppColors.navy : AppColors.faint,
          width: 2,
        ),
      ),
      alignment: Alignment.center,
      child:
          selected
              ? Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.limeOnInk,
                ),
              )
              : null,
    );
  }
}

/// White card that stacks text fields with hairlines between them.
class AuthFieldGroup extends StatelessWidget {
  final List<Widget> children;

  const AuthFieldGroup({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) rows.add(Divider(height: 1, color: AppColors.line));
      rows.add(children[i]);
    }
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(mainAxisSize: MainAxisSize.min, children: rows),
    );
  }
}

/// A borderless labelled text field, meant to sit inside [AuthFieldGroup]
/// (or alone, with [standalone] true, as its own white field).
class AuthField extends StatelessWidget {
  final String label;
  final String? hintText;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final TextInputType keyboardType;
  final TextCapitalization textCapitalization;
  final Widget? suffix;
  final bool standalone;
  final bool error;
  final String? prefixText;

  const AuthField({
    super.key,
    required this.label,
    this.hintText,
    this.controller,
    this.onChanged,
    this.keyboardType = TextInputType.text,
    this.textCapitalization = TextCapitalization.none,
    this.suffix,
    this.standalone = false,
    this.error = false,
    this.prefixText,
  });

  @override
  Widget build(BuildContext context) {
    final field = Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              keyboardType: keyboardType,
              textCapitalization: textCapitalization,
              cursorColor: AppColors.navy,
              style: DsText.rowTitle.copyWith(fontSize: 16),
              decoration: InputDecoration(
                labelText: label,
                hintText: hintText,
                prefixText: prefixText,
                prefixStyle: DsText.rowTitle.copyWith(
                  fontSize: 16,
                  color: AppColors.muted,
                ),
                labelStyle: DsText.body.copyWith(
                  color: error ? AppColors.negative : AppColors.muted,
                ),
                floatingLabelStyle: DsText.caption.copyWith(
                  fontWeight: FontWeight.w600,
                  color: error ? AppColors.negative : AppColors.muted,
                ),
                hintStyle: DsText.body.copyWith(color: AppColors.faint),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 4),
              ),
            ),
          ),
          if (suffix != null) ...[const SizedBox(width: 8), suffix!],
        ],
      ),
    );
    if (!standalone) return field;
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: error ? AppColors.negative : AppColors.line,
          width: error ? 2 : 1,
        ),
      ),
      child: field,
    );
  }
}

/// Small helper line under a field.
class AuthHelp extends StatelessWidget {
  final String text;
  final Color? color;
  const AuthHelp(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 6, 4, 0),
    child: Text(text, style: DsText.caption.copyWith(color: color)),
  );
}

// ---------------------------------------------------------------- phone + keypad

/// Country tile + "Phone number" field side by side (mockup: Phone number).
/// The field uses the in-app [AuthKeypad]; the system keyboard is suppressed.
class AuthPhoneRow extends StatelessWidget {
  final String countryCode;
  final TextEditingController controller;
  final VoidCallback onCountryTap;
  final Key? fieldKey;

  const AuthPhoneRow({
    super.key,
    required this.countryCode,
    required this.controller,
    required this.onCountryTap,
    this.fieldKey,
  });

  @override
  Widget build(BuildContext context) {
    final flag =
        NumberCountryPicker.getCountryByCode(countryCode)?.flag ?? '🇬🇭';
    return Row(
      children: [
        GestureDetector(
          onTap: onCountryTap,
          child: Container(
            width: 104,
            constraints: const BoxConstraints(minHeight: 58),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: AppColors.surfaceWhite,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Country', style: DsText.caption),
                const SizedBox(height: 2),
                Text(
                  '$flag $countryCode',
                  style: DsText.rowTitle.copyWith(fontSize: 15.5),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Container(
            constraints: const BoxConstraints(minHeight: 58),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: AppColors.surfaceWhite,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.navy, width: 2),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Phone number', style: DsText.caption),
                TextField(
                  key: fieldKey,
                  controller: controller,
                  keyboardType: TextInputType.none,
                  showCursor: true,
                  autofocus: true,
                  cursorColor: AppColors.navy,
                  style: DsText.rowTitle.copyWith(fontSize: 15.5),
                  decoration: InputDecoration(
                    isDense: true,
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.only(top: 2),
                    hintText: '24 123 4567',
                    hintStyle: TextStyle(color: AppColors.faint),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Numeric keypad from the mockups (1–9, 0, backspace; optional decimal).
class AuthKeypad extends StatelessWidget {
  final ValueChanged<String> onDigit;
  final VoidCallback onBackspace;
  final bool decimal;

  const AuthKeypad({
    super.key,
    required this.onDigit,
    required this.onBackspace,
    this.decimal = false,
  });

  @override
  Widget build(BuildContext context) {
    Widget key(Widget child, VoidCallback? onTap) => Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap:
            onTap == null
                ? null
                : () {
                  HapticFeedback.selectionClick();
                  onTap();
                },
        child: SizedBox(height: 54, child: Center(child: child)),
      ),
    );
    Text digit(String d) => Text(
      d,
      style: TextStyle(
        fontFamily: 'Chillax',
        fontWeight: FontWeight.w500,
        fontSize: 25,
        color: AppColors.navy,
      ),
    );
    final rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final r in rows)
            Row(children: [for (final d in r) key(digit(d), () => onDigit(d))]),
          Row(
            children: [
              decimal
                  ? key(digit('.'), () => onDigit('.'))
                  : key(const SizedBox(), null),
              key(digit('0'), () => onDigit('0')),
              key(
                Icon(Icons.backspace_outlined, color: AppColors.navy),
                onBackspace,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
