import 'package:bloc/bloc.dart';
import 'package:Hoga/features/jars/data/repositories/jar_repository.dart';
import 'package:Hoga/core/services/jar_storage_service.dart';
import 'package:Hoga/core/services/translation_service.dart';
import 'package:Hoga/features/jars/data/models/jar_summary_model.dart';
import 'package:meta/meta.dart';

part 'jar_summary_event.dart';
part 'jar_summary_state.dart';

class JarSummaryBloc extends Bloc<JarEvent, JarSummaryState> {
  final JarRepository _jarRepository;
  final JarStorageService _jarStorageService;
  final TranslationService _translationService;

  JarSummaryBloc({
    required JarRepository jarRepository,
    required JarStorageService jarStorageService,
    required TranslationService translationService,
  }) : _jarRepository = jarRepository,
       _jarStorageService = jarStorageService,
       _translationService = translationService,
       super(JarSummaryInitial()) {
    on<GetJarSummaryRequested>(_getJarSummaryRequested);
    on<UpdateJarSummaryRequested>(_updateJarSummaryRequested);
    on<SetCurrentJarRequested>(_setCurrentJarRequested);
    on<ClearCurrentJarRequested>(_clearCurrentJarRequested);
  }

  Future<void> _getJarSummaryRequested(
    GetJarSummaryRequested event,
    Emitter<JarSummaryState> emit,
  ) async {
    //only show loading if currnent jar is not the same as requested jar

    try {
      // Get jarId from storage
      final jarId = await _jarStorageService.getCurrentJarId();

      final currentState = state;
      if (currentState is JarSummaryLoaded) {
        if (currentState.jarData.id != jarId) {
          emit(JarSummaryLoading());
        }
      } else {
        emit(JarSummaryLoading());
      }

      final result = await _jarRepository.getJarSummary(jarId: jarId ?? 'null');

      if (result['success'] == true) {
        if (result['data'] == null) {
          emit(JarSummaryInitial());
          return;
        }
        final JarSummaryModel jarData = JarSummaryModel.fromJson(
          result['data'],
        );
        emit(JarSummaryLoaded(jarData: jarData));
      } else if (result['statusCode'] == 404) {
        emit(JarSummaryInitial());
      } else {
        emit(
          JarSummaryError(
            message:
                result['message'] ?? _translationService.failedToLoadJarSummary,
            statusCode: result['statusCode'],
          ),
        );
      }
    } catch (e) {
      emit(
        JarSummaryError(
          message: _translationService.unexpectedErrorOccurredWithDetails(
            e.toString(),
          ),
        ),
      );
    }
  }

  Future<void> _setCurrentJarRequested(
    SetCurrentJarRequested event,
    Emitter<JarSummaryState> emit,
  ) async {
    try {
      _jarStorageService.saveCurrentJarId(event.jarId);
      add(GetJarSummaryRequested());
    } catch (e) {
      emit(
        JarSummaryError(
          message: _translationService.unexpectedErrorSettingCurrentJar,
        ),
      );
    }
  }

  Future<void> _clearCurrentJarRequested(
    ClearCurrentJarRequested event,
    Emitter<JarSummaryState> emit,
  ) async {
    try {
      emit(JarSummaryLoading());
      _jarStorageService.clearCurrentJarId();
      add(GetJarSummaryRequested());
    } catch (e) {
      emit(
        JarSummaryError(
          message: _translationService.unexpectedErrorSettingCurrentJar,
        ),
      );
    }
  }

  Future<void> _updateJarSummaryRequested(
    UpdateJarSummaryRequested event,
    Emitter<JarSummaryState> emit,
  ) async {
    emit(JarSummaryLoaded(jarData: event.jarData));
  }
}
