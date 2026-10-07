import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/core/config/app_config.dart';
import 'package:Hoga/core/constants/app_colors.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/ds/ds.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/contribution/presentation/widgets/collect_ui.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:pretty_qr_code/pretty_qr_code.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:Hoga/l10n/app_localizations.dart';
import 'package:screen_brightness/screen_brightness.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'dart:ui' as ui;
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'package:go_router/go_router.dart';

/// Request money: a QR code, the collector's link with a ready message, and
/// a printable scan-to-pay poster.
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
          box != null ? box.localToGlobal(Offset.zero) & box.size : null,
    );
  }

  Future<void> _downloadQRImage(BuildContext context, String jarName) async {
    final box = context.findRenderObject() as RenderBox?;
    final shareOrigin =
        box != null ? box.localToGlobal(Offset.zero) & box.size : null;
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
      await Share.shareXFiles(
        [XFile(filePath)],
        text: 'Payment QR Code for $jarName',
        sharePositionOrigin: shareOrigin,
      );
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

  int _tab = 0;

  String _shareText(
    String paymentLink,
    String? jarName,
    AppLocalizations localizations,
  ) =>
      jarName != null
          ? localizations.shareJarMessage(jarName, paymentLink)
          : localizations.shareGenericMessage(paymentLink);

  void _copyLink(String paymentLink, AppLocalizations localizations) {
    Clipboard.setData(ClipboardData(text: paymentLink));
    AppSnackBar.showSuccess(
      context,
      message: localizations.linkCopiedToClipboard,
    );
  }

  String _displayLink(String link) =>
      link.replaceFirst(RegExp(r'^https?://(www\.)?'), '');

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    // Extract arguments from the route
    final args = GoRouterState.of(context).extra as Map<String, dynamic>?;
    final String? argJarName = args?['jarName'];

    return BlocBuilder<JarSummaryBloc, JarSummaryState>(
      builder: (context, state) {
        if (state is! JarSummaryLoaded) {
          return Scaffold(
            appBar: CollectTopBar(
              title: 'Request money',
              leadingIcon: Icons.close_rounded,
              onBack: () => context.pop(),
            ),
          );
        }
        final jarName = argJarName ?? state.jarData.name;

        // Use current authenticated user ID instead of collectionId in the query param
        String? currentUserId;
        String? currentUsername;
        final authState = context.read<AuthBloc>().state;
        if (authState is AuthAuthenticated) {
          currentUserId = authState.user.id;
          currentUsername = authState.user.username;
        }
        // Short link (<site>/j/<code>/<username>) when the jar has a short code; the
        // server redirects it to the full page with the collector attributed. Older
        // jars without a code keep the long link.
        final shortCode = state.jarData.shortCode;
        final hasUsername =
            currentUsername != null && currentUsername.isNotEmpty;
        // The collector always travels with the link: as the username segment, or as
        // ?collectorId= when there's no username (the /j route keeps query params).
        final paymentLink =
            shortCode != null && shortCode.isNotEmpty
                ? hasUsername
                    ? "${AppConfig.contributionPage}/j/$shortCode/$currentUsername"
                    : "${AppConfig.contributionPage}/j/$shortCode${currentUserId != null ? '?collectorId=$currentUserId' : ''}"
                : "${AppConfig.contributionPage}/pay/${state.jarData.id}/${state.jarData.name.replaceAll(' ', '-')}?collectorId=${currentUserId ?? ''}";

        final Widget body = switch (_tab) {
          1 => _linkTab(paymentLink, jarName, localizations),
          2 => _posterTab(paymentLink, jarName),
          _ => _qrTab(paymentLink, jarName, localizations),
        };

        return Scaffold(
          appBar: CollectTopBar(
            title: 'Request money',
            leadingIcon: Icons.close_rounded,
            onBack: () => context.pop(),
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            children: [
              CollectTabs(
                labels: const ['QR code', 'Link', 'Poster'],
                index: _tab,
                onChanged: (i) => setState(() => _tab = i),
              ),
              const SizedBox(height: 12),
              body,
            ],
          ),
          bottomNavigationBar: switch (_tab) {
            1 => null,
            2 => CollectFooter(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Builder(
                        builder:
                            (btnContext) => CollectButton(
                              label: localizations.share,
                              icon: Icons.ios_share_rounded,
                              onTap:
                                  () => _sharePaymentLink(
                                    btnContext,
                                    paymentLink,
                                    jarName,
                                    localizations,
                                  ),
                            ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Builder(
                        builder:
                            (btnContext) => AppButton.filled(
                              text: 'Save image',
                              icon: Icon(
                                Icons.download_rounded,
                                size: 18,
                                color: AppColors.onPrimaryWhite,
                              ),
                              onPressed:
                                  () => _downloadQRImage(btnContext, jarName),
                            ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            _ => CollectFooter(
              children: [
                Builder(
                  builder:
                      (btnContext) => AppButton.filled(
                        text: localizations.share,
                        icon: Icon(
                          Icons.ios_share_rounded,
                          size: 18,
                          color: AppColors.onPrimaryWhite,
                        ),
                        onPressed:
                            () => _sharePaymentLink(
                              btnContext,
                              paymentLink,
                              jarName,
                              localizations,
                            ),
                      ),
                ),
              ],
            ),
          },
        );
      },
    );
  }

  Widget _linkRow(
    String paymentLink,
    AppLocalizations localizations, {
    double size = 14,
  }) {
    return DsCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Your link', style: DsText.caption),
                const SizedBox(height: 2),
                Text(
                  _displayLink(paymentLink),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.section.copyWith(fontSize: size),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          CollectBoxButton(
            icon: Icons.copy_rounded,
            filled: true,
            onTap: () => _copyLink(paymentLink, localizations),
          ),
        ],
      ),
    );
  }

  Widget _qrTab(
    String paymentLink,
    String jarName,
    AppLocalizations localizations,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DsCard(
          padding: const EdgeInsets.all(22),
          child: Column(
            children: [
              SizedBox(
                width: 200,
                height: 200,
                child: PrettyQrView.data(
                  data: paymentLink,
                  decoration: PrettyQrDecoration(
                    shape: PrettyQrDotsSymbol(color: AppColors.navy),
                    background: Colors.transparent,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(jarName, style: DsText.section, textAlign: TextAlign.center),
              const SizedBox(height: 2),
              Text(
                'Scan to pay with MoMo or card',
                style: DsText.caption,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _linkRow(paymentLink, localizations),
        const SizedBox(height: 12),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            'Payments through your link are credited to you as collector.',
            style: DsText.caption,
          ),
        ),
      ],
    );
  }

  Widget _linkTab(
    String paymentLink,
    String jarName,
    AppLocalizations localizations,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _linkRow(paymentLink, localizations, size: 15),
        const SizedBox(height: 14),
        const CollectCap('Message'),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
          decoration: BoxDecoration(
            color: AppColors.surfaceWhite,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Sent with the link', style: DsText.caption),
              const SizedBox(height: 4),
              Text(
                _shareText(paymentLink, jarName, localizations),
                style: DsText.body.copyWith(color: AppColors.navy),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        const CollectCap('Share to'),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _shareTarget(
                icon: Icons.chat_rounded,
                label: 'WhatsApp',
                background: const Color(0xFF25D366),
                foreground: Colors.white,
                onTap:
                    () => _openWith(
                      Uri.parse(
                        'whatsapp://send?text=${Uri.encodeComponent(_shareText(paymentLink, jarName, localizations))}',
                      ),
                      paymentLink,
                      jarName,
                      localizations,
                    ),
              ),
            ),
            Expanded(
              child: _shareTarget(
                icon: Icons.mail_outline_rounded,
                label: 'SMS',
                onTap:
                    () => _openWith(
                      Uri.parse(
                        'sms:?body=${Uri.encodeComponent(_shareText(paymentLink, jarName, localizations))}',
                      ),
                      paymentLink,
                      jarName,
                      localizations,
                    ),
              ),
            ),
            Expanded(
              child: _shareTarget(
                icon: Icons.copy_rounded,
                label: 'Copy',
                onTap: () => _copyLink(paymentLink, localizations),
              ),
            ),
            Expanded(
              child: Builder(
                builder:
                    (btnContext) => _shareTarget(
                      icon: Icons.more_horiz_rounded,
                      label: 'More',
                      onTap:
                          () => _sharePaymentLink(
                            btnContext,
                            paymentLink,
                            jarName,
                            localizations,
                          ),
                    ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Opens WhatsApp / Messages with the message ready; falls back to the
  /// system share sheet when the app isn't there.
  Future<void> _openWith(
    Uri uri,
    String paymentLink,
    String jarName,
    AppLocalizations localizations,
  ) async {
    try {
      if (await launchUrl(uri, mode: LaunchMode.externalApplication)) return;
    } catch (_) {}
    if (!mounted) return;
    _sharePaymentLink(context, paymentLink, jarName, localizations);
  }

  Widget _shareTarget({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? background,
    Color? foreground,
  }) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: background ?? AppColors.surfaceWhite,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 20, color: foreground ?? AppColors.navy),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: DsText.caption.copyWith(color: AppColors.navy),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _posterTab(String paymentLink, String jarName) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          decoration: BoxDecoration(
            color: AppColors.navy,
            borderRadius: BorderRadius.circular(20),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.asset(
                        'assets/images/logo_icon.png',
                        width: 28,
                        height: 28,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Scan to contribute',
                      style: DsText.section.copyWith(
                        color: AppColors.onPrimaryWhite,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 0, 18, 0),
                child: Row(
                  children: [
                    // The poster image is composed from this boundary, so it
                    // keeps the original QR layout and is shown scaled down.
                    SizedBox(
                      width: 138,
                      height: 138,
                      child: FittedBox(
                        child: SizedBox(
                          width: 390,
                          height: 390,
                          child: RepaintBoundary(
                            key: _repaintBoundaryKey,
                            child: Padding(
                              padding: const EdgeInsets.all(50),
                              child: Container(
                                padding: const EdgeInsets.all(
                                  AppSpacing.spacingM,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(
                                    AppSpacing.spacingM,
                                  ),
                                ),
                                child: PrettyQrView.data(
                                  data: paymentLink,
                                  decoration: const PrettyQrDecoration(
                                    shape: PrettyQrDotsSymbol(
                                      color: Colors.black,
                                    ),
                                    background: Colors.transparent,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            jarName,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: DsText.section.copyWith(
                              color: AppColors.onPrimaryWhite,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'MoMo or card · no app needed',
                            style: DsText.caption.copyWith(
                              color: AppColors.onPrimaryWhite.withValues(
                                alpha: 0.65,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                color: AppColors.lime,
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 10,
                ),
                child: Text(
                  _displayLink(paymentLink),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: DsText.small.copyWith(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            'Print it for the venue or post it in WhatsApp groups.',
            style: DsText.caption,
          ),
        ),
      ],
    );
  }
}
