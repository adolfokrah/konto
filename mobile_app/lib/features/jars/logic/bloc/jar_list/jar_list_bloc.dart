import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/features/jars/data/models/jar_list_model.dart';
import 'package:meta/meta.dart';

part 'jar_list_event.dart';
part 'jar_list_state.dart';

class JarListBloc extends Bloc<JarListEvent, JarListState> {
  JarListBloc() : super(JarListInitial()) {
    on<LoadJarList>(_loadJarList);
  }

  Future<void> _loadJarList(
    LoadJarList event,
    Emitter<JarListState> emit,
  ) async {
    final serviceRegistry = ServiceRegistry();
    final jarRepository = serviceRegistry.jarRepository;
    emit(JarListLoading());

    final response = await jarRepository.getUserJars();
    print(response);
    if (response['success']) {
      final jars = JarList.fromJson(response['data']);
      emit(JarListLoaded(jars));
    } else {
      emit(JarListError(response['message']));
    }
  }
}
