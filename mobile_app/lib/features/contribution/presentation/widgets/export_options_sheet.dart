import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:share_plus/share_plus.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:Hoga/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/export_contributions_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/contribution/presentation/widgets/contribtions_list_filter.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class ExportOptionsSheet extends StatefulWidget {
  const ExportOptionsSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (_) => MultiBlocProvider(
            providers: [
              BlocProvider.value(
                value: context.read<ExportContributionsBloc>(),
              ),
              BlocProvider.value(value: context.read<ContributionsListBloc>()),
              BlocProvider.value(value: context.read<JarSummaryBloc>()),
              BlocProvider.value(
                value: context.read<FilterContributionsBloc>(),
              ),
            ],
            child: const ExportOptionsSheet(),
          ),
    );
  }

  @override
  State<ExportOptionsSheet> createState() => _ExportOptionsSheetState();
}

class _ExportOptionsSheetState extends State<ExportOptionsSheet> {
  /// 0 = PDF statement by email, 1 = share as a list
  int _choice = 0;

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    // What will be exported: the jar and the active date filter.
    final jarState = context.read<JarSummaryBloc>().state;
    final filterState = context.read<FilterContributionsBloc>().state;
    final listState = context.read<ContributionsListBloc>().state;
    final jarName = jarState is JarSummaryLoaded ? jarState.jarData.name : '';
    final dateLabel =
        filterState is FilterContributionsLoaded &&
                filterState.selectedDate != null
            ? FilterLabels.date(localizations, filterState.selectedDate!)
            : localizations.dateAll;
    final count =
        listState is ContributionsListLoaded ? listState.totalDocs : 0;

    return CollectSheet(
      title: 'Export statement',
      trailing: CollectBoxButton(
        icon: Icons.close_rounded,
        filled: true,
        onTap: () => Navigator.pop(context),
      ),
      children: [
        DsCard(
          color: AppColors.fill,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              const Icon(
                Icons.calendar_today_rounded,
                size: 18,
                color: AppColors.navy,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  jarName.isEmpty ? dateLabel : '$dateLabel · $jarName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.small.copyWith(color: AppColors.navy),
                ),
              ),
            ],
          ),
        ),
        _option(
          index: 0,
          icon: Icons.picture_as_pdf_outlined,
          tone: DsTone.negative,
          title: localizations.exportToPdf,
          subtitle: 'PDF with totals, payments and answers',
        ),
        _option(
          index: 1,
          icon: Icons.format_list_bulleted_rounded,
          tone: DsTone.positive,
          title: localizations.shareAsList,
          subtitle: 'Names and amounts only',
        ),
        AppButton.filled(
          text: count > 0 ? 'Export $count payments' : 'Export',
          onPressed: () {
            if (_choice == 0) {
              Navigator.pop(context);
              _triggerPdfExport(context);
            } else {
              _shareAsList(context);
            }
          },
        ),
      ],
    );
  }

  Widget _option({
    required int index,
    required IconData icon,
    required DsTone tone,
    required String title,
    required String subtitle,
  }) {
    return CollectOption(
      selected: _choice == index,
      onTap: () => setState(() => _choice = index),
      child: Row(
        children: [
          DsIconTile(icon, tone: tone),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: DsText.section.copyWith(fontSize: 14)),
                const SizedBox(height: 2),
                Text(subtitle, style: DsText.caption),
              ],
            ),
          ),
          const SizedBox(width: 8),
          CollectRadio(_choice == index),
        ],
      ),
    );
  }

  void _triggerPdfExport(BuildContext context) {
    final jarState = context.read<JarSummaryBloc>().state;
    if (jarState is! JarSummaryLoaded) return;

    final listState = context.read<ContributionsListBloc>().state;
    if (listState is! ContributionsListLoaded) return;

    final filtersState = context.read<FilterContributionsBloc>().state;
    List<String>? paymentMethods;
    List<String>? statuses;
    List<String>? collectors;
    List<String>? transactionTypes;
    DateTime? startDate;
    DateTime? endDate;
    if (filtersState is FilterContributionsLoaded) {
      paymentMethods = filtersState.selectedPaymentMethods;
      statuses = filtersState.selectedStatuses;
      collectors = filtersState.selectedCollectors;
      transactionTypes = filtersState.selectedTransactionTypes;
      startDate = filtersState.startDate;
      endDate = filtersState.endDate;
    }

    context.read<ExportContributionsBloc>().add(
      TriggerExportContributions(
        jarId: jarState.jarData.id,
        paymentMethods: paymentMethods,
        statuses: statuses,
        collectors: collectors,
        transactionTypes: transactionTypes,
        startDate: startDate,
        endDate: endDate,
        contributor: listState.contributorSearch,
      ),
    );
  }

  Future<void> _shareAsList(BuildContext context) async {
    final jarState = context.read<JarSummaryBloc>().state;
    if (jarState is! JarSummaryLoaded) return;

    final listState = context.read<ContributionsListBloc>().state;
    if (listState is! ContributionsListLoaded) return;

    final filtersState = context.read<FilterContributionsBloc>().state;
    List<String>? paymentMethods;
    List<String>? statuses;
    List<String>? collectors;
    List<String>? transactionTypes;
    DateTime? startDate;
    DateTime? endDate;
    if (filtersState is FilterContributionsLoaded) {
      paymentMethods = filtersState.selectedPaymentMethods;
      statuses = filtersState.selectedStatuses;
      collectors = filtersState.selectedCollectors;
      transactionTypes = filtersState.selectedTransactionTypes;
      startDate = filtersState.startDate;
      endDate = filtersState.endDate;
    }

    // Capture screen size for share position before popping
    final screenSize = MediaQuery.of(context).size;
    final shareOrigin = Rect.fromCenter(
      center: Offset(screenSize.width / 2, screenSize.height / 2),
      width: 1,
      height: 1,
    );

    // Close the bottom sheet before fetching
    if (context.mounted) Navigator.pop(context);

    final repo = GetIt.I<ContributionRepository>();
    final response = await repo.shareContributions(
      jarId: jarState.jarData.id,
      paymentMethods: paymentMethods,
      statuses: statuses,
      collectors: collectors,
      transactionTypes: transactionTypes,
      startDate: startDate,
      endDate: endDate,
      contributor: listState.contributorSearch,
    );

    if (response['success'] != true || response['data']?['text'] == null) {
      if (context.mounted) {
        AppSnackBar.showError(
          context,
          message: response['message'] ?? 'Failed to generate share text',
        );
      }
      return;
    }

    final text = response['data']['text'] as String;
    Share.share(text, sharePositionOrigin: shareOrigin);
  }
}
