/// Hogapay redesign building blocks (see hogapay.com/redesign).
///
/// Screens compose these instead of styling cards, rows and tags by hand, so
/// every screen reads the same: cream canvas, flat white cards, Chillax
/// headings and money, Supreme text, lime for what's active.
library;

import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/sheet_surface.dart';

export 'package:Hoga/core/widgets/ds/ds_skeleton.dart';

// ---------------------------------------------------------------- type

class DsText {
  static TextStyle get display => TextStyle(
    fontFamily: 'Chillax',
    fontWeight: FontWeight.w600,
    fontSize: 30,
    height: 1.1,
    letterSpacing: -0.5,
    color: AppColors.navy,
  );
  static TextStyle get title => TextStyle(
    fontFamily: 'Chillax',
    fontWeight: FontWeight.w600,
    fontSize: 26,
    height: 1.12,
    letterSpacing: -0.4,
    color: AppColors.navy,
  );
  static TextStyle get section => TextStyle(
    fontFamily: 'Chillax',
    fontWeight: FontWeight.w600,
    fontSize: 17,
    letterSpacing: -0.1,
    color: AppColors.navy,
  );
  static TextStyle get body => TextStyle(
    fontFamily: 'Supreme',
    fontSize: 15,
    height: 1.5,
    color: AppColors.ink2,
  );
  static TextStyle get rowTitle => TextStyle(
    fontFamily: 'Supreme',
    fontSize: 15,
    fontWeight: FontWeight.w500,
    color: AppColors.navy,
  );
  static TextStyle get small => TextStyle(
    fontFamily: 'Supreme',
    fontSize: 13.5,
    height: 1.45,
    color: AppColors.ink2,
  );
  static TextStyle get caption =>
      TextStyle(fontFamily: 'Supreme', fontSize: 12, color: AppColors.muted);
  static TextStyle get overline => TextStyle(
    fontFamily: 'Supreme',
    fontSize: 12,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.4,
    color: AppColors.muted,
  );
}

// ---------------------------------------------------------------- money

/// Big tabular amount: "GHS 12,480.00" with the currency small and the
/// pesewas faint, as in the mockups.
class DsMoney extends StatelessWidget {
  final double amount;
  final String? currency;
  final double size;
  final Color? color;
  final bool signed;

  const DsMoney(
    this.amount, {
    super.key,
    this.currency = 'GHS',
    this.size = 40,
    this.color,
    this.signed = false,
  });

  static String group(double v) {
    final whole = v.abs().truncate().toString();
    final b = StringBuffer();
    for (var i = 0; i < whole.length; i++) {
      if (i > 0 && (whole.length - i) % 3 == 0) b.write(',');
      b.write(whole[i]);
    }
    return b.toString();
  }

  @override
  Widget build(BuildContext context) {
    final cents = ((amount.abs() * 100).round() % 100).toString().padLeft(
      2,
      '0',
    );
    final sign = signed ? (amount < 0 ? '−' : '+') : (amount < 0 ? '−' : '');
    final main = TextStyle(
      fontFamily: 'Chillax',
      fontWeight: FontWeight.w600,
      fontSize: size,
      letterSpacing: -0.4,
      height: 1.1,
      color: color ?? AppColors.navy,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
    return Text.rich(
      TextSpan(
        children: [
          if (currency != null)
            TextSpan(
              text: '$currency ',
              style: TextStyle(
                fontFamily: 'Supreme',
                fontWeight: FontWeight.w500,
                fontSize: size * 0.42,
                color: AppColors.muted,
              ),
            ),
          TextSpan(text: '$sign${group(amount)}', style: main),
          TextSpan(
            text: '.$cents',
            style: main.copyWith(color: AppColors.faint),
          ),
        ],
      ),
      maxLines: 1,
      overflow: TextOverflow.fade,
      softWrap: false,
    );
  }
}

// ---------------------------------------------------------------- surfaces

/// Flat white card, 20 radius, no shadow.
class DsCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final VoidCallback? onTap;
  final BoxBorder? border;

  const DsCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.color,
    this.onTap,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    final box = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? AppColors.surfaceWhite,
        border: border,
        borderRadius: BorderRadius.circular(AppRadius.radiusCard),
      ),
      child: child,
    );
    if (onTap == null) return box;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.radiusCard),
        onTap: onTap,
        child: box,
      ),
    );
  }
}

/// White card holding rows separated by hairlines (settings, statements).
class DsListCard extends StatelessWidget {
  final List<Widget> children;

  const DsListCard({super.key, required this.children});

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
        borderRadius: BorderRadius.circular(AppRadius.radiusCard),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(mainAxisSize: MainAxisSize.min, children: rows),
    );
  }
}

/// A list row: leading tile, title + subtitle, trailing value/widget.
class DsRow extends StatelessWidget {
  final Widget? leading;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final String? value;
  final VoidCallback? onTap;
  final bool chevron;
  final Color? titleColor;

  const DsRow({
    super.key,
    required this.title,
    this.leading,
    this.subtitle,
    this.trailing,
    this.value,
    this.onTap,
    this.chevron = false,
    this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 36),
          child: Row(
            children: [
              if (leading != null) ...[leading!, const SizedBox(width: 12)],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: DsText.rowTitle.copyWith(color: titleColor),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: DsText.caption,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              if (value != null) ...[
                const SizedBox(width: 8),
                // Capped, not Flexible: a Flexible here split the row 50/50
                // with the title and left the value mid-row.
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 170),
                  child: Text(
                    value!,
                    style: DsText.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
              if (trailing != null) ...[const SizedBox(width: 8), trailing!],
              if (chevron) ...[
                const SizedBox(width: 4),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: AppColors.faint,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Label / value pair, used inside DsListCard for receipts and breakdowns.
class DsKeyValue extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool strong;

  const DsKeyValue(
    this.label,
    this.value, {
    super.key,
    this.valueColor,
    this.strong = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Text(
            label,
            style:
                strong
                    ? DsText.rowTitle
                    : DsText.small.copyWith(color: AppColors.muted),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: DsText.rowTitle.copyWith(
                fontSize: 14,
                fontWeight: strong ? FontWeight.w700 : FontWeight.w500,
                color: valueColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Section heading with an optional action on the right ("See all").
class DsSectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;

  const DsSectionHeader(this.title, {super.key, this.action, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
      child: Row(
        children: [
          Expanded(child: Text(title, style: DsText.section)),
          if (action != null) DsLink(action!, onTap: onAction),
        ],
      ),
    );
  }
}

/// Small overline label above a list group ("ACCOUNT", "MONEY").
class DsGroupLabel extends StatelessWidget {
  final String text;
  const DsGroupLabel(this.text, {super.key});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 6, 4, 0),
    child: Text(text.toUpperCase(), style: DsText.overline),
  );
}

/// Navy link text with a lime underline.
class DsLink extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  const DsLink(this.text, {super.key, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Text(
      text,
      style: TextStyle(
        fontFamily: 'Supreme',
        fontWeight: FontWeight.w700,
        fontSize: 14,
        color: AppColors.navy,
        decoration: TextDecoration.underline,
        decorationColor: AppColors.lime,
        decorationThickness: 3,
      ),
    ),
  );
}

// ---------------------------------------------------------------- tags & tiles

enum DsTone { positive, negative, pending, info, neutral, dark, lime }

/// Status tag. Green and red only for money in/out and errors.
class DsTag extends StatelessWidget {
  final String text;
  final DsTone tone;

  const DsTag(this.text, {super.key, this.tone = DsTone.neutral});

  static (Color, Color) colors(DsTone t) => switch (t) {
    DsTone.positive => (AppColors.positiveSoft, AppColors.positive),
    DsTone.negative => (AppColors.negativeSoft, AppColors.negative),
    DsTone.pending => (AppColors.pendingSoft, AppColors.pending),
    DsTone.info => (AppColors.infoSoft, AppColors.info),
    DsTone.neutral => (AppColors.fill, AppColors.ink2),
    DsTone.dark => (AppColors.navy, AppColors.surfaceWhite),
    DsTone.lime => (AppColors.limeSoft, AppColors.navy),
  };

  @override
  Widget build(BuildContext context) {
    final (toneBg, fg) = colors(tone);
    final bg = tone == DsTone.neutral ? SheetSurface.fillOf(context) : toneBg;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(7),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: 'Supreme',
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}

/// Rounded icon tile used as a row leading or a big state icon.
class DsIconTile extends StatelessWidget {
  final IconData icon;
  final DsTone tone;
  final double size;

  const DsIconTile(
    this.icon, {
    super.key,
    this.tone = DsTone.neutral,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final (bg, fg) =
        tone == DsTone.lime
            ? (AppColors.limeSoft, AppColors.navy)
            : tone == DsTone.dark
            ? (AppColors.navy, AppColors.limeOnInk)
            : DsTag.colors(tone);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: tone == DsTone.neutral ? SheetSurface.fillOf(context) : bg,
        borderRadius: BorderRadius.circular(size * 0.3),
      ),
      child: Icon(
        icon,
        size: size * 0.5,
        color: tone == DsTone.neutral ? AppColors.navy : fg,
      ),
    );
  }
}

/// Mobile money network tile with the real logo.
enum DsNetwork { mtn, telecel, airtelTigo }

class DsNetworkLogo extends StatelessWidget {
  final DsNetwork network;
  final double size;

  const DsNetworkLogo(this.network, {super.key, this.size = 40});

  /// Best-effort mapping from provider strings used across the app.
  static DsNetwork? fromProvider(String? provider) {
    final p = (provider ?? '').toLowerCase();
    if (p.contains('mtn')) return DsNetwork.mtn;
    if (p.contains('telecel') || p.contains('vodafone'))
      return DsNetwork.telecel;
    if (p.contains('airtel') || p.contains('tigo') || p == 'at') {
      return DsNetwork.airtelTigo;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final (bg, asset, scale) = switch (network) {
      DsNetwork.mtn => (
        AppColors.mtnYellow,
        'assets/images/networks/mtn.png',
        0.86,
      ),
      DsNetwork.telecel => (
        AppColors.telecelRed,
        'assets/images/networks/telecel.png',
        1.0,
      ),
      DsNetwork.airtelTigo => (
        AppColors.surfaceWhite,
        'assets/images/networks/airteltigo.png',
        0.74,
      ),
    };
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(
          network == DsNetwork.telecel ? size / 2 : size * 0.3,
        ),
        border:
            network == DsNetwork.airtelTigo
                ? Border.all(color: AppColors.line)
                : null,
      ),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child: Image.asset(
        asset,
        width: size * scale,
        height: size * scale,
        fit: BoxFit.contain,
      ),
    );
  }
}

// ---------------------------------------------------------------- actions

/// Square quick-action tile (Collect, Request, Transfer…). The primary one is navy.
class DsQuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool primary;

  const DsQuickAction({
    super.key,
    required this.icon,
    required this.label,
    this.onTap,
    this.primary = false,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Opacity(
      opacity: enabled ? 1 : 0.35,
      child: Material(
        color: primary ? AppColors.inkFill : AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: SizedBox(
            height: 76,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: 22,
                  color: primary ? AppColors.lime : AppColors.navy,
                ),
                const SizedBox(height: 7),
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Supreme',
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: primary ? AppColors.onInkFill : AppColors.navy,
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

/// Soft note / banner (lime tip, amber warning, red error, blue info).
class DsNote extends StatelessWidget {
  final String? title;
  final String text;
  final DsTone tone;
  final IconData icon;
  final VoidCallback? onTap;

  const DsNote({
    super.key,
    this.title,
    required this.text,
    this.tone = DsTone.lime,
    this.icon = Icons.info_outline_rounded,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final (bg, fg) =
        tone == DsTone.lime
            ? (AppColors.limeSoft, AppColors.navy)
            : tone == DsTone.neutral
            ? (AppColors.surfaceWhite, AppColors.muted)
            : DsTag.colors(tone);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border:
              tone == DsTone.lime
                  ? Border.all(color: const Color(0xFFE3F1B9))
                  : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: fg),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (title != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 2),
                      child: Text(
                        title!,
                        style: DsText.rowTitle.copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  Text(text, style: DsText.small),
                ],
              ),
            ),
            if (onTap != null)
              Padding(
                padding: EdgeInsets.only(left: 6, top: 2),
                child: Icon(Icons.chevron_right_rounded, color: AppColors.navy),
              ),
          ],
        ),
      ),
    );
  }
}

/// Empty state: icon tile, title, one line, one optional action.
class DsEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final DsTone tone;

  const DsEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.tone = DsTone.neutral,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DsIconTile(icon, tone: tone, size: 56),
          const SizedBox(height: 12),
          Text(
            title,
            style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w700),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(message, style: DsText.small, textAlign: TextAlign.center),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 14),
            DsSmallButton(label: actionLabel!, onTap: onAction),
          ],
        ],
      ),
    );
  }
}

/// Radio dot used in pickers: grey ring, navy filled ring when on.
class DsRadio extends StatelessWidget {
  final bool selected;
  const DsRadio({super.key, required this.selected});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 140),
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: selected ? AppColors.navy : const Color(0xFFD0D4DB),
          width: selected ? 7 : 2,
        ),
      ),
    );
  }
}

/// Compact navy button for inline actions ("Share link", "Transfer").
class DsSmallButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool secondary;

  const DsSmallButton({
    super.key,
    required this.label,
    this.onTap,
    this.icon,
    this.secondary = false,
  });

  @override
  Widget build(BuildContext context) {
    final fg = secondary ? AppColors.navy : AppColors.onInkFill;
    return Material(
      color: secondary ? SheetSurface.fillOf(context) : AppColors.inkFill,
      borderRadius: BorderRadius.circular(11),
      child: InkWell(
        borderRadius: BorderRadius.circular(11),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: fg),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Supreme',
                  fontWeight: FontWeight.w700,
                  fontSize: 13.5,
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

/// Progress bar (navy on fill; lime on navy cards).
class DsProgress extends StatelessWidget {
  final double value;
  final double height;
  final bool onDark;

  const DsProgress(
    this.value, {
    super.key,
    this.height = 6,
    this.onDark = false,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: LinearProgressIndicator(
        value: value.clamp(0, 1),
        minHeight: height,
        backgroundColor:
            onDark
                ? AppColors.onPrimaryWhite.withValues(alpha: 0.14)
                : AppColors.fill,
        color: onDark ? AppColors.limeOnInk : AppColors.navy,
      ),
    );
  }
}

/// Step list with done / current / upcoming dots (verification, transfers).
class DsSteps extends StatelessWidget {
  final List<(String title, String? subtitle)> steps;
  final int current; // index of the current step; earlier ones are done

  const DsSteps({super.key, required this.steps, required this.current});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < steps.length; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color:
                            i < current
                                ? AppColors.positive
                                : i == current
                                ? AppColors.navy
                                : AppColors.fill,
                      ),
                      alignment: Alignment.center,
                      child:
                          i < current
                              ? Icon(
                                Icons.check,
                                size: 15,
                                color: AppColors.onPrimaryWhite,
                              )
                              : Text(
                                '${i + 1}',
                                style: TextStyle(
                                  fontFamily: 'Supreme',
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                  color:
                                      i == current
                                          ? AppColors.limeOnInk
                                          : AppColors.ink2,
                                ),
                              ),
                    ),
                    if (i < steps.length - 1)
                      Expanded(
                        child: Container(width: 2, color: AppColors.line),
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      bottom: i < steps.length - 1 ? 16 : 0,
                      top: 3,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          steps[i].$1,
                          style: DsText.rowTitle.copyWith(
                            fontSize: 14,
                            fontWeight:
                                i == current
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                            color:
                                i > current ? AppColors.muted : AppColors.navy,
                          ),
                        ),
                        if (steps[i].$2 != null)
                          Text(steps[i].$2!, style: DsText.caption),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
