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
    on<UpdateCustomFieldRequested>(_onUpdateCustomField);
    on<DeleteCustomFieldRequested>(_onDeleteCustomField);
    on<ReorderCustomFieldsRequested>(_onReorderCustomFields);
  }

  Future<void> _onUpdateCustomField(
    UpdateCustomFieldRequested event,
    Emitter<ManageCustomFieldsState> emit,
  ) async {
    emit(ManageCustomFieldsInProgress());

    final updatedFields = List<Map<String, dynamic>>.from(event.currentFields);
    updatedFields[event.index] = event.updatedField;

    final response = await _jarRepository.updateJar(
      jarId: event.jarId,
      customFields: updatedFields,
    );

    if (response['success'] == true) {
      emit(
        ManageCustomFieldsSuccess(
          updatedFields:
              updatedFields.map((f) => CustomFieldModel.fromJson(f)).toList(),
        ),
      );
    } else {
      emit(
        ManageCustomFieldsFailure(
          response['message'] ?? 'Failed to update custom field',
        ),
      );
    }
  }

  Future<void> _onReorderCustomFields(
    ReorderCustomFieldsRequested event,
    Emitter<ManageCustomFieldsState> emit,
  ) async {
    emit(ManageCustomFieldsInProgress());

    final response = await _jarRepository.updateJar(
      jarId: event.jarId,
      customFields: event.reorderedFields,
    );

    if (response['success'] == true) {
      emit(
        ManageCustomFieldsSuccess(
          updatedFields: event.reorderedFields
              .map((f) => CustomFieldModel.fromJson(f))
              .toList(),
        ),
      );
    } else {
      emit(
        ManageCustomFieldsFailure(
          response['message'] ?? 'Failed to reorder custom fields',
        ),
      );
    }
  }

  Future<void> _onDeleteCustomField(
    DeleteCustomFieldRequested event,
    Emitter<ManageCustomFieldsState> emit,
  ) async {
    emit(ManageCustomFieldsInProgress());

    final updatedFields = List<Map<String, dynamic>>.from(event.currentFields)
      ..removeAt(event.index);

    final response = await _jarRepository.updateJar(
      jarId: event.jarId,
      customFields: updatedFields,
    );

    if (response['success'] == true) {
      emit(
        ManageCustomFieldsSuccess(
          updatedFields:
              updatedFields.map((f) => CustomFieldModel.fromJson(f)).toList(),
        ),
      );
    } else {
      emit(
        ManageCustomFieldsFailure(
          response['message'] ?? 'Failed to delete custom field',
        ),
      );
    }
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
