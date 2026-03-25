import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/jars/data/models/custom_field_model.dart';
import 'package:Hoga/features/jars/data/repositories/jar_repository.dart';

part 'manage_custom_fields_event.dart';
part 'manage_custom_fields_state.dart';

class ManageCustomFieldsBloc
    extends Bloc<ManageCustomFieldsEvent, ManageCustomFieldsState> {
  final JarRepository _jarRepository;

  ManageCustomFieldsBloc({required JarRepository jarRepository})
    : _jarRepository = jarRepository,
      super(ManageCustomFieldsInitial()) {
    on<AddCustomFieldRequested>(_onAddCustomField);
  }

  Future<void> _onAddCustomField(
    AddCustomFieldRequested event,
    Emitter<ManageCustomFieldsState> emit,
  ) async {
    emit(ManageCustomFieldsInProgress());

    final response = await _jarRepository.updateJar(
      jarId: event.jarId,
      customFields: event.updatedFields,
    );

    if (response['success'] == true) {
      // Parse the returned customFields from the response doc
      final doc = response['data'];
      List<CustomFieldModel> updatedFields = event.updatedFields
          .map((f) => CustomFieldModel.fromJson(f))
          .toList();

      if (doc != null && doc['customFields'] is List) {
        updatedFields =
            (doc['customFields'] as List<dynamic>)
                .map(
                  (e) =>
                      CustomFieldModel.fromJson(e as Map<String, dynamic>),
                )
                .toList();
      }

      emit(ManageCustomFieldsSuccess(updatedFields: updatedFields));
    } else {
      emit(
        ManageCustomFieldsFailure(
          response['message'] ?? 'Failed to add custom field',
        ),
      );
    }
  }
}
