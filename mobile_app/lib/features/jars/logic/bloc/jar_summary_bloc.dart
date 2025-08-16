import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/jar/data/models/jar_summary_model.dart';
import 'package:meta/meta.dart';

part 'jar_summary_event.dart';
part 'jar_summary_state.dart';

class JarSummaryBloc extends Bloc<JarEvent, JarSummaryState> {
  JarSummaryBloc() : super(JarSummaryInitial()) {
    on<GetJarSummaryRequested>(_getJarSummaryRequested);
    on<SetCurrentJarRequested>(_setCurrentJarRequested);
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

      // Get jarId from storage
      final jarId = await jarStorageService.getCurrentJarId();

      final result = await jarRepository.getJarSummary(jarId: jarId ?? 'null');

      if (result['success'] == true) {
        final JarSummaryModel jarData = result['data'];
        emit(JarSummaryLoaded(jarData: jarData));
      } else {
        emit(
          JarSummaryError(
            message: result['message'] ?? 'Failed to load jar summary',
            statusCode: result['statusCode'],
          ),
        );
      }
    } catch (e) {
      print(e.toString());
      emit(
        JarSummaryError(
          message: 'An unexpected error occurred: ${e.toString()}',
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
      final jarStorageService = serviceRegistry.jarStorageService;

      // Save the jar ID to storage
      final success = await jarStorageService.saveCurrentJarId(event.jarId);

      if (success) {
        // Automatically fetch the jar summary after setting the current jar
        add(GetJarSummaryRequested());
      } else {
        emit(
          JarSummaryError(
            message: 'Failed to set current jar. Please try again.',
          ),
        );
      }
    } catch (e) {
      emit(
        JarSummaryError(
          message:
              'An unexpected error occurred while setting current jar: ${e.toString()}',
        ),
      );
    }
  }
}
