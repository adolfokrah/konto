part of 'manage_custom_fields_bloc.dart';

@immutable
sealed class ManageCustomFieldsState {}

final class ManageCustomFieldsInitial extends ManageCustomFieldsState {}

final class ManageCustomFieldsInProgress extends ManageCustomFieldsState {}

final class ManageCustomFieldsSuccess extends ManageCustomFieldsState {
  final List<CustomFieldModel> updatedFields;

  ManageCustomFieldsSuccess({required this.updatedFields});
}

final class ManageCustomFieldsFailure extends ManageCustomFieldsState {
  final String errorMessage;

  ManageCustomFieldsFailure(this.errorMessage);
}
