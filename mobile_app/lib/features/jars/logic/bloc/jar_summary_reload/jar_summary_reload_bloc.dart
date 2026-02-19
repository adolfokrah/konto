import 'package:bloc/bloc.dart';
import 'package:Hoga/core/services/jar_storage_service.dart';
import 'package:Hoga/core/services/translation_service.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:Hoga/features/jars/data/repositories/jar_repository.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:meta/meta.dart';

part 'jar_summary_reload_event.dart';
part 'jar_summary_reload_state.dart';

class JarSummaryReloadBloc
    extends Bloc<JarSummaryReloadEvent, JarSummaryReloadState> {
  final JarSummaryBloc jarSummaryBloc;
  final JarRepository _jarRepository;
  final JarStorageService _jarStorageService;
  final TranslationService _translationService;

  JarSummaryReloadBloc({
    required this.jarSummaryBloc,
    required JarRepository jarRepository,
    required JarStorageService jarStorageService,
    required TranslationService translationService,
  }) : _jarRepository = jarRepository,
       _jarStorageService = jarStorageService,
       _translationService = translationService,
       super(JarSummaryReloadInitial()) {
    on<ReloadJarSummaryRequested>(_reloadJarSummaryRequested);
  }

  Future<void> _reloadJarSummaryRequested(
    ReloadJarSummaryRequested event,
    Emitter<JarSummaryReloadState> emit,
  ) async {
    emit(JarSummaryReloading());

    try {
      // Get jarId from storage
      final jarId = await _jarStorageService.getCurrentJarId();

      final result = await _jarRepository.getJarSummary(jarId: jarId ?? 'null');

      if (result['success'] == true) {
        if (result['data'] == null) {
          return;
        }

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
                _translationService.failedToReloadJarSummary,
          ),
        );
      }
    } catch (e) {
      emit(
        JarSummaryReloadError(
          message: _translationService.unexpectedErrorOccurredWithDetails(
            e.toString(),
          ),
        ),
      );
    }
  }
}
