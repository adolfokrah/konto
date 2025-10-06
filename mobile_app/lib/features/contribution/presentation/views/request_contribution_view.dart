import 'package:Hoga/core/constants/app_images.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/config/app_config.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/small_button.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:pretty_qr_code/pretty_qr_code.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:share_plus/share_plus.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:screen_brightness/screen_brightness.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:path_provider/path_provider.dart';
import 'dart:io';

class RequestContributionView extends StatefulWidget {
  const RequestContributionView({super.key});

  @override
  State<RequestContributionView> createState() =>
      _RequestContributionViewState();
}

class _RequestContributionViewState extends State<RequestContributionView> {
  late ScreenBrightness _screenBrightness;
  final GlobalKey _repaintBoundaryKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _screenBrightness = ScreenBrightness();
    _increaseBrightness();
  }

  @override
  void dispose() {
    _restoreBrightness();
    super.dispose();
  }

  Future<void> _increaseBrightness() async {
    try {
      // Set brightness to maximum (1.0) for better QR code visibility
      await _screenBrightness.setScreenBrightness(1.0);
    } catch (e) {
      // Handle error silently - brightness control is a nice-to-have feature
    }
  }

  Future<void> _restoreBrightness() async {
    try {
      await _screenBrightness.resetScreenBrightness();
    } catch (e) {
      // Handle error silently - brightness restoration is a nice-to-have feature
      // This is especially important for tests where the plugin may not be available
    }
  }

  void _sharePaymentLink(
    String paymentLink,
    String? jarName,
    AppLocalizations localizations,
  ) {
    final shareText =
        jarName != null
            ? localizations.shareJarMessage(jarName, paymentLink)
            : localizations.shareGenericMessage(paymentLink);

    Share.share(
      shareText,
      subject:
          jarName != null
              ? localizations.contributeToJar(jarName)
              : localizations.requestContribution,
    );
  }

  Future<void> _downloadQRImage(String jarName) async {
    try {
      // Load the template image from assets
      final ByteData templateData = await rootBundle.load(
        'assets/images/scan_to_pay_template.jpeg',
      ); // Add your template image here
      final Uint8List templateBytes = templateData.buffer.asUint8List();
      final ui.Codec templateCodec = await ui.instantiateImageCodec(
        templateBytes,
      );
      final ui.FrameInfo templateFrame = await templateCodec.getNextFrame();
      final ui.Image templateImage = templateFrame.image;

      // Get QR code from the widget
      final RenderRepaintBoundary boundary =
          _repaintBoundaryKey.currentContext!.findRenderObject()
              as RenderRepaintBoundary;
      final ui.Image qrImage = await boundary.toImage(pixelRatio: 6.0);

      // Create canvas to combine template and QR code
      final ui.PictureRecorder recorder = ui.PictureRecorder();
      final Canvas canvas = Canvas(recorder);

      // Draw the template image as background
      canvas.drawImage(templateImage, Offset.zero, Paint());

      // Calculate QR code position (adjust these values based on your template)
      // These coordinates should match where the QR code area is in your template
      const double qrX =
          -45; // X position where QR should be placed (left edge of white area)
      const double qrY =
          480; // Y position where QR should be placed (top of white area)
      const double qrSize =
          900; // Size of the QR code (width of white area)      // Draw QR code on top of template
      canvas.drawImageRect(
        qrImage,
        Rect.fromLTWH(
          0,
          0,
          qrImage.width.toDouble(),
          qrImage.height.toDouble(),
        ),
        Rect.fromLTWH(qrX, qrY, qrSize, qrSize),
        Paint(),
      );

      // Add jar name text to the image with text wrapping
      final textPainter = TextPainter(
        text: TextSpan(
          text: jarName,
          style: AppTextStyles.headingOne.copyWith(
            color: Colors.white,
            fontSize: 40,
            fontWeight: FontWeight.bold,
          ),
        ),
        textDirection: TextDirection.ltr,
        textAlign: TextAlign.left, // Center align the text
      );

      // Set maximum width for text wrapping (leave some padding from edges)
      const double maxTextWidth =
          900.0; // Maximum width for text before wrapping
      textPainter.layout(maxWidth: maxTextWidth);

      // Calculate text position (centered horizontally, positioned where "Streaming Funding" appears in template)
      final textX = 70.0; // Center the text block
      const double textY =
          480.0; // Position where the jar name should appear in the template

      textPainter.paint(canvas, Offset(textX, textY));

      // Convert to final image
      final ui.Picture picture = recorder.endRecording();
      final ui.Image finalImage = await picture.toImage(
        templateImage.width,
        templateImage.height,
      );
      final ByteData? byteData = await finalImage.toByteData(
        format: ui.ImageByteFormat.png,
      );
      final Uint8List pngBytes = byteData!.buffer.asUint8List();

      // Save and share
      final directory = await getApplicationDocumentsDirectory();
      final String fileName =
          '${jarName}_payment_qr_${DateTime.now().millisecondsSinceEpoch}.png';
      final String filePath = '${directory.path}/$fileName';
      final File file = File(filePath);
      await file.writeAsBytes(pngBytes);

      // Share the saved image
      await Share.shareXFiles([
        XFile(filePath),
      ], text: 'Payment QR Code for $jarName');
    } catch (e) {
      // Handle error - maybe show a snackbar
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to download QR code: ${e.toString()}'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    // Extract arguments from the route
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final String? jarName = args?['jarName'];

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          localizations.requestContribution,
          style: TextStyles.titleMediumLg,
        ),
      ),
      body: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is JarSummaryLoaded) {
            // Use current authenticated user ID instead of collectionId in the query param
            String? currentUserId;
            final authState = context.read<AuthBloc>().state;
            if (authState is AuthAuthenticated) {
              currentUserId = authState.user.id;
            }
            final paymentLink =
                "${AppConfig.nextProjectBaseUrl}/pay/${state.jarData.id}/${state.jarData.name.replaceAll(' ', '-')}?collectionId=${currentUserId ?? ''}";
            return SizedBox(
              width: double.infinity,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    RepaintBoundary(
                      key: _repaintBoundaryKey,
                      child: Padding(
                        padding: const EdgeInsets.all(50),
                        child: Container(
                          padding: const EdgeInsets.all(AppSpacing.spacingM),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(
                              AppSpacing.spacingM,
                            ),
                          ),
                          child: PrettyQrView.data(
                            data: paymentLink,
                            decoration: const PrettyQrDecoration(
                              shape: PrettyQrDotsSymbol(color: Colors.black),
                              background: Colors.transparent,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.spacingL),
                    Text(jarName ?? '', style: TextStyles.titleBoldLg),
                    const SizedBox(height: AppSpacing.spacingS),
                    Text(
                      localizations.scanTheQRCodeToContribute,
                      style: TextStyles.titleMedium,
                    ),
                    const SizedBox(height: AppSpacing.spacingS),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AppSmallButton(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.share, size: 16),
                              const SizedBox(width: AppSpacing.spacingS),
                              Text(
                                localizations.share,
                                style: TextStyles.titleMedium,
                              ),
                            ],
                          ),
                          onPressed:
                              () => _sharePaymentLink(
                                paymentLink,
                                jarName,
                                localizations,
                              ),
                        ),
                        const SizedBox(width: AppSpacing.spacingS),
                        AppSmallButton(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.download, size: 16),
                              const SizedBox(width: AppSpacing.spacingS),
                              Text('Download', style: TextStyles.titleMedium),
                            ],
                          ),
                          onPressed:
                              () => _downloadQRImage(jarName ?? 'QR_Code'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }
          return Container();
        },
      ),
    );
  }
}
