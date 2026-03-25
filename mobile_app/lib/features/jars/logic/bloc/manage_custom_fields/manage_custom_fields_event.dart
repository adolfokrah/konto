part of 'manage_custom_fields_bloc.dart';

@immutable
sealed class ManageCustomFieldsEvent {}

final class AddCustomFieldRequested extends ManageCustomFieldsEvent {
  final String jarId;

  /// Full updated list (existing fields + new field appended)
  final List<Map<String, dynamic>> updatedFields;

  AddCustomFieldRequested({
    required this.jarId,
    required this.updatedFields,
  });
}

final class UpdateCustomFieldRequested extends ManageCustomFieldsEvent {
  final String jarId;
  final int index;
  final Map<String, dynamic> updatedField;
  final List<Map<String, dynamic>> currentFields;

  UpdateCustomFieldRequested({
    required this.jarId,
    required this.index,
    required this.updatedField,
    required this.currentFields,
  });
}

final class ReorderCustomFieldsRequested extends ManageCustomFieldsEvent {
  final String jarId;
  final List<Map<String, dynamic>> reorderedFields;

  ReorderCustomFieldsRequested({
    required this.jarId,
    required this.reorderedFields,
  });
}

final class DeleteCustomFieldRequested extends ManageCustomFieldsEvent {
  final String jarId;

  /// Index of the field to remove in the current customFields list
  final int index;

  /// Current fields list (so the bloc can remove by index and PATCH)
  final List<Map<String, dynamic>> currentFields;

  DeleteCustomFieldRequested({
    required this.jarId,
    required this.index,
    required this.currentFields,
  });
}
