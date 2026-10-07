import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/date_range_picker.dart' show DateRange;
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';

/// "Custom dates" sheet from the Activity filters: From / To fields over a
/// month calendar, the range tinted, and "Apply · N days".
class CustomDatesSheet extends StatefulWidget {
  final DateTime? initialStart;
  final DateTime? initialEnd;

  const CustomDatesSheet({super.key, this.initialStart, this.initialEnd});

  static Future<DateRange?> show(
    BuildContext context, {
    DateTime? initialStart,
    DateTime? initialEnd,
  }) {
    return showModalBottomSheet<DateRange>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (_) => CustomDatesSheet(
            initialStart: initialStart,
            initialEnd: initialEnd,
          ),
    );
  }

  @override
  State<CustomDatesSheet> createState() => _CustomDatesSheetState();
}

class _CustomDatesSheetState extends State<CustomDatesSheet> {
  static final _first = DateTime(2020);
  late final DateTime _today;
  DateTime? _start;
  DateTime? _end;
  late DateTime _month;
  bool _editingEnd = false;

  static DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

  @override
  void initState() {
    super.initState();
    _today = _day(DateTime.now());
    _start = widget.initialStart != null ? _day(widget.initialStart!) : null;
    _end = widget.initialEnd != null ? _day(widget.initialEnd!) : null;
    final anchor = _end ?? _start ?? _today;
    _month = DateTime(anchor.year, anchor.month);
    _editingEnd = _start != null && _end == null;
  }

  void _pick(DateTime d) {
    setState(() {
      if (!_editingEnd || _start == null || d.isBefore(_start!)) {
        _start = d;
        if (_end != null && _end!.isBefore(d)) _end = null;
        _editingEnd = true;
      } else {
        _end = d;
      }
    });
  }

  void _shiftMonth(int delta) {
    final next = DateTime(_month.year, _month.month + delta);
    if (next.isBefore(DateTime(_first.year, _first.month))) return;
    if (next.isAfter(DateTime(_today.year, _today.month))) return;
    setState(() => _month = next);
  }

  int get _days =>
      (_start == null || _end == null)
          ? 0
          : _end!.difference(_start!).inDays + 1;

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('d MMM y');
    return CollectSheet(
      title: 'Custom dates',
      trailing: CollectBoxButton(
        icon: Icons.close_rounded,
        filled: true,
        onTap: () => Navigator.pop(context),
      ),
      children: [
        Row(
          children: [
            Expanded(
              child: _DateField(
                label: 'From',
                value: _start != null ? fmt.format(_start!) : null,
                active: !_editingEnd,
                onTap: () => setState(() => _editingEnd = false),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _DateField(
                label: 'To',
                value: _end != null ? fmt.format(_end!) : null,
                active: _editingEnd,
                onTap:
                    _start == null
                        ? null
                        : () => setState(() => _editingEnd = true),
              ),
            ),
          ],
        ),
        _buildMonth(),
        AppButton.filled(
          text:
              _days > 0
                  ? 'Apply · $_days ${_days == 1 ? 'day' : 'days'}'
                  : 'Apply',
          onPressed:
              _days > 0
                  ? () => Navigator.pop(
                    context,
                    DateRange(startDate: _start!, endDate: _end!),
                  )
                  : null,
        ),
      ],
    );
  }

  Widget _buildMonth() {
    final firstOfMonth = DateTime(_month.year, _month.month);
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final leading = firstOfMonth.weekday - 1; // Monday first
    final canNext = DateTime(
      _month.year,
      _month.month + 1,
    ).isBefore(DateTime(_today.year, _today.month + 1));

    Widget arrow(IconData icon, VoidCallback? onTap) => GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(
          icon,
          size: 20,
          color: onTap == null ? AppColors.faint : AppColors.navy,
        ),
      ),
    );

    final cells = <Widget>[
      for (final d in const ['M', 'T', 'W', 'T', 'F', 'S', 'S'])
        Center(child: Text(d, style: DsText.caption)),
      for (var i = 0; i < leading; i++) const SizedBox.shrink(),
      for (var day = 1; day <= daysInMonth; day++)
        _dayCell(DateTime(_month.year, _month.month, day)),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                DateFormat('MMMM y').format(_month),
                style: DsText.rowTitle.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
            arrow(Icons.chevron_left_rounded, () => _shiftMonth(-1)),
            arrow(
              Icons.chevron_right_rounded,
              canNext ? () => _shiftMonth(1) : null,
            ),
          ],
        ),
        const SizedBox(height: 6),
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 4,
          childAspectRatio: 1.25,
          children: cells,
        ),
      ],
    );
  }

  Widget _dayCell(DateTime d) {
    final disabled = d.isAfter(_today) || d.isBefore(_first);
    final isStart = _start != null && d == _start;
    final isEnd = _end != null && d == _end;
    final inRange =
        _start != null &&
        _end != null &&
        d.isAfter(_start!) &&
        d.isBefore(_end!);
    final edge = isStart || isEnd;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: disabled ? null : () => _pick(d),
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color:
              edge
                  ? AppColors.navy
                  : inRange
                  ? AppColors.limeSoft
                  : null,
          borderRadius: edge ? BorderRadius.circular(10) : null,
        ),
        child: Text(
          '${d.day}',
          style: TextStyle(
            fontFamily: 'Supreme',
            fontSize: 13,
            fontWeight: edge ? FontWeight.w700 : FontWeight.w500,
            color:
                edge
                    ? AppColors.lime
                    : disabled
                    ? AppColors.faint
                    : AppColors.navy,
          ),
        ),
      ),
    );
  }
}

/// Labelled date box (`fl`); the one being edited gets the navy outline.
class _DateField extends StatelessWidget {
  final String label;
  final String? value;
  final bool active;
  final VoidCallback? onTap;

  const _DateField({
    required this.label,
    required this.value,
    required this.active,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        padding: const EdgeInsets.fromLTRB(14, 9, 14, 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: active ? AppColors.navy : AppColors.line,
            width: active ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: DsText.caption),
            const SizedBox(height: 4),
            Text(
              value ?? 'Pick a day',
              style:
                  value != null
                      ? DsText.rowTitle.copyWith(fontSize: 15.5)
                      : DsText.body.copyWith(
                        color: AppColors.faint,
                        fontSize: 15.5,
                        height: 1.2,
                      ),
            ),
          ],
        ),
      ),
    );
  }
}
