import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/jars/data/models/jar_summary_model.dart';
import 'package:meta/meta.dart';

part 'jar_summary_event.dart';
part 'jar_summary_state.dart';

class JarSummaryBloc extends Bloc<JarEvent, JarSummaryState> {
  JarSummaryBloc() : super(JarSummaryInitial()) {
    on<GetJarSummaryRequested>(_getJarSummaryRequested);
    on<UpdateJarSummaryRequested>(_updateJarSummaryRequested);
    on<SetCurrentJarRequested>(_setCurrentJarRequested);
    on<ClearCurrentJarRequested>(_clearCurrentJarRequested);
  }

  Future<void> _getJarSummaryRequested(
    GetJarSummaryRequested event,
    Emitter<JarSummaryState> emit,
  ) async {
    emit(JarSummaryLoading());
    try {
      final serviceRegistry = ServiceRegistry();
      final jarStorageService = serviceRegistry.jarStorageService;
      final jarRepository = serviceRegistry.jarRepository;
      final translationService = serviceRegistry.translationService;

      // Get jarId from storage
      final jarId = await jarStorageService.getCurrentJarId();

      final result = await jarRepository.getJarSummary(jarId: jarId ?? 'null');

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
                result['message'] ?? translationService.failedToLoadJarSummary,
            statusCode: result['statusCode'],
          ),
        );
      }
    } catch (e) {
      final serviceRegistry = ServiceRegistry();
      final translationService = serviceRegistry.translationService;
      emit(
        JarSummaryError(
          message: translationService.unexpectedErrorOccurredWithDetails(
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
      final serviceRegistry = ServiceRegistry();
      serviceRegistry.jarStorageService.saveCurrentJarId(event.jarId);
      add(GetJarSummaryRequested());
    } catch (e) {
      final serviceRegistry = ServiceRegistry();
      final translationService = serviceRegistry.translationService;
      emit(
        JarSummaryError(
          message: translationService.unexpectedErrorSettingCurrentJar,
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
      final serviceRegistry = ServiceRegistry();
      serviceRegistry.jarStorageService.clearCurrentJarId();
      add(GetJarSummaryRequested());
    } catch (e) {
      final serviceRegistry = ServiceRegistry();
      final translationService = serviceRegistry.translationService;
      emit(
        JarSummaryError(
          message: translationService.unexpectedErrorSettingCurrentJar,
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
