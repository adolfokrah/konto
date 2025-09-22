import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:math' as math;

class SelectDocument extends StatefulWidget {
  final String title;
  final String? side;
  const SelectDocument({super.key, required this.title, this.side});

  @override
  State<SelectDocument> createState() => _SelectDocumentState();
}

class _SelectDocumentState extends State<SelectDocument> {
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImageFromGallery() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });

        // Set the appropriate file path based on the side
        if (widget.side == 'back') {
          context.read<KycBloc>().add(SetDocument(backFilePath: image.path));
        } else {
          context.read<KycBloc>().add(SetDocument(frontFilePath: image.path));
        }
      }
    } catch (e) {
      // Handle error if needed
      debugPrint('Error picking image: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Title
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.spacingL),
          child: Text(
            widget.title,
            style: TextStyles.titleMediumM,
            textAlign: TextAlign.center,
          ),
        ),

        const SizedBox(height: AppSpacing.spacingL),

        GestureDetector(
          onTap: _pickImageFromGallery,
          child: CustomPaint(
            painter: DashedBorderPainter(
              color: Colors.grey.shade400,
              strokeWidth: 2,
              dashLength: 8,
              gapLength: 4,
              borderRadius: 12,
            ),
            child: Container(
              width: double.infinity,
              height: 280,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
              ),
              child:
                  _selectedImage != null
                      ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          _selectedImage!,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                        ),
                      )
                      : Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.add_photo_alternate_outlined,
                              size: 48,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(height: AppSpacing.spacingS),
                            Text(
                              'Tap here to select from your device',
                              style: TextStyles.titleRegularSm.copyWith(
                                color: Colors.grey.shade600,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.spacingS),

        AppButton(
          text: _selectedImage != null ? "Change Image" : "Upload Image",
          onPressed: _pickImageFromGallery,
        ),
        const SizedBox(height: AppSpacing.spacingS),
      ],
    );
  }
}

class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double dashLength;
  final double gapLength;
  final double borderRadius;

  DashedBorderPainter({
    required this.color,
    required this.strokeWidth,
    required this.dashLength,
    required this.gapLength,
    required this.borderRadius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = color
          ..strokeWidth = strokeWidth
          ..style = PaintingStyle.stroke;

    final rrect = RRect.fromLTRBR(
      strokeWidth / 2,
      strokeWidth / 2,
      size.width - strokeWidth / 2,
      size.height - strokeWidth / 2,
      Radius.circular(borderRadius),
    );

    final path = Path()..addRRect(rrect);

    _drawDashedPath(canvas, path, paint);
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint) {
    final pathMetrics = path.computeMetrics();
    for (final pathMetric in pathMetrics) {
      double distance = 0.0;
      while (distance < pathMetric.length) {
        final segment = pathMetric.extractPath(
          distance,
          math.min(distance + dashLength, pathMetric.length),
        );
        canvas.drawPath(segment, paint);
        distance += dashLength + gapLength;
      }
    }
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
