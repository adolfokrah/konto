import 'package:flutter/material.dart';
import 'package:Hoga/core/widgets/language_switcher.dart';
import 'package:Hoga/l10n/app_localizations.dart';

class LocalizationExample extends StatefulWidget {
  const LocalizationExample({super.key});

  @override
  State<LocalizationExample> createState() => _LocalizationExampleState();
}

class _LocalizationExampleState extends State<LocalizationExample> {
  Locale _currentLocale = const Locale('en');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.appTitle),
        actions: [
          LanguageSwitcher(
            currentLocale: _currentLocale,
            onLocaleChanged: (Locale newLocale) {
              setState(() {
                _currentLocale = newLocale;
              });
              // In a real app, you'd update this through a state management solution
              // like BLoC, Provider, or Riverpod
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              AppLocalizations.of(context)!.login,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 20),
            Text(
              AppLocalizations.of(context)!.loginSubtitle,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
