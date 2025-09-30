import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:Hoga/core/services/service_registry.dart';

part 'export_contributions_event.dart';
part 'export_contributions_state.dart';

class ExportContributionsBloc
    extends Bloc<ExportContributionsEvent, ExportContributionsState> {
  final ServiceRegistry _serviceRegistry = ServiceRegistry();

  ExportContributionsBloc() : super(ExportContributionsInitial()) {
    on<TriggerExportContributions>(_onTriggerExport);
  }

  Future<void> _onTriggerExport(
    TriggerExportContributions event,
    Emitter<ExportContributionsState> emit,
  ) async {
    emit(ExportContributionsInProgress());
    final result = await _serviceRegistry.contributionRepository
        .exportContributionsToEmail(
          jarId: event.jarId,
          paymentMethods: event.paymentMethods,
          statuses: event.statuses,
          collectors: event.collectors,
          startDate: event.startDate,
          endDate: event.endDate,
          contributor: event.contributor,
          email: event.email,
        );

    if (result['success'] == true) {
      emit(
        ExportContributionsSuccess(
          message: result['message'] ?? 'Export started',
        ),
      );
    } else {
      emit(
        ExportContributionsFailure(
          message: result['message'] ?? 'Export failed',
        ),
      );
    }
  }
}
