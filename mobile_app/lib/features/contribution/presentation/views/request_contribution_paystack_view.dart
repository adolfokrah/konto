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
import 'package:go_router/go_router.dart';

class RequestContributionPaystackView extends StatefulWidget {
  const RequestContributionPaystackView({super.key});

  @override
  State<RequestContributionPaystackView> createState() =>
      _RequestContributionPaystackViewState();
}

class _RequestContributionPaystackViewState
    extends State<RequestContributionPaystackView> {
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
      await _screenBrightness.setScreenBrightness(1.0);
    } catch (e) {}
  }

  Future<void> _restoreBrightness() async {
    try {
      await _screenBrightness.resetScreenBrightness();
    } catch (e) {}
  }

  void _sharePaymentLink(
    BuildContext context,
    String paymentLink,
    String? jarName,
    AppLocalizations localizations,
  ) {
    final shareText =
        jarName != null
            ? localizations.shareJarMessage(jarName, paymentLink)
            : localizations.shareGenericMessage(paymentLink);

    final box = context.findRenderObject() as RenderBox?;
    Share.share(
      shareText,
      subject:
          jarName != null
              ? localizations.contributeToJar(jarName)
              : localizations.requestContribution,
      sharePositionOrigin:
          box != null
              ? box.localToGlobal(Offset.zero) & box.size
              : null,
    );
  }

  Future<void> _downloadQRImage(BuildContext context, String jarName) async {
    final box = context.findRenderObject() as RenderBox?;
    final shareOrigin =
        box != null ? box.localToGlobal(Offset.zero) & box.size : null;
    try {
      final ByteData templateData = await rootBundle.load(
        'assets/images/scan_to_pay_template.jpeg',
      );
      final Uint8List templateBytes = templateData.buffer.asUint8List();
      final ui.Codec templateCodec = await ui.instantiateImageCodec(
        templateBytes,
      );
      final ui.FrameInfo templateFrame = await templateCodec.getNextFrame();
      final ui.Image templateImage = templateFrame.image;

      final RenderRepaintBoundary boundary =
          _repaintBoundaryKey.currentContext!.findRenderObject()
              as RenderRepaintBoundary;
      final ui.Image qrImage = await boundary.toImage(pixelRatio: 6.0);

      final ui.PictureRecorder recorder = ui.PictureRecorder();
      final Canvas canvas = Canvas(recorder);

      canvas.drawImage(templateImage, Offset.zero, Paint());

      const double qrX = -45;
      const double qrY = 480;
      const double qrSize = 900;
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
        textAlign: TextAlign.left,
      );

      const double maxTextWidth = 900.0;
      textPainter.layout(maxWidth: maxTextWidth);

      final textX = 70.0;
      const double textY = 480.0;
      textPainter.paint(canvas, Offset(textX, textY));

      final ui.Picture picture = recorder.endRecording();
      final ui.Image finalImage = await picture.toImage(
        templateImage.width,
        templateImage.height,
      );
      final ByteData? byteData = await finalImage.toByteData(
        format: ui.ImageByteFormat.png,
      );
      final Uint8List pngBytes = byteData!.buffer.asUint8List();

      final directory = await getApplicationDocumentsDirectory();
      final String fileName =
          '${jarName}_payment_qr_${DateTime.now().millisecondsSinceEpoch}.png';
      final String filePath = '${directory.path}/$fileName';
      final File file = File(filePath);
      await file.writeAsBytes(pngBytes);

      await Share.shareXFiles(
        [XFile(filePath)],
        text: 'Payment QR Code for $jarName',
        sharePositionOrigin: shareOrigin,
      );
    } catch (e) {
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

    final args =
        GoRouterState.of(context).extra as Map<String, dynamic>?;
    final String? jarName = args?['jarName'];

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        title: Text(
          localizations.requestContribution,
          style: TextStyles.titleMediumLg,
        ),
      ),
      body: BlocBuilder<JarSummaryBloc, JarSummaryState>(
        builder: (context, state) {
          if (state is JarSummaryLoaded) {
            String? currentUserId;
            final authState = context.read<AuthBloc>().state;
            if (authState is AuthAuthenticated) {
              currentUserId = authState.user.id;
            }
            final paymentLink =
                "${AppConfig.contributionPage}/pay/${state.jarData.id}/${state.jarData.name.replaceAll(' ', '-')}?collectorId=${currentUserId ?? ''}&provider=paystack";
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
                                context,
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
                              () => _downloadQRImage(context, jarName ?? 'QR_Code'),
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
