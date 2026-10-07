/// Shared pieces for the redesigned Collect, Activity and Team screens:
/// boxed top-bar buttons, segmented controls, chips, sheets, option tiles,
/// check/radio marks, avatars and payment-method tiles.
library;

import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/contributor_avatar.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/sheet_surface.dart';

// ---------------------------------------------------------------- top bar

/// 40px rounded square icon button (`ib box` white / `ib fill`).
class CollectBoxButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool filled;
  final bool loading;

  const CollectBoxButton({
    super.key,
    required this.icon,
    this.onTap,
    this.filled = false,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? SheetSurface.fillOf(context) : AppColors.surfaceWhite,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: loading ? null : onTap,
        child: SizedBox(
          width: 40,
          height: 40,
          child: Center(
            child:
                loading
                    ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.navy,
                      ),
                    )
                    : Icon(icon, size: 20, color: AppColors.navy),
          ),
        ),
      ),
    );
  }
}

/// Top bar with a boxed back/close button, a centred title and optional
/// trailing buttons.
class CollectTopBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final Widget? titleWidget;
  final IconData leadingIcon;
  final VoidCallback? onBack;
  final bool showBack;
  final List<Widget> actions;
  final Color background;
  final bool filledButtons;

  const CollectTopBar({
    super.key,
    this.title,
    this.titleWidget,
    this.leadingIcon = Icons.arrow_back_ios_new_rounded,
    this.onBack,
    this.showBack = true,
    this.actions = const [],
    this.background = AppColors.cream,
    this.filledButtons = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: background,
      automaticallyImplyLeading: false,
      centerTitle: true,
      toolbarHeight: 60,
      leadingWidth: 64,
      leading:
          showBack
              ? Padding(
                padding: const EdgeInsets.only(left: 16),
                child: Center(
                  child: CollectBoxButton(
                    icon: leadingIcon,
                    filled: filledButtons,
                    onTap: onBack ?? () => Navigator.of(context).maybePop(),
                  ),
                ),
              )
              : null,
      title:
          titleWidget ??
          (title != null ? Text(title!, style: DsText.section) : null),
      actions: [
        for (final a in actions)
          Padding(padding: const EdgeInsets.only(left: 8), child: a),
        const SizedBox(width: 16),
      ],
    );
  }
}

/// Pinned footer for primary actions (`foot`).
class CollectFooter extends StatelessWidget {
  final List<Widget> children;
  final Color? background;

  const CollectFooter({super.key, required this.children, this.background});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: background,
      child: SafeArea(
        top: false,
        minimum: const EdgeInsets.only(bottom: 12),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var i = 0; i < children.length; i++) ...[
                if (i > 0) const SizedBox(height: 8),
                children[i],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- buttons

enum CollectButtonStyle { primary, secondary, fill, ghost, danger }

/// Full-width 52px button covering the mockup's sec / fill / ghost / danger
/// variants (the navy primary is AppButton.filled).
class CollectButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final CollectButtonStyle style;
  final bool loading;

  const CollectButton({
    super.key,
    required this.label,
    this.onTap,
    this.icon,
    this.style = CollectButtonStyle.secondary,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (style) {
      CollectButtonStyle.primary => (AppColors.navy, Colors.white, null),
      CollectButtonStyle.secondary => (
        AppColors.surfaceWhite,
        AppColors.navy,
        Border.all(color: AppColors.line),
      ),
      CollectButtonStyle.fill => (
        SheetSurface.fillOf(context),
        AppColors.navy,
        null,
      ),
      CollectButtonStyle.ghost => (Colors.transparent, AppColors.navy, null),
      CollectButtonStyle.danger => (
        AppColors.negativeSoft,
        AppColors.negative,
        null,
      ),
    };
    final enabled = onTap != null && !loading;
    return Opacity(
      opacity: onTap == null && !loading ? 0.4 : 1,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: enabled ? onTap : null,
          child: Ink(
            height: 52,
            decoration: BoxDecoration(
              color: bg,
              border: border,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child:
                  loading
                      ? SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: fg,
                        ),
                      )
                      : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (icon != null) ...[
                            Icon(icon, size: 18, color: fg),
                            const SizedBox(width: 8),
                          ],
                          Flexible(
                            child: Text(
                              label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontFamily: 'Supreme',
                                fontWeight: FontWeight.w600,
                                fontSize: 15.5,
                                color: fg,
                              ),
                            ),
                          ),
                        ],
                      ),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- choices

/// Segmented control on a fill track (`seg`).
class CollectSegment<T> extends StatelessWidget {
  final List<(T value, String label, IconData? icon)> options;
  final T value;
  final ValueChanged<T>? onChanged;

  const CollectSegment({
    super.key,
    required this.options,
    required this.value,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: SheetSurface.fillOf(context),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          for (final o in options)
            Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: onChanged == null ? null : () => onChanged!(o.$1),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  height: 36,
                  decoration: BoxDecoration(
                    color:
                        o.$1 == value
                            ? AppColors.surfaceWhite
                            : Colors.transparent,
                    borderRadius: BorderRadius.circular(9),
                    border:
                        o.$1 == value
                            ? Border.all(color: AppColors.line)
                            : null,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (o.$3 != null) ...[
                        Icon(
                          o.$3,
                          size: 16,
                          color:
                              o.$1 == value ? AppColors.navy : AppColors.ink2,
                        ),
                        const SizedBox(width: 6),
                      ],
                      Flexible(
                        child: Text(
                          o.$2,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: 'Supreme',
                            fontSize: 13.5,
                            fontWeight:
                                o.$1 == value
                                    ? FontWeight.w600
                                    : FontWeight.w500,
                            color:
                                o.$1 == value ? AppColors.navy : AppColors.ink2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Underlined tabs (`tabs`).
class CollectTabs extends StatelessWidget {
  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;

  const CollectTabs({
    super.key,
    required this.labels,
    required this.index,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++)
            Padding(
              padding: const EdgeInsets.only(right: 20),
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => onChanged(i),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        color: i == index ? AppColors.navy : Colors.transparent,
                        width: 2,
                      ),
                    ),
                  ),
                  child: Text(
                    labels[i],
                    style: TextStyle(
                      fontFamily: 'Supreme',
                      fontSize: 14,
                      fontWeight:
                          i == index ? FontWeight.w600 : FontWeight.w500,
                      color: i == index ? AppColors.navy : AppColors.muted,
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

/// Chip (`chip`, `chip.on` navy, `chip.b` lime-soft for active filters).
class CollectChip extends StatelessWidget {
  final String label;
  final bool selected;
  final bool soft;
  final VoidCallback? onTap;
  final IconData? trailingIcon;
  final Widget? leading;

  const CollectChip({
    super.key,
    required this.label,
    this.selected = false,
    this.soft = false,
    this.onTap,
    this.trailingIcon,
    this.leading,
  });

  @override
  Widget build(BuildContext context) {
    final bg =
        selected
            ? AppColors.navy
            : soft
            ? AppColors.limeSoft
            : AppColors.surfaceWhite;
    final fg = selected ? Colors.white : AppColors.navy;
    final border =
        selected
            ? null
            : Border.all(
              color: soft ? const Color(0xFFDCEFB0) : AppColors.line,
            );
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: bg,
          border: border,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (leading != null) ...[leading!, const SizedBox(width: 6)],
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Supreme',
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
                color: fg,
              ),
            ),
            if (trailingIcon != null) ...[
              const SizedBox(width: 6),
              Icon(trailingIcon, size: 15, color: fg),
            ],
          ],
        ),
      ),
    );
  }
}

/// Bordered option tile (`opt`, `opt.on` has a 2px navy outline).
class CollectOption extends StatelessWidget {
  final Widget child;
  final bool selected;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;

  const CollectOption({
    super.key,
    required this.child,
    this.selected = false,
    this.onTap,
    this.padding = const EdgeInsets.all(14),
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        padding: padding,
        decoration: BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? AppColors.navy : AppColors.line,
            width: selected ? 2 : 1,
          ),
        ),
        child: child,
      ),
    );
  }
}

/// Square check mark (`cb`).
class CollectCheck extends StatelessWidget {
  final bool checked;
  const CollectCheck(this.checked, {super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 120),
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: checked ? AppColors.navy : Colors.transparent,
        borderRadius: BorderRadius.circular(7),
        border:
            checked
                ? null
                : Border.all(color: const Color(0xFFD0D4DB), width: 2),
      ),
      child:
          checked
              ? const Icon(Icons.check_rounded, size: 15, color: AppColors.lime)
              : null,
    );
  }
}

/// Round radio mark (`rd`).
class CollectRadio extends StatelessWidget {
  final bool selected;
  const CollectRadio(this.selected, {super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 120),
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

// ---------------------------------------------------------------- sheets

/// White bottom-sheet body with the grab handle and an optional header row
/// (title + trailing action).
class CollectSheet extends StatelessWidget {
  final String? title;
  final Widget? trailing;
  final List<Widget> children;
  final bool scrollable;
  final double? height;

  const CollectSheet({
    super.key,
    this.title,
    this.trailing,
    required this.children,
    this.scrollable = false,
    this.height,
  });

  static Widget grab() => Center(
    child: Container(
      width: 36,
      height: 5,
      margin: const EdgeInsets.only(top: 8, bottom: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFDADDE3),
        borderRadius: BorderRadius.circular(5),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final body = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) body.add(const SizedBox(height: 14));
      body.add(children[i]);
    }
    final content =
        scrollable
            ? Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: body,
                ),
              ),
            )
            : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: body,
            );
    final sheet = Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        MediaQuery.of(context).padding.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          grab(),
          if (title != null || trailing != null) ...[
            Row(
              children: [
                Expanded(
                  child: Text(
                    title ?? '',
                    style: DsText.title.copyWith(fontSize: 22),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: 14),
          ],
          content,
        ],
      ),
    );
    return SheetSurface(child: sheet);
  }
}

/// Small overline used above groups in sheets and pages ("PERIOD", "TODAY").
class CollectCap extends StatelessWidget {
  final String text;
  final String? trailing;
  final Color? trailingColor;
  const CollectCap(this.text, {super.key, this.trailing, this.trailingColor});

  @override
  Widget build(BuildContext context) {
    const style = TextStyle(
      fontFamily: 'Supreme',
      fontSize: 12,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.2,
      color: AppColors.muted,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          Expanded(child: Text(text.toUpperCase(), style: style)),
          if (trailing != null)
            Text(
              trailing!,
              style: style.copyWith(
                color: trailingColor ?? AppColors.muted,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------- people & payments

const _avatarColors = [
  Color(0xFFFFE8CC),
  Color(0xFFDCE8FF),
  Color(0xFFD8F3E4),
  Color(0xFFFFDDE0),
  Color(0xFFE7E3FF),
];

/// Pastel initials avatar (falls back to the photo when there is one).
class CollectAvatar extends StatelessWidget {
  final String name;
  final String? photoUrl;
  final double size;

  const CollectAvatar({
    super.key,
    required this.name,
    this.photoUrl,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final color =
        _avatarColors[name.isEmpty
            ? 0
            : name.codeUnits.fold<int>(0, (a, b) => a + b) %
                _avatarColors.length];
    return ContributorAvatar(
      contributorName: name.isEmpty ? '?' : name,
      avatarUrl: (photoUrl != null && photoUrl!.isNotEmpty) ? photoUrl : null,
      radius: size / 2,
      showStatusOverlay: false,
      backgroundColor: color,
    );
  }
}

/// Leading tile for a payment row: network logo for MoMo, otherwise an icon
/// tile for cash, card, bank, transfers and refunds.
class PaymentMethodTile extends StatelessWidget {
  final String? paymentMethod;

  /// The transaction's mobileMoneyProvider. The logo comes from this, not the
  /// payer's number, because numbers can be ported between networks.
  final String? provider;
  final bool isPayout;
  final bool isRefund;
  final double size;

  const PaymentMethodTile({
    super.key,
    this.paymentMethod,
    this.provider,
    this.isPayout = false,
    this.isRefund = false,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    if (isRefund) {
      return DsIconTile(Icons.undo_rounded, tone: DsTone.info, size: size);
    }
    if (isPayout) {
      return DsIconTile(Icons.north_east_rounded, size: size);
    }
    switch (paymentMethod) {
      case 'mobile-money':
        final net = DsNetworkLogo.fromProvider(provider);
        if (net != null) return DsNetworkLogo(net, size: size);
        return DsIconTile(Icons.phone_android_rounded, size: size);
      case 'cash':
        return DsIconTile(
          Icons.payments_outlined,
          tone: DsTone.positive,
          size: size,
        );
      case 'card':
      case 'apple-pay':
        return DsIconTile(
          Icons.credit_card_rounded,
          tone: DsTone.info,
          size: size,
        );
      case 'bank':
        return DsIconTile(Icons.account_balance_outlined, size: size);
      default:
        return DsIconTile(Icons.receipt_long_outlined, size: size);
    }
  }
}

/// Status tag for a payment status string.
DsTag paymentStatusTag(String? status, String label) {
  final tone = switch (status?.toLowerCase()) {
    'completed' || 'approved' || 'transferred' => DsTone.positive,
    'failed' || 'rejected' => DsTone.negative,
    'pending' || 'in-progress' || 'awaiting-approval' => DsTone.pending,
    _ => DsTone.neutral,
  };
  return DsTag(label, tone: tone);
}

/// Text field row in the redesign style (`fl`): small label above the value.
class CollectField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType keyboardType;
  final TextCapitalization textCapitalization;
  final Widget? trailing;
  final int maxLines;
  final bool grouped;

  const CollectField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType = TextInputType.text,
    this.textCapitalization = TextCapitalization.none,
    this.trailing,
    this.maxLines = 1,
    this.grouped = false,
  });

  @override
  Widget build(BuildContext context) {
    final field = Padding(
      padding: const EdgeInsets.fromLTRB(14, 9, 14, 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label, style: DsText.caption),
                TextField(
                  controller: controller,
                  keyboardType: keyboardType,
                  textCapitalization: textCapitalization,
                  maxLines: maxLines,
                  cursorColor: AppColors.navy,
                  style: DsText.rowTitle.copyWith(fontSize: 15.5),
                  decoration: InputDecoration(
                    isDense: true,
                    filled: false,
                    contentPadding: const EdgeInsets.only(top: 4),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    hintText: hint,
                    hintStyle: DsText.body.copyWith(
                      color: AppColors.faint,
                      fontSize: 15.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (trailing != null) ...[const SizedBox(width: 8), trailing!],
        ],
      ),
    );
    if (grouped) return field;
    return Container(
      constraints: const BoxConstraints(minHeight: 58),
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.line),
      ),
      child: field,
    );
  }
}

/// Group of fields sharing one bordered card (`group`).
class CollectFieldGroup extends StatelessWidget {
  final List<Widget> children;
  const CollectFieldGroup({super.key, required this.children});

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
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(mainAxisSize: MainAxisSize.min, children: rows),
    );
  }
}

/// 44px search box (`search`): white on cream, navy outline while focused.
class CollectSearchField extends StatefulWidget {
  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onChanged;
  final bool autofocus;

  const CollectSearchField({
    super.key,
    required this.controller,
    required this.hint,
    this.onChanged,
    this.autofocus = false,
  });

  @override
  State<CollectSearchField> createState() => _CollectSearchFieldState();
}

class _CollectSearchFieldState extends State<CollectSearchField> {
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
    return AnimatedContainer(
      duration: const Duration(milliseconds: 140),
      height: 44,
      padding: const EdgeInsets.only(left: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _focus.hasFocus ? AppColors.navy : Colors.transparent,
          width: 2,
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.search_rounded, size: 20, color: AppColors.muted),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: _focus,
              autofocus: widget.autofocus,
              cursorColor: AppColors.navy,
              style: DsText.body.copyWith(color: AppColors.navy, height: 1.2),
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                isDense: true,
                filled: false,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.zero,
                hintText: widget.hint,
                hintStyle: DsText.body.copyWith(
                  color: AppColors.muted,
                  height: 1.2,
                ),
              ),
              onChanged: (v) {
                setState(() {});
                widget.onChanged?.call(v);
              },
            ),
          ),
          if (widget.controller.text.isNotEmpty)
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                widget.controller.clear();
                setState(() {});
                widget.onChanged?.call('');
              },
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Icon(
                  Icons.cancel_rounded,
                  size: 18,
                  color: AppColors.faint,
                ),
              ),
            )
          else
            const SizedBox(width: 12),
        ],
      ),
    );
  }
}
