import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/route.dart';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

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

  // Liveness check states
  bool _faceDetected = false;
  bool _faceInFrame = false;
  bool _properDistance = false;
  bool _goodLighting = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _initializeFaceDetector();
  }

  Future<void> _initializeCamera() async {
    try {
      // Since image picker works with camera, we know permission is granted
      // Skip permission check and proceed directly to camera initialization
      print('Initializing camera directly...');

      // Get available cameras
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _showNoCameraDialog();
        return;
      }

      // Use front camera for selfie
      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      // Initialize camera controller
      _controller = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _controller!.initialize();

      // Start image stream for face detection
      _controller!.startImageStream(_processCameraImage);

      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print('Error initializing camera: $e');
      _showErrorDialog('Failed to initialize camera');
    }
  }

  void _initializeFaceDetector() {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableClassification: false,
        enableLandmarks: true,
        enableContours: false,
        enableTracking: false,
      ),
    );
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isDetecting || _faceDetector == null) return;

    _isDetecting = true;

    try {
      // Convert CameraImage to InputImage for ML Kit
      final inputImage = _inputImageFromCameraImage(image);
      if (inputImage == null) return;

      // Detect faces
      final faces = await _faceDetector!.processImage(inputImage);

      // Update liveness states based on detection results
      _updateLivenessStates(faces, image);
    } catch (e) {
      print('Error processing camera image: $e');
    } finally {
      _isDetecting = false;
    }
  }

  InputImage? _inputImageFromCameraImage(CameraImage image) {
    // Get camera rotation
    final camera = _controller!.description;
    final rotation = InputImageRotationValue.fromRawValue(
      camera.sensorOrientation,
    );
    if (rotation == null) return null;

    // Get image format
    final format = InputImageFormatValue.fromRawValue(image.format.raw);
    if (format == null) return null;

    // Create InputImage
    return InputImage.fromBytes(
      bytes: image.planes[0].bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: image.planes[0].bytesPerRow,
      ),
    );
  }

  void _updateLivenessStates(List<Face> faces, CameraImage image) {
    if (!mounted) return;

    setState(() {
      // Check if face is detected
      _faceDetected = faces.isNotEmpty;

      if (faces.isNotEmpty) {
        final face = faces.first;
        final screenSize = MediaQuery.of(context).size;

        // Calculate oval bounds (same as in FaceOvalPainter)
        // Use fixed size for consistent oval shape across all devices
        const ovalWidth = 280.0; // Fixed width
        const ovalHeight =
            360.0; // Fixed height (maintains good face proportion)

        final ovalLeft = (screenSize.width - ovalWidth) / 2;
        final ovalTop = (screenSize.height - ovalHeight) / 2;
        final ovalRight = ovalLeft + ovalWidth;
        final ovalBottom = ovalTop + ovalHeight;

        // Scale face bounds to screen coordinates
        final scaleX = screenSize.width / image.width;
        final scaleY = screenSize.height / image.height;

        final faceLeft = face.boundingBox.left * scaleX;
        final faceTop = face.boundingBox.top * scaleY;
        final faceRight = face.boundingBox.right * scaleX;
        final faceBottom = face.boundingBox.bottom * scaleY;

        // Check if face is within oval bounds
        _faceInFrame =
            faceLeft >= ovalLeft &&
            faceTop >= ovalTop &&
            faceRight <= ovalRight &&
            faceBottom <= ovalBottom;

        // Check face size for proper distance
        final faceWidth = face.boundingBox.width * scaleX;
        final faceHeight = face.boundingBox.height * scaleY;
        final idealWidth = ovalWidth * 0.6; // Face should be 60% of oval
        final idealHeight = ovalHeight * 0.6;

        _properDistance =
            (faceWidth >= idealWidth * 0.8 && faceWidth <= idealWidth * 1.2) &&
            (faceHeight >= idealHeight * 0.8 &&
                faceHeight <= idealHeight * 1.2);

        // Simple lighting check (you can enhance this)
        _goodLighting = true; // For now, assume good lighting
      } else {
        _faceInFrame = false;
        _properDistance = false;
        _goodLighting = false;
      }
    });
  }

  bool _allChecksPass() {
    return _faceDetected && _faceInFrame && _properDistance && _goodLighting;
  }

  void _showNoCameraDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('No Camera Found'),
            content: const Text('No camera is available on this device.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
    );
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
          // Camera Preview filling the screen with proper scaling
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

          // Head Frame Overlay
          const Positioned.fill(child: FaceOvalOverlay()),

          // Instructions
          Positioned(
            top: 100,
            left: 20,
            right: 20,
            child: LivenessInstructions(
              faceDetected: _faceDetected,
              faceInFrame: _faceInFrame,
              properDistance: _properDistance,
              goodLighting: _goodLighting,
            ),
          ),

          // Capture Button
          if (_allChecksPass())
            Positioned(
              bottom: 50,
              left: 0,
              right: 0,
              child: Center(
                child: CaptureButton(
                  onCapture: _captureImage,
                  isProcessing: _isProcessing,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _captureImage() async {
    if (_controller == null || _isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      final image = await _controller!.takePicture();

      // Here you can process the captured image
      // For example, save it or send it to your backend

      if (mounted) {
        // Update KYC state with photo file path
        context.read<KycBloc>().add(SetDocument(photoFilePath: image.path));

        // Get current KYC state to access document info
        final currentState = context.read<KycBloc>().state;

        if (currentState is KycDocument &&
            currentState.frontFilePath != null &&
            currentState.backFilePath != null &&
            currentState.documentType != null) {
          // Upload KYC documents using MediaBloc
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
      print('Error capturing image: $e');
      _showErrorDialog('Failed to capture image');
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
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

class FaceOvalPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = Colors.black.withOpacity(0.5)
          ..style = PaintingStyle.fill;

    final path = Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));

    // Create oval cutout in the center
    final center = Offset(size.width / 2, size.height / 2);

    // Use fixed size for consistent oval shape across all devices
    const ovalWidth = 300.0; // Fixed width
    const ovalHeight = 360.0; // Fixed height (maintains good face proportion)

    final ovalRect = Rect.fromCenter(
      center: center,
      width: ovalWidth,
      height: ovalHeight,
    );

    path.addOval(ovalRect);
    path.fillType = PathFillType.evenOdd;

    canvas.drawPath(path, paint);

    // Draw oval border
    final borderPaint =
        Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3.0;

    canvas.drawOval(ovalRect, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// Liveness Instructions Widget
class LivenessInstructions extends StatelessWidget {
  final bool faceDetected;
  final bool faceInFrame;
  final bool properDistance;
  final bool goodLighting;

  const LivenessInstructions({
    Key? key,
    required this.faceDetected,
    required this.faceInFrame,
    required this.properDistance,
    required this.goodLighting,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    String instruction = '';
    Color color = Colors.red;

    if (!faceDetected) {
      instruction = 'Please position your face in the frame';
      color = Colors.red;
    } else if (!faceInFrame) {
      instruction = 'Center your face in the oval';
      color = Colors.orange;
    } else if (!properDistance) {
      instruction = 'Move closer or further to fit the oval';
      color = Colors.orange;
    } else if (!goodLighting) {
      instruction = 'Move to better lighting';
      color = Colors.orange;
    } else {
      instruction = 'Perfect! Tap to capture';
      color = Colors.green;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        instruction,
        style: TextStyle(
          color: color,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

// Capture Button Widget
class CaptureButton extends StatelessWidget {
  final VoidCallback onCapture;
  final bool isProcessing;

  const CaptureButton({
    Key? key,
    required this.onCapture,
    required this.isProcessing,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isProcessing ? null : onCapture,
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          border: Border.all(color: Colors.green, width: 4),
        ),
        child:
            isProcessing
                ? const Center(
                  child: CircularProgressIndicator(color: Colors.green),
                )
                : const Icon(Icons.camera_alt, color: Colors.green, size: 40),
      ),
    );
  }
}
