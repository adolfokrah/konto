import 'dart:convert';
import 'dart:io';
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';

part 'export_contributions_event.dart';
part 'export_contributions_state.dart';

class ExportContributionsBloc
    extends Bloc<ExportContributionsEvent, ExportContributionsState> {
  final ContributionRepository _contributionRepository;

  ExportContributionsBloc({
    required ContributionRepository contributionRepository,
  }) : _contributionRepository = contributionRepository,
       super(ExportContributionsInitial()) {
    on<TriggerExportContributions>(_onTriggerExport);
  }

  Future<void> _onTriggerExport(
    TriggerExportContributions event,
    Emitter<ExportContributionsState> emit,
  ) async {
    emit(ExportContributionsInProgress());
    final result = await _contributionRepository.exportContributionsMobile(
      jarId: event.jarId,
      paymentMethods: event.paymentMethods,
      statuses: event.statuses,
      collectors: event.collectors,
      transactionTypes: event.transactionTypes,
      startDate: event.startDate,
      endDate: event.endDate,
      contributor: event.contributor,
    );

    if (result['success'] == true) {
      try {
        final data = result['data'] as Map<String, dynamic>;
        final base64Str = data['base64'] as String;
        final fileName = data['fileName'] as String? ?? 'contributions.pdf';
        final bytes = base64Decode(base64Str);
        final dir = await getTemporaryDirectory();
        final file = File('${dir.path}/$fileName');
        await file.writeAsBytes(bytes);
        await Share.shareXFiles(
          [XFile(file.path, mimeType: 'application/pdf')],
          subject: fileName,
        );
        emit(ExportContributionsSuccess(message: 'PDF ready to share'));
      } catch (e) {
        emit(ExportContributionsFailure(message: 'Failed to share PDF: $e'));
      }
    } else {
      emit(
        ExportContributionsFailure(
          message: result['message'] ?? 'Export failed',
        ),
      );
    }
  }
}
