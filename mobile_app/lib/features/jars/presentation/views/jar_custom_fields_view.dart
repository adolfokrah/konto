import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/data/models/custom_field_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/manage_custom_fields/manage_custom_fields_bloc.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';
import 'package:Hoga/route.dart';

/// Icon for a custom question type.
IconData customFieldIcon(String type) => switch (type) {
  'number' => Icons.pin_outlined,
  'select' => Icons.format_list_bulleted_rounded,
  'checkbox' => Icons.check_box_outlined,
  'phone' => Icons.phone_outlined,
  'email' => Icons.alternate_email_rounded,
  _ => Icons.short_text_rounded,
};

class JarCustomFieldsView extends StatelessWidget {
  final String jarId;

  const JarCustomFieldsView({super.key, required this.jarId});

  void _add(BuildContext context) {
    context.push('${AppRoutes.jarCustomFieldAdd}?jarId=$jarId');
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<ManageCustomFieldsBloc, ManageCustomFieldsState>(
      listener: (context, state) {
        if (state is ManageCustomFieldsSuccess) {
          AppSnackBar.showSuccess(
            context,
            message: 'Custom field added successfully',
          );
          context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
        } else if (state is ManageCustomFieldsFailure) {
          AppSnackBar.showError(context, message: state.errorMessage);
        }
      },
      child: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          final fields =
              state is JarSummaryLoaded
                  ? (state.jarData.customFields ?? <CustomFieldModel>[])
                  : <CustomFieldModel>[];

          return Scaffold(
            backgroundColor: AppColors.cream,
            appBar: JarTopBar(
              title: 'Custom questions',
              actions: [
                if (fields.isNotEmpty)
                  JarNavButton(icon: Icons.add, onTap: () => _add(context)),
              ],
            ),
            body: Builder(
              builder: (context) {
                if (state is! JarSummaryLoaded) {
                  return const JarLoading();
                }

                if (fields.isEmpty) {
                  return Center(
                    child: DsEmptyState(
                      icon: Icons.format_list_bulleted_rounded,
                      tone: DsTone.lime,
                      title: 'No questions yet',
                      message:
                          'Ask contributors something when they pay, like "Which side are you from?" or their table number.',
                      actionLabel: 'Add a question',
                      onAction: () => _add(context),
                    ),
                  );
                }

                return ReorderableListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                  header: Padding(
                    padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
                    child: Text(
                      'Contributors answer these when they pay. Answers show on each payment and in exports. Hold and drag to reorder.',
                      style: DsText.small,
                    ),
                  ),
                  itemCount: fields.length,
                  proxyDecorator:
                      (child, index, animation) =>
                          Material(color: Colors.transparent, child: child),
                  onReorder: (oldIndex, newIndex) {
                    if (newIndex > oldIndex) newIndex--;
                    final reordered = [...fields];
                    final item = reordered.removeAt(oldIndex);
                    reordered.insert(newIndex, item);
                    context.read<ManageCustomFieldsBloc>().add(
                      ReorderCustomFieldsRequested(
                        jarId: jarId,
                        reorderedFields:
                            reordered.map((f) => f.toJson()).toList(),
                      ),
                    );
                  },
                  itemBuilder: (context, index) {
                    return Padding(
                      key: ValueKey(fields[index].label + index.toString()),
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _CustomFieldCard(
                        field: fields[index],
                        index: index,
                        jarId: jarId,
                        onDelete: () {
                          final currentFields =
                              fields.map((f) => f.toJson()).toList();
                          context.read<ManageCustomFieldsBloc>().add(
                            DeleteCustomFieldRequested(
                              jarId: jarId,
                              index: index,
                              currentFields: currentFields,
                            ),
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _CustomFieldCard extends StatelessWidget {
  final CustomFieldModel field;
  final int index;
  final String jarId;
  final VoidCallback onDelete;

  const _CustomFieldCard({
    required this.field,
    required this.index,
    required this.jarId,
    required this.onDelete,
  });

  Future<void> _confirmDelete(BuildContext context) async {
    final ok = await JarConfirmSheet.show(
      context: context,
      icon: Icons.delete_outline_rounded,
      tone: DsTone.negative,
      title: 'Delete this question?',
      message:
          '"${field.label}" will be removed from your payment page. This cannot be undone.',
      confirmText: 'Delete',
    );
    if (ok == true) onDelete();
  }

  @override
  Widget build(BuildContext context) {
    final typeLabel =
        field.fieldType == 'select'
            ? 'Choice · ${field.options?.length ?? 0}'
            : field.fieldType == 'checkbox'
            ? 'Yes/No'
            : field.fieldTypeLabel;

    return Material(
      color: AppColors.surfaceWhite,
      borderRadius: BorderRadius.circular(AppRadius.radiusCard),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.radiusCard),
        onTap: () {
          context.push(
            '${AppRoutes.jarCustomFieldAdd}?jarId=$jarId',
            extra: {'field': field, 'index': index},
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              DsIconTile(customFieldIcon(field.fieldType), tone: DsTone.lime),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      field.label,
                      style: DsText.rowTitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        DsTag(typeLabel),
                        if (field.required)
                          const DsTag('Required', tone: DsTone.negative),
                        if (field.includeInExport)
                          const DsTag('In PDF', tone: DsTone.info),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _confirmDelete(context),
                icon: const Icon(
                  Icons.delete_outline_rounded,
                  color: AppColors.muted,
                  size: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
