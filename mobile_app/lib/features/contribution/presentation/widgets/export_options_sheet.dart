import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:share_plus/share_plus.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:Hoga/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/export_contributions_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class ExportOptionsSheet extends StatelessWidget {
  const ExportOptionsSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
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
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const DragHandle(),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.spacingM,
              vertical: AppSpacing.spacingS,
            ),
            child: Column(
              children: [
                _buildOption(
                  context,
                  icon: Icons.picture_as_pdf,
                  iconColor: Colors.redAccent,
                  label: localizations.exportToPdf,
                  isDark: isDark,
                  onTap: () {
                    Navigator.pop(context);
                    _triggerPdfExport(context);
                  },
                ),
                const SizedBox(height: AppSpacing.spacingS),
                _buildOption(
                  context,
                  icon: Icons.share,
                  iconColor: Colors.green,
                  label: localizations.shareAsList,
                  isDark: isDark,
                  onTap: () => _shareAsList(context),
                ),
              ],
            ),
          ),
          SizedBox(
            height: MediaQuery.of(context).padding.bottom + AppSpacing.spacingM,
          ),
        ],
      ),
    );
  }

  Widget _buildOption(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String label,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return Material(
      color:
          isDark
              ? Theme.of(context).colorScheme.primary
              : AppColors.onPrimaryWhite,
      borderRadius: BorderRadius.circular(AppRadius.radiusM),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.radiusM),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.spacingM,
            vertical: AppSpacing.spacingM,
          ),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              const SizedBox(width: AppSpacing.spacingM),
              Text(label, style: TextStyles.titleMedium),
            ],
          ),
        ),
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
