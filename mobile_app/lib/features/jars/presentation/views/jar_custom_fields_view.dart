import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/alert_bottom_sheet.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/jars/data/models/custom_field_model.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/manage_custom_fields/manage_custom_fields_bloc.dart';
import 'package:Hoga/route.dart';

class JarCustomFieldsView extends StatelessWidget {
  final String jarId;

  const JarCustomFieldsView({super.key, required this.jarId});

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
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Custom Fields'),
          centerTitle: true,
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            context.push('${AppRoutes.jarCustomFieldAdd}?jarId=$jarId');
          },
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          shape: const CircleBorder(),
          child: const Icon(Icons.add),
        ),
        body: BlocBuilder<JarSummaryBloc, JarSummaryState>(
          builder: (context, state) {
            if (state is! JarSummaryLoaded) {
              return const Center(child: CircularProgressIndicator());
            }

            final fields = state.jarData.customFields ?? [];

            if (fields.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.spacingL),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.input_rounded,
                        size: 64,
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withValues(alpha: 0.3),
                      ),
                      const SizedBox(height: AppSpacing.spacingM),
                      Text(
                        'No custom fields yet',
                        style: AppTextStyles.titleMediumS,
                      ),
                      const SizedBox(height: AppSpacing.spacingXs),
                      Text(
                        'Add fields for contributors to fill in when making a contribution.',
                        style: AppTextStyles.titleRegularXs.copyWith(
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }

            return ReorderableListView.builder(
              padding: const EdgeInsets.all(AppSpacing.spacingM),
              itemCount: fields.length,
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
                  padding: const EdgeInsets.only(bottom: AppSpacing.spacingXs),
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

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        context.push(
          '${AppRoutes.jarCustomFieldAdd}?jarId=$jarId',
          extra: {'field': field, 'index': index},
        );
      },
      child: Container(
      padding: const EdgeInsets.all(AppSpacing.spacingM),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(field.label, style: AppTextStyles.titleMediumS),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _TypeBadge(label: field.fieldTypeLabel),
                    if (field.required) ...[
                      const SizedBox(width: AppSpacing.spacingXs),
                      _TypeBadge(
                        label: 'Required',
                        color: AppColors.errorRed,
                      ),
                    ],
                    if (field.fieldType == 'select' &&
                        field.options != null &&
                        field.options!.isNotEmpty) ...[
                      const SizedBox(width: AppSpacing.spacingXs),
                      _TypeBadge(
                        label: '${field.options!.length} options',
                        color: AppColors.infoBlue,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              AlertBottomSheet.show(
                context: context,
                title: 'Delete Field',
                message:
                    'Are you sure you want to delete "${field.label}"? This cannot be undone.',
                confirmText: 'Delete',
                onConfirm: onDelete,
              );
            },
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.errorRed.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.delete_outline,
                color: AppColors.errorRed,
                size: 18,
              ),
            ),
          ),
        ],
      ),
    ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String label;
  final Color? color;

  const _TypeBadge({required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final bgColor = color ?? Theme.of(context).colorScheme.secondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: AppTextStyles.titleRegularXs.copyWith(
          color: bgColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
