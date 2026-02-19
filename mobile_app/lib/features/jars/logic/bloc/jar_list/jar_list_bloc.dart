import 'package:bloc/bloc.dart';
import 'package:Hoga/features/jars/data/repositories/jar_repository.dart';
import 'package:Hoga/features/jars/data/models/jar_list_model.dart';
import 'package:meta/meta.dart';

part 'jar_list_event.dart';
part 'jar_list_state.dart';

class JarListBloc extends Bloc<JarListEvent, JarListState> {
  final JarRepository _jarRepository;

  JarListBloc({required JarRepository jarRepository})
    : _jarRepository = jarRepository,
      super(JarListInitial()) {
    on<LoadJarList>(_loadJarList);
  }

  Future<void> _loadJarList(
    LoadJarList event,
    Emitter<JarListState> emit,
  ) async {
    emit(JarListLoading());

    final response = await _jarRepository.getUserJars();
    print(response);
    if (response['success']) {
      final jars = JarList.fromJson(response['data']);
      emit(JarListLoaded(jars));
    } else {
      emit(JarListError(response['message']));
    }
  }
}
