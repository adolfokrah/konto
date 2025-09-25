import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/route.dart';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'dart:io';
import 'dart:typed_data';

class LivenessCamera extends StatefulWidget {
  const LivenessCamera({Key? key}) : super(key: key);

  @override
  State<LivenessCamera> createState() => _LivenessCameraState();
}

class _LivenessCameraState extends State<LivenessCamera> {
  CameraController? _controller;
  FaceDetector? _faceDetector;
  bool _isInitialized = false;
  bool _isProcessing = false;
  bool _isDetecting = false;
  bool _faceDetected = false;

  // Debug variables
  int _faceCount = 0;
  bool _faceInOval = false;
  bool _isFacingCamera = false;
  double _headYaw = 0.0;
  double _headPitch = 0.0;
  double _headRoll = 0.0;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _initializeFaceDetector();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _showErrorDialog('No camera available');
        return;
      }

      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _controller = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup:
            Platform.isAndroid
                ? ImageFormatGroup.nv21
                : ImageFormatGroup.bgra8888,
      );

      await _controller!.initialize();

      // Add a small delay for Android stability
      if (Platform.isAndroid) {
        await Future.delayed(const Duration(milliseconds: 1000));
      }

      _controller!.startImageStream((CameraImage image) {
        if (_isDetecting) return;
        _processCameraImage(image);
      });

      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      _showErrorDialog('Failed to initialize camera: ${e.toString()}');
    }
  }

  void _initializeFaceDetector() {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableClassification: false,
        enableLandmarks: true, // Enable to detect face landmarks
        enableContours: false,
        enableTracking: true, // Enable for better face tracking
        minFaceSize: 0.1,
        performanceMode:
            FaceDetectorMode
                .accurate, // Use accurate mode for better head pose detection
      ),
    );
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isDetecting || _faceDetector == null) return;

    _isDetecting = true;

    try {
      final inputImage = _inputImageFromCameraImage(image);
      if (inputImage == null) {
        return;
      }

      final faces = await _faceDetector!.processImage(inputImage);

      setState(() {
        _faceCount = faces.length;
        _faceInOval = faces.isNotEmpty ? _isFaceInOval(faces, image) : false;
        _isFacingCamera =
            faces.isNotEmpty ? _isFaceOrientedCorrectly(faces.first) : false;

        if (faces.isNotEmpty) {
          final face = faces.first;
          _headYaw = face.headEulerAngleY ?? 0.0;
          _headPitch = face.headEulerAngleX ?? 0.0;
          _headRoll = face.headEulerAngleZ ?? 0.0;
        }

        _faceDetected = faces.isNotEmpty && _faceInOval && _isFacingCamera;
      });
    } catch (e) {
      print('Error processing image: $e');
    } finally {
      _isDetecting = false;
    }
  }

  InputImage? _inputImageFromCameraImage(CameraImage image) {
    try {
      print(
        'Creating InputImage: ${image.width}x${image.height}, format: ${image.format.group}, planes: ${image.planes.length}',
      );

      final camera = _controller!.description;

      InputImageRotation rotation;
      if (Platform.isAndroid) {
        // Android: Handle rotation more carefully
        switch (camera.sensorOrientation) {
          case 0:
            rotation = InputImageRotation.rotation0deg;
            break;
          case 90:
            rotation = InputImageRotation.rotation90deg;
            break;
          case 180:
            rotation = InputImageRotation.rotation180deg;
            break;
          case 270:
            rotation = InputImageRotation.rotation270deg;
            break;
          default:
            rotation = InputImageRotation.rotation0deg;
        }
        print(
          'Android sensor orientation: ${camera.sensorOrientation}, rotation: $rotation',
        );
      } else {
        rotation =
            InputImageRotationValue.fromRawValue(camera.sensorOrientation) ??
            InputImageRotation.rotation0deg;
      }

      InputImageFormat? format;
      if (Platform.isAndroid) {
        if (image.format.group == ImageFormatGroup.nv21) {
          format = InputImageFormat.nv21;
        } else if (image.format.group == ImageFormatGroup.yuv420) {
          format = InputImageFormat.yuv420;
        } else {
          // Try to map the raw format
          format = InputImageFormatValue.fromRawValue(image.format.raw);
          format ??= InputImageFormat.nv21;
        }
      } else {
        format = InputImageFormatValue.fromRawValue(image.format.raw);
      }

      if (format == null) {
        return null;
      }

      Uint8List bytes;
      if (Platform.isAndroid && image.planes.isNotEmpty) {
        // Android: Use only the first plane for better compatibility
        bytes = image.planes[0].bytes;
      } else {
        // iOS: Concatenate all planes
        final allBytes = <int>[];
        for (final Plane plane in image.planes) {
          allBytes.addAll(plane.bytes);
        }
        bytes = Uint8List.fromList(allBytes);
      }

      // Android: Validate bytes per row
      int bytesPerRow = image.planes[0].bytesPerRow;
      if (Platform.isAndroid && bytesPerRow <= 0) {
        bytesPerRow = image.width;
      }

      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: InputImageMetadata(
          size: Size(image.width.toDouble(), image.height.toDouble()),
          rotation: rotation,
          format: format,
          bytesPerRow: bytesPerRow,
        ),
      );

      return inputImage;
    } catch (e) {
      return null;
    }
  }

  bool _isFaceInOval(List<Face> faces, CameraImage image) {
    if (faces.isEmpty || !mounted) return false;

    final face = faces.first;
    final screenSize = MediaQuery.of(context).size;

    // Calculate oval bounds (same as in FaceOvalPainter)
    const ovalWidth = 280.0;
    const ovalHeight = 360.0;
    final ovalLeft = (screenSize.width - ovalWidth) / 2;
    final ovalTop = (screenSize.height - ovalHeight) / 2;
    final ovalRight = ovalLeft + ovalWidth;
    final ovalBottom = ovalTop + ovalHeight;

    // Handle coordinate scaling differently for Android vs iOS
    double scaleX, scaleY;
    double faceLeft, faceTop, faceRight, faceBottom;

    if (Platform.isAndroid) {
      // Android: Account for camera rotation and preview size
      final previewSize = _controller!.value.previewSize;
      if (previewSize != null) {
        // Use preview size for more accurate scaling
        scaleX =
            screenSize.width / previewSize.height; // Note: width/height swap
        scaleY = screenSize.height / previewSize.width; // due to rotation
      } else {
        scaleX = screenSize.width / image.height; // Swap for rotation
        scaleY = screenSize.height / image.width;
      }

      // Android face coordinates might need adjustment based on sensor orientation
      final camera = _controller!.description;
      if (camera.sensorOrientation == 90 || camera.sensorOrientation == 270) {
        // Rotated coordinate system
        faceLeft = face.boundingBox.top * scaleX;
        faceTop = (image.width - face.boundingBox.right) * scaleY;
        faceRight = face.boundingBox.bottom * scaleX;
        faceBottom = (image.width - face.boundingBox.left) * scaleY;
      } else {
        // Standard coordinate system
        faceLeft = face.boundingBox.left * scaleX;
        faceTop = face.boundingBox.top * scaleY;
        faceRight = face.boundingBox.right * scaleX;
        faceBottom = face.boundingBox.bottom * scaleY;
      }
    } else {
      // iOS: Standard scaling
      scaleX = screenSize.width / image.width;
      scaleY = screenSize.height / image.height;

      faceLeft = face.boundingBox.left * scaleX;
      faceTop = face.boundingBox.top * scaleY;
      faceRight = face.boundingBox.right * scaleX;
      faceBottom = face.boundingBox.bottom * scaleY;
    }

    // Check if face center is within oval bounds (more lenient)
    final faceCenterX = (faceLeft + faceRight) / 2;
    final faceCenterY = (faceTop + faceBottom) / 2;

    final faceInFrame =
        faceCenterX >= ovalLeft &&
        faceCenterX <= ovalRight &&
        faceCenterY >= ovalTop &&
        faceCenterY <= ovalBottom;

    // Check face size for proper distance (more lenient)
    final faceWidth = face.boundingBox.width * scaleX;
    final faceHeight = face.boundingBox.height * scaleY;
    final idealWidth = ovalWidth * 0.4; // More lenient
    final idealHeight = ovalHeight * 0.4; // More lenient

    final properDistance =
        (faceWidth >= idealWidth * 0.5 && faceWidth <= idealWidth * 2.0) &&
        (faceHeight >= idealHeight * 0.5 && faceHeight <= idealHeight * 2.0);

    return faceInFrame && properDistance;
  }

  bool _isFaceOrientedCorrectly(Face face) {
    // Check if head pose angles are within acceptable thresholds
    const double yawThreshold = 15.0; // ±15 degrees
    const double pitchThreshold = 15.0; // ±15 degrees
    const double rollThreshold = 20.0; // ±20 degrees

    final double yaw = face.headEulerAngleY ?? 0.0;
    final double pitch = face.headEulerAngleX ?? 0.0;
    final double roll = face.headEulerAngleZ ?? 0.0;

    // Update head pose state variables
    _headYaw = yaw;
    _headPitch = pitch;
    _headRoll = roll;

    // Check if angles are within thresholds
    if (yaw.abs() > yawThreshold) return false;
    if (pitch.abs() > pitchThreshold) return false;
    if (roll.abs() > rollThreshold) return false;

    // Additional check: ensure both eyes are visible (face is forward-facing)
    final leftEye = face.landmarks[FaceLandmarkType.leftEye];
    final rightEye = face.landmarks[FaceLandmarkType.rightEye];

    // Both eyes should be detected for proper frontal face
    return leftEye != null && rightEye != null;
  }

  String _getFeedbackMessage() {
    if (_faceDetected) {
      return 'Face detected! Tap to capture';
    }

    // Check if we have face detection but head pose is incorrect
    if (!_isFacingCamera) {
      // Give specific guidance based on head pose angles
      if (_headYaw.abs() > 15) {
        return _headYaw > 0
            ? 'Please turn your head slightly to the left'
            : 'Please turn your head slightly to the right';
      }
      if (_headPitch.abs() > 15) {
        return _headPitch > 0
            ? 'Please lower your chin slightly'
            : 'Please raise your chin slightly';
      }
      if (_headRoll.abs() > 20) {
        return 'Please keep your head straight';
      }
      return 'Please face the camera directly';
    }

    return 'Position your face within the oval';
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Error'),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
    );
  }

  Future<void> _captureImage() async {
    if (_controller == null || !_controller!.value.isInitialized) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      await _controller!.stopImageStream();
      final image = await _controller!.takePicture();

      if (mounted) {
        context.read<KycBloc>().add(SetDocument(photoFilePath: image.path));

        final currentState = context.read<KycBloc>().state;

        if (currentState is KycDocument &&
            currentState.frontFilePath != null &&
            currentState.backFilePath != null &&
            currentState.documentType != null) {
          context.read<MediaBloc>().add(
            RequestUploadKycDocuments(
              frontFilePath: currentState.frontFilePath!,
              backFilePath: currentState.backFilePath!,
              photoFilePath: image.path,
              documentType: currentState.documentType!,
            ),
          );
        }

        Navigator.pushNamedAndRemoveUntil(
          context,
          AppRoutes.uploadingDocuments,
          (route) => false,
        );
      }
    } catch (e) {
      _showErrorDialog('Failed to capture image');
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  void dispose() {
    _controller?.stopImageStream();
    _controller?.dispose();
    _faceDetector?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized || _controller == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Take Photo')),
      body: Stack(
        children: [
          Positioned.fill(
            child: FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: _controller!.value.previewSize!.height,
                height: _controller!.value.previewSize!.width,
                child: CameraPreview(_controller!),
              ),
            ),
          ),

          // Face Oval Overlay
          const Positioned.fill(child: FaceOvalOverlay()),

          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _getFeedbackMessage(),
                style: TextStyle(
                  color: _faceDetected ? Colors.green : Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),

          if (_faceDetected)
            Positioned(
              bottom: 50,
              left: 0,
              right: 0,
              child: Center(
                child: GestureDetector(
                  onTap: _isProcessing ? null : _captureImage,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(color: Colors.grey, width: 4),
                    ),
                    child:
                        _isProcessing
                            ? const Center(child: CircularProgressIndicator())
                            : const Icon(
                              Icons.camera_alt,
                              size: 40,
                              color: Colors.black,
                            ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// Face Oval Overlay Widget
class FaceOvalOverlay extends StatelessWidget {
  const FaceOvalOverlay({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: FaceOvalPainter(), size: Size.infinite);
  }
}

// Face Oval Painter
class FaceOvalPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Calculate oval position
    const ovalWidth = 280.0;
    const ovalHeight = 360.0;
    final ovalLeft = (size.width - ovalWidth) / 2;
    final ovalTop = (size.height - ovalHeight) / 2;

    // Create path for the oval
    final ovalPath =
        Path()
          ..addOval(Rect.fromLTWH(ovalLeft, ovalTop, ovalWidth, ovalHeight));

    // Create path for the full screen
    final fullScreenPath =
        Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));

    // Create the overlay path (full screen minus oval)
    final overlayPath = Path.combine(
      PathOperation.difference,
      fullScreenPath,
      ovalPath,
    );

    // Draw the dark overlay everywhere except the oval
    final overlayPaint =
        Paint()
          ..color = Colors.black.withOpacity(0.6)
          ..style = PaintingStyle.fill;

    canvas.drawPath(overlayPath, overlayPaint);

    // Draw oval border
    final borderPaint =
        Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3.0;

    canvas.drawOval(
      Rect.fromLTWH(ovalLeft, ovalTop, ovalWidth, ovalHeight),
      borderPaint,
    );
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
