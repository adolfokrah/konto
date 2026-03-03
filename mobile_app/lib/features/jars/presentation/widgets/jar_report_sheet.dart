import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_radius.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/drag_handle.dart';
import 'package:Hoga/features/jars/data/api_providers/jar_api_provider.dart';

/// Bottom sheet for reporting a jar.
/// Returns `true` on successful report, `null` on dismiss.
class JarReportSheet extends StatefulWidget {
  final String jarId;

  const JarReportSheet({super.key, required this.jarId});

  static Future<bool?> show({
    required BuildContext context,
    required String jarId,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      isScrollControlled: true,
      builder: (context) => JarReportSheet(jarId: jarId),
    );
  }

  @override
  State<JarReportSheet> createState() => _JarReportSheetState();
}

class _JarReportSheetState extends State<JarReportSheet> {
  final _controller = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final message = _controller.text.trim();
    if (message.isEmpty) {
      setState(() => _error = 'Please enter a reason for your report');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final result = await getIt<JarApiProvider>().reportJar(
        jarId: widget.jarId,
        message: message,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        Navigator.of(context).pop(true);
      } else {
        setState(() {
          _error = result['message'] ?? 'Failed to submit report';
          _isSubmitting = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Something went wrong. Please try again.';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppRadius.radiusM),
            topRight: Radius.circular(AppRadius.radiusM),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Center(child: DragHandle()),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.spacingL,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: AppSpacing.spacingS),
                  Text('Report Jar', style: TextStyles.titleBoldLg),
                  const SizedBox(height: AppSpacing.spacingXs),
                  Text(
                    'Tell us why you want to report this jar.',
                    style: TextStyles.titleRegularSm.copyWith(
                      color: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.color
                          ?.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingM),
                  TextField(
                    controller: _controller,
                    maxLines: 5,
                    minLines: 3,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(
                      hintText: 'Describe the issue...',
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(AppRadius.radiusM),
                      ),
                      errorText: _error,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingM),
                  SizedBox(
                    width: double.infinity,
                    child: AppButton(
                      text: 'Submit Report',
                      onPressed: _isSubmitting ? null : _submit,
                      isLoading: _isSubmitting,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.spacingL),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
