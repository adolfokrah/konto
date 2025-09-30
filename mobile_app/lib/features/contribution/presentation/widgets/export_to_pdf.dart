import 'package:Hoga/core/widgets/icon_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/export_contributions_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';

class ExportToPdf extends StatelessWidget {
  const ExportToPdf({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ExportContributionsBloc, ExportContributionsState>(
      listener: (context, state) {
        if (state is ExportContributionsSuccess) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message)));
        } else if (state is ExportContributionsFailure) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message)));
        }
      },
      builder: (context, exportState) {
        final isLoading = exportState is ExportContributionsInProgress;
        return BlocBuilder<ContributionsListBloc, ContributionsListState>(
          builder: (context, listState) {
            if (listState is! ContributionsListLoaded ||
                listState.contributions.isEmpty) {
              return const SizedBox.shrink();
            }
            return AppIconButton(
              loading: isLoading,
              enabled: !isLoading,
              onPressed: () {
                final jarState = context.read<JarSummaryBloc>().state;
                if (jarState is! JarSummaryLoaded) return;
                final filtersState =
                    context.read<FilterContributionsBloc>().state;
                List<String>? paymentMethods;
                List<String>? statuses;
                List<String>? collectors;
                DateTime? startDate;
                DateTime? endDate;
                if (filtersState is FilterContributionsLoaded) {
                  paymentMethods = filtersState.selectedPaymentMethods;
                  statuses = filtersState.selectedStatuses;
                  collectors = filtersState.selectedCollectors;
                  startDate = filtersState.startDate;
                  endDate = filtersState.endDate;
                }
                final contributorSearch = listState.contributorSearch;
                context.read<ExportContributionsBloc>().add(
                  TriggerExportContributions(
                    jarId: jarState.jarData.id,
                    paymentMethods: paymentMethods,
                    statuses: statuses,
                    collectors: collectors,
                    startDate: startDate,
                    endDate: endDate,
                    contributor: contributorSearch,
                  ),
                );
              },
              icon: isLoading ? Icons.hourglass_top : Icons.ios_share,
              size: const Size(50, 50),
            );
          },
        );
      },
    );
  }
}
