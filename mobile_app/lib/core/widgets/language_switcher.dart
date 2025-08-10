import 'package:flutter/material.dart';
import 'package:konto/core/constants/app_spacing.dart';
import 'package:konto/core/theme/text_styles.dart';

class LanguageSwitcher extends StatelessWidget {
  final Locale currentLocale;
  final Function(Locale) onLocaleChanged;

  const LanguageSwitcher({
    super.key,
    required this.currentLocale,
    required this.onLocaleChanged,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<Locale>(
      icon: const Icon(Icons.language),
      onSelected: onLocaleChanged,
      itemBuilder: (BuildContext context) => <PopupMenuEntry<Locale>>[
        PopupMenuItem<Locale>(
          value: const Locale('en'),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🇺🇸'),
              const SizedBox(width: AppSpacing.spacingXs),
              Text(
                'English',
                style: AppTextStyles.titleMediumM.copyWith(
                  fontWeight: currentLocale.languageCode == 'en' 
                      ? FontWeight.bold 
                      : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
        PopupMenuItem<Locale>(
          value: const Locale('fr'),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🇫🇷'),
              const SizedBox(width: AppSpacing.spacingXs),
              Text(
                'Français',
                style: AppTextStyles.titleMediumM.copyWith(
                  fontWeight: currentLocale.languageCode == 'fr' 
                      ? FontWeight.bold 
                      : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
