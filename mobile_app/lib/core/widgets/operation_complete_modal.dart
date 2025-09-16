import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/button.dart';

class OperationCompleteModal extends StatelessWidget {
  /// The image to display at the center
  final Widget image;

  /// The title text to display below the image
  final String title;

  /// Optional subtitle/description text
  final String? subtitle;

  /// Optional button text (defaults to "Done")
  final String? buttonText;

  /// Callback when the button is pressed
  final VoidCallback? onButtonPressed;

  const OperationCompleteModal({
    super.key,
    required this.image,
    required this.title,
    this.subtitle,
    this.buttonText,
    this.onButtonPressed,
  });

  /// Show the modal as a full-page modal
  static Future<void> show(
    BuildContext context, {
    required Widget image,
    required String title,
    String? subtitle,
    String? buttonText,
    VoidCallback? onButtonPressed,
  }) {
    return Navigator.of(context).push<void>(
      PageRouteBuilder<void>(
        pageBuilder: (context, animation, secondaryAnimation) {
          return OperationCompleteModal(
            image: image,
            title: title,
            subtitle: subtitle,
            buttonText: buttonText,
            onButtonPressed:
                onButtonPressed ?? () => Navigator.of(context).pop(),
          );
        },
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(0.0, 1.0);
          const end = Offset.zero;
          const curve = Curves.ease;

          var tween = Tween(
            begin: begin,
            end: end,
          ).chain(CurveTween(curve: curve));

          return SlideTransition(
            position: animation.drive(tween),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
        barrierDismissible: false,
        fullscreenDialog: true,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.spacingL),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Spacer(),

              // Image at the center
              Container(width: 120, height: 120, child: image),

              const SizedBox(height: AppSpacing.spacingL),

              // Title text
              Text(
                title,
                style: TextStyles.titleBoldLg,
                textAlign: TextAlign.center,
              ),

              // Subtitle text (optional)
              if (subtitle != null) ...[
                const SizedBox(height: AppSpacing.spacingS),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.spacingL,
                  ),
                  child: Text(
                    subtitle!,
                    style: TextStyles.titleRegularM,
                    textAlign: TextAlign.center,
                  ),
                ),
              ],

              const Spacer(),

              // Button at the bottom
              SizedBox(
                width: double.infinity,
                child: AppButton(
                  onPressed: onButtonPressed,
                  text: buttonText ?? 'Done',
                ),
              ),

              const SizedBox(height: AppSpacing.spacingL),
            ],
          ),
        ),
      ),
    );
  }
}

/// Predefined success modal
class SuccessModal extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? buttonText;
  final VoidCallback? onButtonPressed;

  const SuccessModal({
    super.key,
    required this.title,
    this.subtitle,
    this.buttonText,
    this.onButtonPressed,
  });

  static Future<void> show(
    BuildContext context, {
    required String title,
    String? subtitle,
    String? buttonText,
    VoidCallback? onButtonPressed,
  }) {
    return OperationCompleteModal.show(
      context,
      image: Container(
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check, size: 60, color: Colors.green),
      ),
      title: title,
      subtitle: subtitle,
      buttonText: buttonText,
      onButtonPressed: onButtonPressed,
    );
  }

  @override
  Widget build(BuildContext context) {
    return OperationCompleteModal(
      image: Container(
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check, size: 60, color: Colors.green),
      ),
      title: title,
      subtitle: subtitle,
      buttonText: buttonText,
      onButtonPressed: onButtonPressed,
    );
  }
}

/// Predefined error modal
class ErrorModal extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? buttonText;
  final VoidCallback? onButtonPressed;

  const ErrorModal({
    super.key,
    required this.title,
    this.subtitle,
    this.buttonText,
    this.onButtonPressed,
  });

  static Future<void> show(
    BuildContext context, {
    required String title,
    String? subtitle,
    String? buttonText,
    VoidCallback? onButtonPressed,
  }) {
    return OperationCompleteModal.show(
      context,
      image: Container(
        decoration: BoxDecoration(
          color: Colors.red.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.error, size: 60, color: Colors.red),
      ),
      title: title,
      subtitle: subtitle,
      buttonText: buttonText,
      onButtonPressed: onButtonPressed,
    );
  }

  @override
  Widget build(BuildContext context) {
    return OperationCompleteModal(
      image: Container(
        decoration: BoxDecoration(
          color: Colors.red.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.error, size: 60, color: Colors.red),
      ),
      title: title,
      subtitle: subtitle,
      buttonText: buttonText,
      onButtonPressed: onButtonPressed,
    );
  }
}
