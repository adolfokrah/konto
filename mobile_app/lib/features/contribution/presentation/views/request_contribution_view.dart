import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_colors.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/widgets/small_button.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:konto/core/theme/text_styles.dart';

class RequestContributionView extends StatelessWidget {
  const RequestContributionView({super.key});

  @override
  Widget build(BuildContext context) {
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
        title: Text('Request Contribution', style: TextStyles.titleMediumLg),
      ),
      body: SizedBox(
        width: double.infinity,
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
              'Scan the QR code to contribute',
              style: TextStyles.titleMedium,
            ),
            const SizedBox(height: AppSpacing.spacingS),
            SizedBox(
              width: 125,
              child: AppSmallButton(
                child: Row(
                  children: [
                    Icon(Icons.share, size: 16),
                    const SizedBox(width: AppSpacing.spacingS),
                    Text("Share", style: TextStyles.titleMedium),
                  ],
                ),
                onPressed: () {},
              ),
            ),
          ],
        ),
      ),
    );
  }
}
