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
