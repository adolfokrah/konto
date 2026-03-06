import 'package:Hoga/core/widgets/icon_button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/export_contributions_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:Hoga/features/contribution/presentation/widgets/export_options_sheet.dart';

class ExportToPdf extends StatelessWidget {
  const ExportToPdf({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ExportContributionsBloc, ExportContributionsState>(
      listener: (context, state) {
        if (state is ExportContributionsSuccess) {
          AppSnackBar.showSuccess(context, message: state.message);
        } else if (state is ExportContributionsFailure) {
          AppSnackBar.showError(context, message: state.message);
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
              onPressed: () => ExportOptionsSheet.show(context),
              icon: isLoading ? Icons.hourglass_top : Icons.ios_share,
              size: const Size(50, 50),
            );
          },
        );
      },
    );
  }
}
