import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
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
          context.read<JarSummaryBloc>().add(RefreshJarSummaryRequested());
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

            return ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.spacingM),
              itemCount: fields.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: AppSpacing.spacingXs),
              itemBuilder: (context, index) {
                return _CustomFieldCard(field: fields[index]);
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

  const _CustomFieldCard({required this.field});

  @override
  Widget build(BuildContext context) {
    return Container(
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
        ],
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
