import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/core/widgets/text_input.dart';
import 'package:Hoga/core/widgets/select_input.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/manage_custom_fields/manage_custom_fields_bloc.dart';

class JarAddCustomFieldView extends StatefulWidget {
  final String jarId;

  const JarAddCustomFieldView({super.key, required this.jarId});

  @override
  State<JarAddCustomFieldView> createState() => _JarAddCustomFieldViewState();
}

class _JarAddCustomFieldViewState extends State<JarAddCustomFieldView> {
  final _labelController = TextEditingController();
  final _placeholderController = TextEditingController();
  String _fieldType = 'text';
  bool _required = false;

  // For select options: each entry is a TextEditingController for the label
  final List<TextEditingController> _optionControllers = [];

  static const _fieldTypeOptions = [
    SelectOption(value: 'text', label: 'Text'),
    SelectOption(value: 'number', label: 'Number'),
    SelectOption(value: 'select', label: 'Select (dropdown)'),
    SelectOption(value: 'checkbox', label: 'Checkbox'),
    SelectOption(value: 'phone', label: 'Phone'),
    SelectOption(value: 'email', label: 'Email'),
  ];

  @override
  void dispose() {
    _labelController.dispose();
    _placeholderController.dispose();
    for (final c in _optionControllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _addOption() {
    setState(() {
      _optionControllers.add(TextEditingController());
    });
  }

  void _removeOption(int index) {
    setState(() {
      _optionControllers[index].dispose();
      _optionControllers.removeAt(index);
    });
  }

  void _submit() {
    final label = _labelController.text.trim();
    if (label.isEmpty) {
      AppSnackBar.showError(context, message: 'Please enter a field label');
      return;
    }

    if (_fieldType == 'select') {
      final validOptions =
          _optionControllers
              .map((c) => c.text.trim())
              .where((t) => t.isNotEmpty)
              .toList();
      if (validOptions.isEmpty) {
        AppSnackBar.showError(
          context,
          message: 'Please add at least one option for a select field',
        );
        return;
      }
    }

    // Build the new field map
    final newField = <String, dynamic>{
      'label': label,
      'fieldType': _fieldType,
      'required': _required,
    };

    final placeholder = _placeholderController.text.trim();
    if (placeholder.isNotEmpty) newField['placeholder'] = placeholder;

    if (_fieldType == 'select') {
      newField['options'] =
          _optionControllers
              .map((c) => c.text.trim())
              .where((t) => t.isNotEmpty)
              .map(
                (optLabel) => {
                  'label': optLabel,
                  'value': optLabel.toLowerCase().replaceAll(' ', '_'),
                },
              )
              .toList();
    }

    // Append to existing fields
    final summaryState = context.read<JarSummaryBloc>().state;
    final existing =
        summaryState is JarSummaryLoaded
            ? (summaryState.jarData.customFields ?? [])
                .map((f) => f.toJson())
                .toList()
            : <Map<String, dynamic>>[];

    context.read<ManageCustomFieldsBloc>().add(
      AddCustomFieldRequested(
        jarId: widget.jarId,
        updatedFields: [...existing, newField],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<ManageCustomFieldsBloc, ManageCustomFieldsState>(
      listener: (context, state) {
        if (state is ManageCustomFieldsSuccess) {
          context.pop();
        } else if (state is ManageCustomFieldsFailure) {
          AppSnackBar.showError(context, message: state.errorMessage);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Add Custom Field'),
          centerTitle: true,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.spacingM),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppTextInput(
                label: 'Field Label *',
                hintText: 'e.g. Year Group, Department',
                controller: _labelController,
              ),
              const SizedBox(height: AppSpacing.spacingM),
              SelectInput<String>(
                label: 'Field Type',
                value: _fieldType,
                options: _fieldTypeOptions,
                onChanged: (value) => setState(() {
                  _fieldType = value;
                  // Clear options when switching away from select
                  if (value != 'select') {
                    for (final c in _optionControllers) {
                      c.dispose();
                    }
                    _optionControllers.clear();
                  }
                }),
              ),
              const SizedBox(height: AppSpacing.spacingM),

              // Placeholder — hidden for checkbox
              if (_fieldType != 'checkbox') ...[
                AppTextInput(
                  label: 'Placeholder (optional)',
                  hintText: 'e.g. Enter your year group',
                  controller: _placeholderController,
                ),
                const SizedBox(height: AppSpacing.spacingM),
              ],

              // Required toggle
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.spacingM,
                  vertical: AppSpacing.spacingXs,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text('Required', style: AppTextStyles.titleMediumS),
                  subtitle: Text(
                    'Contributors must fill in this field',
                    style: AppTextStyles.titleRegularXs,
                  ),
                  value: _required,
                  onChanged: (v) => setState(() => _required = v),
                ),
              ),

              // Select options
              if (_fieldType == 'select') ...[
                const SizedBox(height: AppSpacing.spacingM),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Options', style: AppTextStyles.titleMediumS),
                    TextButton.icon(
                      onPressed: _addOption,
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add option'),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.spacingXs),
                if (_optionControllers.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.spacingXs,
                    ),
                    child: Text(
                      'No options added yet. Tap "Add option" to add one.',
                      style: AppTextStyles.titleRegularXs.copyWith(
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ...List.generate(_optionControllers.length, (i) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.spacingXs),
                    child: Row(
                      children: [
                        Expanded(
                          child: AppTextInput(
                            hintText: 'Option label',
                            controller: _optionControllers[i],
                          ),
                        ),
                        const SizedBox(width: AppSpacing.spacingXs),
                        IconButton(
                          onPressed: () => _removeOption(i),
                          icon: const Icon(Icons.remove_circle_outline),
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ],
                    ),
                  );
                }),
              ],

              const SizedBox(height: AppSpacing.spacingL),

              BlocBuilder<ManageCustomFieldsBloc, ManageCustomFieldsState>(
                builder: (context, state) {
                  return AppButton(
                    text: 'Add Field',
                    isLoading: state is ManageCustomFieldsInProgress,
                    onPressed:
                        state is ManageCustomFieldsInProgress ? null : _submit,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
