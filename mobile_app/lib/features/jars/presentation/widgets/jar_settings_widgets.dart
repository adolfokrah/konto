/// Pieces used only by the jar settings screens (goal, fixed amount, custom
/// questions): the big typed amount, its keypad logic, the segmented control
/// and the goal-deadline calendar sheet.
library;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/sheet_surface.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';

// ---------------------------------------------------------------- amount

/// Keypad input helpers shared by the goal and fixed-amount screens.
class JarAmountInput {
  /// Turns a stored amount into what the keypad shows ("20000", "12.5").
  static String fromAmount(double v) {
    if (v <= 0) return '';
    return v == v.truncateToDouble()
        ? v.toStringAsFixed(0)
        : v.toStringAsFixed(2).replaceAll(RegExp(r'0$'), '');
  }

  static double toAmount(String input) => double.tryParse(input) ?? 0;

  /// Applies one keypad key ('0'-'9', '.') to [input].
  static String digit(String input, String key) {
    if (key == '.') {
      if (input.contains('.')) return input;
      return input.isEmpty ? '0.' : '$input.';
    }
    final dot = input.indexOf('.');
    if (dot >= 0 && input.length - dot > 2) return input; // two decimals max
    if (dot < 0 && input.length >= 9) return input;
    if (input == '0') return key;
    return '$input$key';
  }

  static String backspace(String input) =>
      input.isEmpty ? input : input.substring(0, input.length - 1);
}

/// Big centred amount (mockup `.num` with `.cur`): "GHS 20,000".
class JarAmountDisplay extends StatelessWidget {
  final String input;
  final String currency;
  final double size;

  const JarAmountDisplay({
    super.key,
    required this.input,
    required this.currency,
    this.size = 54,
  });

  @override
  Widget build(BuildContext context) {
    final text = input.isEmpty ? '0' : input;
    final dot = text.indexOf('.');
    final whole = dot < 0 ? text : text.substring(0, dot);
    final grouped = DsMoney.group(double.tryParse(whole) ?? 0);
    final main = TextStyle(
      fontFamily: 'Chillax',
      fontWeight: FontWeight.w600,
      fontSize: size,
      letterSpacing: -0.3,
      height: 1.1,
      color: input.isEmpty ? AppColors.faint : AppColors.navy,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
    return FittedBox(
      fit: BoxFit.scaleDown,
      child: Text.rich(
        TextSpan(
          children: [
            WidgetSpan(
              alignment: PlaceholderAlignment.top,
              child: Padding(
                padding: EdgeInsets.only(right: 5, top: size * 0.16),
                child: Text(
                  currency,
                  style: TextStyle(
                    fontFamily: 'Supreme',
                    fontWeight: FontWeight.w500,
                    fontSize: size * 0.5,
                    color: AppColors.muted,
                  ),
                ),
              ),
            ),
            TextSpan(text: grouped, style: main),
            if (dot >= 0) TextSpan(text: text.substring(dot), style: main),
          ],
        ),
        maxLines: 1,
      ),
    );
  }
}

// ---------------------------------------------------------------- segmented

/// Segmented control (mockup `.seg`): fill track, white selected segment.
class JarSegmented<T> extends StatelessWidget {
  final List<(T value, String label)> options;
  final T value;
  final ValueChanged<T>? onChanged;

  const JarSegmented({
    super.key,
    required this.options,
    required this.value,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: onChanged == null ? 0.6 : 1,
      child: Container(
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
                    duration: const Duration(milliseconds: 140),
                    height: 36,
                    alignment: Alignment.center,
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
                    child: Text(
                      o.$2,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Supreme',
                        fontSize: 13.5,
                        fontWeight:
                            o.$1 == value ? FontWeight.w600 : FontWeight.w500,
                        color: o.$1 == value ? AppColors.navy : AppColors.ink2,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- deadline

/// What the deadline sheet returns: a date, or `date == null` for
/// "No deadline". A null result means the sheet was dismissed.
class JarDeadlineChoice {
  final DateTime? date;
  const JarDeadlineChoice(this.date);
}

/// "Goal deadline" calendar sheet: month grid, No deadline / Set {date}.
class JarDeadlineSheet extends StatefulWidget {
  final DateTime? initial;
  final DateTime minimum;
  final DateTime maximum;

  const JarDeadlineSheet({
    super.key,
    this.initial,
    required this.minimum,
    required this.maximum,
  });

  static Future<JarDeadlineChoice?> show(
    BuildContext context, {
    DateTime? initial,
    required DateTime minimum,
    required DateTime maximum,
  }) {
    return showModalBottomSheet<JarDeadlineChoice>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (_) => JarDeadlineSheet(
            initial: initial,
            minimum: minimum,
            maximum: maximum,
          ),
    );
  }

  @override
  State<JarDeadlineSheet> createState() => _JarDeadlineSheetState();
}

class _JarDeadlineSheetState extends State<JarDeadlineSheet> {
  late DateTime _month;
  DateTime? _selected;

  static DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

  @override
  void initState() {
    super.initState();
    _selected = widget.initial == null ? null : _day(widget.initial!);
    final base = _selected ?? _day(widget.minimum);
    _month = DateTime(base.year, base.month);
  }

  bool get _canPrev =>
      _month.isAfter(DateTime(widget.minimum.year, widget.minimum.month));
  bool get _canNext =>
      _month.isBefore(DateTime(widget.maximum.year, widget.maximum.month));

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context).toString();
    final first = DateTime(_month.year, _month.month, 1);
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final lead = first.weekday - 1; // Monday first
    final min = _day(widget.minimum);
    final max = _day(widget.maximum);

    Widget navBtn(IconData icon, bool enabled, int delta) => SizedBox(
      width: 32,
      height: 32,
      child: Opacity(
        opacity: enabled ? 1 : 0.35,
        child: Material(
          color: AppColors.cream,
          borderRadius: BorderRadius.circular(10),
          child: InkWell(
            borderRadius: BorderRadius.circular(10),
            onTap:
                enabled
                    ? () => setState(
                      () =>
                          _month = DateTime(_month.year, _month.month + delta),
                    )
                    : null,
            child: Icon(icon, size: 18, color: AppColors.navy),
          ),
        ),
      ),
    );

    final cells = <Widget>[
      for (final d in const ['M', 'T', 'W', 'T', 'F', 'S', 'S'])
        Center(child: Text(d, style: DsText.caption)),
      for (var i = 0; i < lead; i++) const SizedBox.shrink(),
      for (var day = 1; day <= daysInMonth; day++)
        Builder(
          builder: (_) {
            final date = DateTime(_month.year, _month.month, day);
            final enabled = !date.isBefore(min) && !date.isAfter(max);
            final on = _selected == date;
            return GestureDetector(
              onTap: enabled ? () => setState(() => _selected = date) : null,
              child: Container(
                height: 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: on ? AppColors.navy : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$day',
                  style: TextStyle(
                    fontFamily: 'Supreme',
                    fontSize: 13,
                    fontWeight: on ? FontWeight.w700 : FontWeight.w500,
                    color:
                        on
                            ? AppColors.lime
                            : enabled
                            ? AppColors.navy
                            : AppColors.muted,
                  ),
                ),
              ),
            );
          },
        ),
    ];

    return JarSheetFrame(
      title: 'Goal deadline',
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                DateFormat('MMMM y', locale).format(_month),
                style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            navBtn(Icons.chevron_left_rounded, _canPrev, -1),
            const SizedBox(width: 4),
            navBtn(Icons.chevron_right_rounded, _canNext, 1),
          ],
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
          childAspectRatio: 1.15,
          children: cells,
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: JarGhostButton(
                label: 'No deadline',
                filled: true,
                onTap:
                    () => Navigator.of(
                      context,
                    ).pop(const JarDeadlineChoice(null)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: JarPrimaryButton(
                label:
                    _selected == null
                        ? 'Set'
                        : 'Set ${DateFormat('d MMM', locale).format(_selected!)}',
                onTap:
                    _selected == null
                        ? null
                        : () => Navigator.of(
                          context,
                        ).pop(JarDeadlineChoice(_selected)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
