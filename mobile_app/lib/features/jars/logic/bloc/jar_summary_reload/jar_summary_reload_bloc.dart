import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:meta/meta.dart';

part 'jar_summary_reload_event.dart';
part 'jar_summary_reload_state.dart';

class JarSummaryReloadBloc
    extends Bloc<JarSummaryReloadEvent, JarSummaryReloadState> {
  final JarSummaryBloc jarSummaryBloc;

  JarSummaryReloadBloc({required this.jarSummaryBloc})
    : super(JarSummaryReloadInitial()) {
    on<ReloadJarSummaryRequested>(_reloadJarSummaryRequested);
  }

  Future<void> _reloadJarSummaryRequested(
    ReloadJarSummaryRequested event,
    Emitter<JarSummaryReloadState> emit,
  ) async {
    emit(JarSummaryReloading());

    final serviceRegistry = ServiceRegistry();
    final jarStorageService = serviceRegistry.jarStorageService;
    final jarRepository = serviceRegistry.jarRepository;
    final translationService = serviceRegistry.translationService;

    try {
      // Get jarId from storage
      final jarId = await jarStorageService.getCurrentJarId();

      final result = await jarRepository.getJarSummary(jarId: jarId ?? 'null');

      if (result['success'] == true) {
        final JarSummaryModel jarData = JarSummaryModel.fromJson(
          result['data'],
        );

        // Directly call the update event on the main JarSummaryBloc
        jarSummaryBloc.add(UpdateJarSummaryRequested(jarData: jarData));

        emit(JarSummaryReloaded());
      } else {
        emit(
          JarSummaryReloadError(
            message:
                result['message'] ??
                translationService.failedToReloadJarSummary,
          ),
        );
      }
    } catch (e) {
      emit(
        JarSummaryReloadError(
          message: translationService.unexpectedErrorOccurredWithDetails(
            e.toString(),
          ),
        ),
      );
    }
  }
}
