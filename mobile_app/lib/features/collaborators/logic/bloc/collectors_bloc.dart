import 'package:Hoga/features/collaborators/data/models/collector_model.dart';
import 'package:Hoga/features/collaborators/data/repositories/collaborators_repository.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'collectors_event.dart';
part 'collectors_state.dart';

class CollectorsBloc extends Bloc<CollectorsEvent, CollectorsState> {
  final CollaboratorsRepository _collaboratorsRepository;

  CollectorsBloc({CollaboratorsRepository? collaboratorsRepository})
    : _collaboratorsRepository =
          collaboratorsRepository ?? ServiceRegistry().collaboratorsRepository,
      super(CollectorsInitial()) {
    on<SearchCollectors>(_searchCollectors);
  }

  Future<void> _searchCollectors(
    SearchCollectors event,
    Emitter<CollectorsState> emit,
  ) async {
    emit(CollectorsLoading());

    try {
      final result = await _collaboratorsRepository.searchUsers(event.query);

      if (result['success'] == true) {
        final users = result['data'] as List<dynamic>;
        final collectors =
            users
                .map((user) => CollectorModel.fromJson(user.toJson()))
                .toList();

        emit(CollectorsLoaded(collectors: collectors));
      } else {
        emit(
          CollectorsError(
            message: result['message'] ?? 'Failed to search users',
          ),
        );
      }
    } catch (e) {
      emit(
        CollectorsError(
          message: 'An error occurred while searching: ${e.toString()}',
        ),
      );
    }
  }
}
