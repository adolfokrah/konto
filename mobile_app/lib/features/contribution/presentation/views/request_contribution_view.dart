import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/widgets/small_button.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:konto/core/theme/text_styles.dart';
import 'package:share_plus/share_plus.dart';
import 'package:konto/l10n/app_localizations.dart';
import 'package:screen_brightness/screen_brightness.dart';

class RequestContributionView extends StatefulWidget {
  const RequestContributionView({super.key});

  @override
  State<RequestContributionView> createState() =>
      _RequestContributionViewState();
}

class _RequestContributionViewState extends State<RequestContributionView> {
  double? _previousBrightness;
  late ScreenBrightness _screenBrightness;

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
      // Get current brightness
      _previousBrightness = await _screenBrightness.current;
      // Set brightness to maximum (1.0) for better QR code visibility
      await _screenBrightness.setScreenBrightness(1.0);
    } catch (e) {
      // Handle error silently - brightness control is a nice-to-have feature
      print('Could not control screen brightness: $e');
    }
  }

  Future<void> _restoreBrightness() async {
    try {
      if (_previousBrightness != null) {
        await _screenBrightness.setScreenBrightness(_previousBrightness!);
      } else {
        // Reset to system brightness if we couldn't get the previous value
        await _screenBrightness.resetScreenBrightness();
      }
    } catch (e) {
      // Handle error silently
      print('Could not restore screen brightness: $e');
    }
  }

  void _sharePaymentLink(
    String paymentLink,
    String? jarName,
    AppLocalizations localizations,
  ) {
    final shareText =
        jarName != null
            ? 'Help me reach my goal for "$jarName"! Contribute here: $paymentLink'
            : 'Help me reach my goal! Contribute here: $paymentLink';

    Share.share(
      shareText,
      subject:
          jarName != null
              ? localizations.contributeToJar(jarName)
              : localizations.requestContribution,
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    // Extract arguments from the route
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final String paymentLink = args?['paymentLink'] ?? '';
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
      body: SizedBox(
        width: double.infinity,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.spacingL),
                margin: const EdgeInsets.only(top: 80),
                decoration: BoxDecoration(
                  color: AppColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(AppSpacing.spacingM),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppSpacing.spacingM),
                  child: QrImageView(
                    data: paymentLink,
                    version: QrVersions.auto,
                    size: 200.0,
                    backgroundColor: Colors.white,
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Colors.black,
                    ),
                    errorCorrectionLevel: QrErrorCorrectLevel.M,
                    gapless: true,
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
              AppSmallButton(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.share, size: 16),
                    const SizedBox(width: AppSpacing.spacingS),
                    Text(localizations.share, style: TextStyles.titleMedium),
                  ],
                ),
                onPressed:
                    () =>
                        _sharePaymentLink(paymentLink, jarName, localizations),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
