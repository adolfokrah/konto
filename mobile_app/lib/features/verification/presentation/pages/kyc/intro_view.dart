import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/widgets/button.dart';
import 'package:Hoga/core/widgets/card.dart';
import 'package:Hoga/route.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class KYCIntroView extends StatefulWidget {
  const KYCIntroView({super.key});

  @override
  State<KYCIntroView> createState() => _KYCIntroViewState();
}

class _KYCIntroViewState extends State<KYCIntroView> {
  Future<void> _requestPermissions(BuildContext context) async {
    // Request camera permission
    await Permission.camera.request();

    // Request storage/photos permission for gallery access
    await Permission.storage.request();
    await Permission.photos.request();

    // Proceed to next view regardless of permission status
    if (context.mounted) {
      Navigator.pushNamed(context, AppRoutes.documentTypeSelectionView);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('KYC Verification')),
      body: Center(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(AppSpacing.spacingS),
          child: Column(
            children: [
              Icon(Icons.verified_user, size: 64),
              SizedBox(height: AppSpacing.spacingL),
              AppCard(
                variant: CardVariant.secondary,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Please not the following:',
                      style: Theme.of(context).textTheme.titleLarge,
                      textAlign: TextAlign.left,
                    ),
                    SizedBox(height: AppSpacing.spacingM),
                    ChecklistItem(text: 'Ensure you have a valid ID document.'),
                    SizedBox(height: AppSpacing.spacingXs),
                    ChecklistItem(
                      text:
                          'You must be in a well-lit environment before getting started.',
                    ),
                    SizedBox(height: AppSpacing.spacingXs),
                    ChecklistItem(
                      text:
                          'Avoid wearing anything that hides or hinders your face from being seen.',
                    ),
                    SizedBox(height: AppSpacing.spacingXs),
                    ChecklistItem(
                      text:
                          'All parts of your identification must be shown properly and must be clear.',
                    ),
                  ],
                ),
              ),
              SizedBox(height: AppSpacing.spacingL),
              AppButton(
                text: 'Get Started',
                onPressed: () async {
                  await _requestPermissions(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ChecklistItem extends StatelessWidget {
  final String text;
  final IconData icon;
  final double iconSize;

  const ChecklistItem({
    super.key,
    required this.text,
    this.icon = Icons.check_circle,
    this.iconSize = 15,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: iconSize),
        SizedBox(width: AppSpacing.spacingXs),
        Expanded(
          child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
        ),
      ],
    );
  }
}
