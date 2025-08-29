import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:konto/core/widgets/button.dart';
import 'package:konto/core/widgets/drag_handle.dart';
import 'package:konto/core/widgets/text_input.dart';
import 'package:konto/l10n/app_localizations.dart';

/// A reusable date range picker widget that can be used across the app
class DateRangePicker {
  /// Shows a single date picker modal
  static Future<DateTime?> showSingleDatePicker({
    required BuildContext context,
    DateTime? initialDate,
    DateTime? minimumDate,
    DateTime? maximumDate,
    String? title,
  }) async {
    final localizations = AppLocalizations.of(context)!;
    final DateTime now = DateTime.now();

    final DateTime defaultInitialDate =
        initialDate ?? now.add(const Duration(days: 7));
    final DateTime defaultMinimumDate = minimumDate ?? now;
    final DateTime defaultMaximumDate =
        maximumDate ?? now.add(const Duration(days: 365 * 5));

    DateTime? selectedDate;

    await showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) {
        DateTime tempPickedDate = defaultInitialDate;
        return Container(
          height: 300,
          padding: const EdgeInsets.only(top: 6.0),
          margin: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          color: Theme.of(context).colorScheme.surface,
          child: SafeArea(
            top: false,
            child: Column(
              children: [
                // Header with Cancel and Done buttons
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      CupertinoButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text(
                          localizations.cancel,
                          style: TextStyles.titleMedium.copyWith(
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                      ),
                      CupertinoButton(
                        onPressed: () {
                          selectedDate = tempPickedDate;
                          Navigator.of(context).pop();
                        },
                        child: Text(
                          localizations.done,
                          style: TextStyles.titleMedium.copyWith(
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 0),
                // Date picker
                Expanded(
                  child: Transform.scale(
                    scale: 0.9,
                    child: CupertinoDatePicker(
                      mode: CupertinoDatePickerMode.date,
                      initialDateTime: defaultInitialDate,
                      minimumDate: defaultMinimumDate,
                      maximumDate: defaultMaximumDate,
                      onDateTimeChanged: (DateTime newDate) {
                        tempPickedDate = newDate;
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    return selectedDate;
  }

  /// Shows a date range picker modal with start and end date selection
  static Future<DateRange?> showDateRangePicker({
    required BuildContext context,
    DateTime? initialStartDate,
    DateTime? initialEndDate,
    DateTime? minimumDate,
    DateTime? maximumDate,
    String? title,
  }) async {
    final DateTime now = DateTime.now();
    DateTime startDate =
        initialStartDate ?? now.subtract(const Duration(days: 30));
    DateTime endDate = initialEndDate ?? now;
    final DateTime defaultMinimumDate = minimumDate ?? DateTime(2020);
    final DateTime defaultMaximumDate = maximumDate ?? now;

    DateRange? selectedRange;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder:
          (context) => StatefulBuilder(
            builder:
                (context, setState) => Container(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.5,
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.spacingXs,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const DragHandle(),
                      const SizedBox(height: AppSpacing.spacingM),
                      Text(
                        title ?? 'Select Date Range',
                        style: TextStyles.titleBoldLg,
                      ),
                      const SizedBox(height: AppSpacing.spacingM),

                      // From date input
                      GestureDetector(
                        onTap: () async {
                          final selectedDate = await showSingleDatePicker(
                            context: context,
                            initialDate: startDate,
                            minimumDate: defaultMinimumDate,
                            maximumDate: endDate,
                            title: 'Select From Date',
                          );
                          if (selectedDate != null) {
                            setState(() {
                              startDate = selectedDate;
                            });
                          }
                        },
                        child: AbsorbPointer(
                          child: AppTextInput(
                            label: 'From',
                            value: DateRange._formatDate(startDate),
                            enabled: false,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.spacingM),

                      // To date input
                      GestureDetector(
                        onTap: () async {
                          final selectedDate = await showSingleDatePicker(
                            context: context,
                            initialDate: endDate,
                            minimumDate: startDate,
                            maximumDate: defaultMaximumDate,
                            title: 'Select To Date',
                          );
                          if (selectedDate != null) {
                            setState(() {
                              endDate = selectedDate;
                            });
                          }
                        },
                        child: AbsorbPointer(
                          child: AppTextInput(
                            label: 'To',
                            value: DateRange._formatDate(endDate),
                            enabled: false,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.spacingM),

                      // Action buttons
                      Row(
                        children: [
                          Expanded(
                            child: AppButton.outlined(
                              text: 'Cancel',
                              onPressed: () => Navigator.pop(context),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.spacingM),
                          Expanded(
                            child: AppButton.filled(
                              text: 'Apply',
                              onPressed: () {
                                selectedRange = DateRange(
                                  startDate: startDate,
                                  endDate: endDate,
                                );
                                Navigator.pop(context);
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.spacingL),
                    ],
                  ),
                ),
          ),
    );

    return selectedRange;
  }
}

/// Data class to hold date range information
class DateRange {
  final DateTime startDate;
  final DateTime endDate;

  const DateRange({required this.startDate, required this.endDate});

  /// Format the date range as a string
  String format([String separator = ' - ']) {
    return '${_formatDate(startDate)}$separator${_formatDate(endDate)}';
  }

  /// Check if the range is valid (start date is before or equal to end date)
  bool get isValid => !startDate.isAfter(endDate);

  /// Get the duration of the date range
  Duration get duration => endDate.difference(startDate);

  /// Check if a date falls within this range
  bool contains(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final startOnly = DateTime(startDate.year, startDate.month, startDate.day);
    final endOnly = DateTime(endDate.year, endDate.month, endDate.day);

    return (dateOnly.isAfter(startOnly) ||
            dateOnly.isAtSameMomentAs(startOnly)) &&
        (dateOnly.isBefore(endOnly) || dateOnly.isAtSameMomentAs(endOnly));
  }

  /// Format a single date as DD/MM/YYYY
  static String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}
