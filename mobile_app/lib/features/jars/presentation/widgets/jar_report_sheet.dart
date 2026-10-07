import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/di/service_locator.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/features/jars/data/api_providers/jar_api_provider.dart';
import 'package:Hoga/features/jars/presentation/widgets/jar_ui.dart';

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
  static const _reasons = [
    'Looks like a scam',
    'Wrong or misleading information',
    'Offensive content',
    'Something else',
  ];

  final _controller = TextEditingController();
  int _reason = 0;
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final details = _controller.text.trim();
    final isOther = _reason == _reasons.length - 1;
    if (isOther && details.isEmpty) {
      setState(() => _error = 'Please tell us what\'s wrong');
      return;
    }
    // The API takes one message: the chosen reason plus any details.
    final message =
        details.isEmpty ? _reasons[_reason] : '${_reasons[_reason]}: $details';

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
      child: JarSheetFrame(
        title: 'Report this jar',
        children: [
          Text(
            'We review every report. The organizer won\'t know it was you.',
            style: DsText.small,
          ),
          const SizedBox(height: 14),
          JarFillList(
            children: [
              for (var i = 0; i < _reasons.length; i++)
                DsRow(
                  title: _reasons[i],
                  trailing: JarRadio(selected: _reason == i),
                  onTap: () => setState(() => _reason = i),
                ),
            ],
          ),
          const SizedBox(height: 12),
          JarField(
            label: 'Details (optional)',
            child: JarBareInput(
              controller: _controller,
              hintText: 'Tell us more',
              maxLines: 4,
              minLines: 2,
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(
              _error!,
              style: DsText.caption.copyWith(color: AppColors.negative),
            ),
          ],
          const SizedBox(height: 16),
          JarPrimaryButton(
            label: 'Send report',
            loading: _isSubmitting,
            onTap: _isSubmitting ? null : _submit,
          ),
        ],
      ),
    );
  }
}
