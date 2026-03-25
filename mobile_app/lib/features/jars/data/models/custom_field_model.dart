/// Model representing a single option for a 'select' custom field
class CustomFieldOptionModel {
  final String label;
  final String value;

  const CustomFieldOptionModel({required this.label, required this.value});

  factory CustomFieldOptionModel.fromJson(Map<String, dynamic> json) {
    return CustomFieldOptionModel(
      label: json['label'] as String? ?? '',
      value: json['value'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'label': label, 'value': value};
}

/// Model representing a custom field defined on a jar
class CustomFieldModel {
  final String? id;
  final String label;

  /// One of: 'text' | 'number' | 'select' | 'checkbox' | 'phone' | 'email'
  final String fieldType;
  final bool required;
  final String? placeholder;

  /// Only populated when [fieldType] == 'select'
  final List<CustomFieldOptionModel>? options;

  /// Whether this field's value should be included in exported PDFs
  final bool includeInExport;

  const CustomFieldModel({
    this.id,
    required this.label,
    required this.fieldType,
    this.required = false,
    this.placeholder,
    this.options,
    this.includeInExport = false,
  });

  factory CustomFieldModel.fromJson(Map<String, dynamic> json) {
    return CustomFieldModel(
      id: json['id'] as String?,
      label: json['label'] as String? ?? '',
      fieldType: json['fieldType'] as String? ?? 'text',
      required: json['required'] as bool? ?? false,
      placeholder: json['placeholder'] as String?,
      includeInExport: json['includeInExport'] as bool? ?? false,
      options:
          (json['options'] as List<dynamic>?)
              ?.map(
                (e) => CustomFieldOptionModel.fromJson(
                  e as Map<String, dynamic>,
                ),
              )
              .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'label': label,
      'fieldType': fieldType,
      'required': required,
    };
    if (placeholder != null) map['placeholder'] = placeholder;
    if (options != null) {
      map['options'] = options!.map((o) => o.toJson()).toList();
    }
    map['includeInExport'] = includeInExport;
    return map;
  }

  /// Human-readable label for the field type
  String get fieldTypeLabel {
    switch (fieldType) {
      case 'text':
        return 'Text';
      case 'number':
        return 'Number';
      case 'select':
        return 'Select';
      case 'checkbox':
        return 'Checkbox';
      case 'phone':
        return 'Phone';
      case 'email':
        return 'Email';
      default:
        return fieldType;
    }
  }
}
