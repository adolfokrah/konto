import 'dart:io';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class CaptureDocumentWidget extends StatefulWidget {
  final String title;
  final String? side;

  const CaptureDocumentWidget({
    super.key,
    required this.title,
    required this.side,
  });

  @override
  State<CaptureDocumentWidget> createState() => _CaptureDocumentWidgetState();
}

class _CaptureDocumentWidgetState extends State<CaptureDocumentWidget> {
  CameraController? _controller;
  bool _isInitialized = false;
  bool _isCapturing = false;
  String? _capturedImagePath;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      // Get available cameras
      final cameras = await availableCameras();
      if (cameras.isEmpty) return;

      // Use back camera for document capture
      final backCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      // Initialize camera controller
      _controller = CameraController(
        backCamera,
        ResolutionPreset.high,
        enableAudio: false,
      );

      await _controller!.initialize();

      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }

  Future<void> _handleCaptureButtonPress() async {
    // Get current BLoC state to check if there's already a file for this side
    final currentState = context.read<KycBloc>().state;
    bool hasExistingFile = false;

    if (currentState is KycDocument) {
      hasExistingFile =
          (widget.side == 'back' && currentState.backFilePath != null) ||
          (widget.side == 'front' && currentState.frontFilePath != null);
    }

    // If image is already captured (either locally or in BLoC state), clear it first
    if (_capturedImagePath != null || hasExistingFile) {
      setState(() {
        _capturedImagePath = null; // Clear captured image to show camera view
      });

      // Remove the file path from the BLoC state based on the side
      context.read<KycBloc>().add(ClearDocumentSide(widget.side ?? 'front'));

      return; // Don't capture immediately, let user see camera first
    }

    // If no image captured yet, proceed with capture
    await _captureDocument();
  }

  Future<void> _captureDocument() async {
    if (_controller == null || _isCapturing) return;

    setState(() {
      _isCapturing = true;
    });

    try {
      final image = await _controller!.takePicture();

      // Store the captured image path
      setState(() {
        _capturedImagePath = image.path;
      });

      // Set the appropriate file path based on the side
      if (widget.side == 'back') {
        context.read<KycBloc>().add(SetDocument(backFilePath: image.path));
      } else {
        context.read<KycBloc>().add(SetDocument(frontFilePath: image.path));
      }
    } catch (e) {
      print('Error capturing document: $e');
    } finally {
      setState(() {
        _isCapturing = false;
      });
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

        // Camera preview or captured image
        Container(
          height: 300,
          width: double.infinity,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child:
                _capturedImagePath != null
                    ? Image.file(File(_capturedImagePath!), fit: BoxFit.cover)
                    : _isInitialized && _controller != null
                    ? FittedBox(
                      fit: BoxFit.cover,
                      child: SizedBox(
                        width: _controller!.value.previewSize!.height,
                        height: _controller!.value.previewSize!.width,
                        child: CameraPreview(_controller!),
                      ),
                    )
                    : const Center(child: CircularProgressIndicator()),
          ),
        ),

        const SizedBox(height: AppSpacing.spacingS),

        // Instruction text
        AppCard(
          child: Row(
            children: [
              Icon(Icons.info_outline, size: 20),
              const SizedBox(width: AppSpacing.spacingS),
              Expanded(
                child: Text(
                  'Make sure your document is properly placed, and hold it still for a few seconds',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.spacingS),

        // Capture button
        BlocBuilder<KycBloc, KycState>(
          builder: (context, state) {
            String buttonText = 'Capture Document';

            bool hasExistingFile = false;
            if (state is KycDocument) {
              hasExistingFile =
                  (widget.side == 'back' && state.backFilePath != null) ||
                  (widget.side == 'front' && state.frontFilePath != null);
            }

            if (_isCapturing) {
              buttonText = 'Capturing...';
            } else if (_capturedImagePath != null || hasExistingFile) {
              buttonText = 'Recapture Document';
            }

            return AppButton(
              text: buttonText,
              onPressed: _isCapturing ? null : _handleCaptureButtonPress,
            );
          },
        ),

        // Bottom safe area
        const SizedBox(height: AppSpacing.spacingS),
      ],
    );
  }
}
