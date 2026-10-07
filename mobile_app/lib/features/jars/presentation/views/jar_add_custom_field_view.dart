import 'package:Hoga/core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/data/models/custom_field_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/manage_custom_fields/manage_custom_fields_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';

/// "Paste a list" sheet: paste options separated by commas or new lines.
class _PasteOptionsSheet extends StatefulWidget {
  final String initialText;
  final void Function(List<String> parts) onConvert;

  const _PasteOptionsSheet({
    required this.initialText,
    required this.onConvert,
  });

  @override
  State<_PasteOptionsSheet> createState() => _PasteOptionsSheetState();
}

class _PasteOptionsSheetState extends State<_PasteOptionsSheet> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialText);
    _controller.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<String> get _parts =>
      _controller.text
          .split(RegExp(r'[,\n]'))
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();

  @override
  Widget build(BuildContext context) {
    final parts = _parts;
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: JarSheetFrame(
        title: 'Paste a list',
        children: [
          Text(
            'Paste options separated by commas or new lines.',
            style: DsText.small,
          ),
          const SizedBox(height: 12),
          JarField(
            label: 'Options',
            focused: true,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 100),
              child: JarBareInput(
                controller: _controller,
                hintText: 'e.g. Option A, Option B, Option C',
                maxLines: 6,
                minLines: 4,
                keyboardType: TextInputType.multiline,
              ),
            ),
          ),
          if (parts.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [for (final p in parts) JarChip(label: p)],
            ),
          ],
          const SizedBox(height: 16),
          JarPrimaryButton(
            label:
                parts.isEmpty
                    ? 'Add options'
                    : 'Add ${parts.length} option${parts.length == 1 ? '' : 's'}',
            onTap:
                parts.isEmpty
                    ? null
                    : () {
                      Navigator.pop(context);
                      widget.onConvert(parts);
                    },
          ),
        ],
      ),
    );
  }
}

class JarAddCustomFieldView extends StatefulWidget {
  final String jarId;

  /// When set, the form is in edit mode
  final CustomFieldModel? existingField;
  final int? existingIndex;

  const JarAddCustomFieldView({
    super.key,
    required this.jarId,
    this.existingField,
    this.existingIndex,
  });

  bool get isEditMode => existingField != null && existingIndex != null;

  @override
  State<JarAddCustomFieldView> createState() => _JarAddCustomFieldViewState();
}

class _JarAddCustomFieldViewState extends State<JarAddCustomFieldView> {
  late final TextEditingController _labelController;
  late final TextEditingController _placeholderController;
  late String _fieldType;
  late bool _required;
  late bool _includeInExport;
  late final List<TextEditingController> _optionControllers;

  @override
  void initState() {
    super.initState();
    final field = widget.existingField;
    _labelController = TextEditingController(text: field?.label ?? '');
    _placeholderController = TextEditingController(
      text: field?.placeholder ?? '',
    );
    _fieldType = field?.fieldType ?? 'text';
    _required = field?.required ?? false;
    _includeInExport = field?.includeInExport ?? false;
    _optionControllers =
        field?.options
            ?.map((o) => TextEditingController(text: o.label))
            .toList() ??
        [];
  }

  @override
  void dispose() {
    _labelController.dispose();
    _placeholderController.dispose();
    for (final c in _optionControllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _openPasteSheet() {
    final initialText = _optionControllers
        .map((c) => c.text.trim())
        .where((t) => t.isNotEmpty)
        .join(', ');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return _PasteOptionsSheet(
          initialText: initialText,
          onConvert: (parts) {
            setState(() {
              for (final c in _optionControllers) {
                c.dispose();
              }
              _optionControllers
                ..clear()
                ..addAll(parts.map((p) => TextEditingController(text: p)));
            });
          },
        );
      },
    );
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

    final fieldMap = <String, dynamic>{
      'label': label,
      'fieldType': _fieldType,
      'required': _required,
      'includeInExport': _includeInExport,
    };

    final placeholder = _placeholderController.text.trim();
    if (placeholder.isNotEmpty) fieldMap['placeholder'] = placeholder;

    if (_fieldType == 'select') {
      fieldMap['options'] =
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

    final summaryState = context.read<JarSummaryBloc>().state;
    final currentFields =
        summaryState is JarSummaryLoaded
            ? (summaryState.jarData.customFields ?? [])
                .map((f) => f.toJson())
                .toList()
            : <Map<String, dynamic>>[];

    if (widget.isEditMode) {
      context.read<ManageCustomFieldsBloc>().add(
        UpdateCustomFieldRequested(
          jarId: widget.jarId,
          index: widget.existingIndex!,
          updatedField: fieldMap,
          currentFields: currentFields,
        ),
      );
    } else {
      context.read<ManageCustomFieldsBloc>().add(
        AddCustomFieldRequested(
          jarId: widget.jarId,
          updatedFields: [...currentFields, fieldMap],
        ),
      );
    }
  }

  static const _typeChips = [
    ('text', 'Text'),
    ('number', 'Number'),
    ('select', 'Choice'),
    ('checkbox', 'Yes/No'),
    ('phone', 'Phone'),
    ('email', 'Email'),
  ];

  void _setType(String value) {
    setState(() {
      _fieldType = value;
      if (value != 'select') {
        for (final c in _optionControllers) {
          c.dispose();
        }
        _optionControllers.clear();
      }
    });
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
        backgroundColor: AppColors.cream,
        appBar: JarTopBar(
          title: widget.isEditMode ? 'Edit question' : 'New question',
          leadingIcon: Icons.close_rounded,
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            JarField(
              label: 'Question',
              child: JarBareInput(
                controller: _labelController,
                hintText: 'e.g. Which side are you from?',
              ),
            ),
            const SizedBox(height: 14),
            const DsGroupLabel('Answer type'),
            const SizedBox(height: 8),
            Opacity(
              opacity: widget.isEditMode ? 0.6 : 1,
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final t in _typeChips)
                    JarChip(
                      label: t.$2,
                      selected: _fieldType == t.$1,
                      onTap: widget.isEditMode ? null : () => _setType(t.$1),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            if (_fieldType == 'select') ...[
              DsGroupLabel('Options · ${_optionControllers.length}'),
              const SizedBox(height: 8),
              DsListCard(
                children: [
                  for (var i = 0; i < _optionControllers.length; i++)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 6, 6, 6),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 22,
                            child: Text('${i + 1}', style: DsText.caption),
                          ),
                          Expanded(
                            child: JarBareInput(
                              controller: _optionControllers[i],
                              hintText: 'Option label',
                            ),
                          ),
                          IconButton(
                            onPressed: () => _removeOption(i),
                            icon: const Icon(
                              Icons.close_rounded,
                              size: 18,
                              color: AppColors.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  InkWell(
                    onTap: _addOption,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.add_rounded,
                            size: 20,
                            color: AppColors.navy,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Add option',
                              style: DsText.rowTitle.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          DsLink('Paste list', onTap: _openPasteSheet),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
            ],

            if (_fieldType != 'checkbox') ...[
              JarField(
                label: 'Placeholder (optional)',
                child: JarBareInput(
                  controller: _placeholderController,
                  hintText: 'e.g. Enter your year group',
                ),
              ),
              const SizedBox(height: 14),
            ],

            DsListCard(
              children: [
                DsRow(
                  title: 'Required',
                  subtitle: 'Contributors must answer this',
                  trailing: JarToggle(
                    value: _required,
                    onChanged: (v) => setState(() => _required = v),
                  ),
                ),
                DsRow(
                  title: 'Include in PDF',
                  subtitle: 'Show answers in exported reports',
                  trailing: JarToggle(
                    value: _includeInExport,
                    onChanged: (v) => setState(() => _includeInExport = v),
                  ),
                ),
              ],
            ),
          ],
        ),
        bottomNavigationBar: JarFooter(
          children: [
            BlocBuilder<ManageCustomFieldsBloc, ManageCustomFieldsState>(
              builder: (context, state) {
                return JarPrimaryButton(
                  label: widget.isEditMode ? 'Save changes' : 'Add question',
                  loading: state is ManageCustomFieldsInProgress,
                  onTap: state is ManageCustomFieldsInProgress ? null : _submit,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
