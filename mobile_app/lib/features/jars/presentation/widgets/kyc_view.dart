import 'package:Hoga/core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:Hoga/core/config/app_config.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/snacbar_message.dart';
import 'package:Hoga/features/authentication/data/models/user.dart';

class KycVerificationPrompt extends StatelessWidget {
  final User user;

  const KycVerificationPrompt({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.verified_user, size: 64),
            const SizedBox(height: 24),
            Text(
              'In order to create a jar, please complete the KYC verification process.',
              style: TextStyles.titleRegularSm,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              'Please tap the button below to start your KYC verification.',
              style: TextStyles.titleRegularSm,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            AppButton.filled(
              onPressed: () async {
                final userId = user.id;
                final baseUrl = AppConfig.nextProjectBaseUrl;
                final verifyUrl = '$baseUrl/verify/$userId';

                try {
                  final uri = Uri.parse(verifyUrl);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
                  } else {
                    if (context.mounted) {
                      AppSnackBar.show(
                        context,
                        message: 'Could not open verification page',
                        type: SnackBarType.error,
                      );
                    }
                  }
                } catch (e) {
                  if (context.mounted) {
                    AppSnackBar.show(
                      context,
                      message: 'Error opening verification page',
                      type: SnackBarType.error,
                    );
                  }
                }
              },
              text: 'Verify my Identity',
            ),
          ],
        ),
      ),
    );
  }
}
