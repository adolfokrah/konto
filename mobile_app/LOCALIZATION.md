# Localization in Konto App

This guide explains how to use and extend the localization system implemented in the Konto app.

## 🌍 Overview

The app now supports multiple languages using Flutter's official internationalization system. Currently supported languages:
- **English (en)** - Default
- **French (fr)** - Example second language

## 📁 File Structure

```
lib/
├── l10n/
│   ├── app_en.arb          # English translations
│   ├── app_fr.arb          # French translations
│   ├── app_localizations.dart          # Generated localization file
│   ├── app_localizations_en.dart       # Generated English file
│   └── app_localizations_fr.dart       # Generated French file
├── core/
│   ├── constants/
│   │   └── localized_onboarding_data.dart  # Localized onboarding data
│   └── widgets/
│       ├── language_switcher.dart      # Language picker widget
│       └── localization_example.dart   # Example usage
└── main.dart                           # App with localization setup
```

## 🚀 How to Use Localization in Your Widgets

### 1. Import the localization package

```dart
import 'package:konto/l10n/app_localizations.dart';
```

### 2. Use localized strings in your widgets

```dart
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    
    return Text(localizations.login); // Will show "Login" or "Connexion"
  }
}
```

### 3. Available localized strings

All available strings are defined in the ARB files. Here are the current ones:

```dart
localizations.appTitle           // "Konto"
localizations.login              // "Login" / "Connexion"  
localizations.createAccount      // "Create Account" / "Créer un compte"
localizations.phoneNumber        // "Phone number" / "Numéro de téléphone"
localizations.loginSubtitle      // Login page subtitle
localizations.onboardingTitle1   // First onboarding title
localizations.onboardingDescription1  // First onboarding description
localizations.next               // "Next" / "Suivant"
localizations.continueText       // "Continue" / "Continuer"
// ... and more
```

## ➕ Adding New Languages

### 1. Create a new ARB file

Create `lib/l10n/app_[language_code].arb` (e.g., `app_es.arb` for Spanish):

```json
{
  "appTitle": "Konto",
  "login": "Iniciar Sesión",
  "createAccount": "Crear Cuenta",
  "phoneNumber": "Número de teléfono",
  // ... add all other keys with Spanish translations
}
```

### 2. Update supported locales in main.dart

```dart
supportedLocales: const [
  Locale('en'), // English
  Locale('fr'), // French  
  Locale('es'), // Spanish - Add this
],
```

### 3. Regenerate localization files

```bash
flutter pub get
```

## 🔧 Adding New Strings

### 1. Add to the template file (app_en.arb)

```json
{
  "myNewString": "My new string",
  "@myNewString": {
    "description": "Description of what this string is for"
  }
}
```

### 2. Add to all other language files

Add the same key with translated values to `app_fr.arb`, `app_es.arb`, etc.

### 3. Regenerate

```bash
flutter pub get
```

### 4. Use in your code

```dart
Text(AppLocalizations.of(context)!.myNewString)
```

## 🎯 Language Switching

### Using the Language Switcher Widget

```dart
import 'package:konto/core/widgets/language_switcher.dart';

// In your AppBar or wherever you want the language picker
LanguageSwitcher(
  currentLocale: _currentLocale,
  onLocaleChanged: (Locale newLocale) {
    // Handle locale change
    // In a real app, you'd use state management (BLoC, Provider, etc.)
    setState(() {
      _currentLocale = newLocale;
    });
  },
)
```

### With State Management (Recommended)

For production apps, implement language switching with BLoC or Provider:

```dart
// Example with BLoC
class LocaleBloc extends Bloc<LocaleEvent, LocaleState> {
  LocaleBloc() : super(LocaleState(locale: Locale('en')));
  
  // Handle locale change events
}
```

## 🏗️ Architecture Notes

### Localized Data Classes

For complex data like onboarding content, create localized data classes:

```dart
class LocalizedOnboardingData {
  static List<OnBoardingData> getOnboardingData(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    
    return [
      OnBoardingData(
        title: localizations.onboardingTitle1,
        description: localizations.onboardingDescription1,
        // ... other properties
      ),
      // ... more onboarding slides
    ];
  }
}
```

### Best Practices

1. **Always include context**: Localization methods need BuildContext
2. **Use descriptive keys**: `loginButtonText` is better than `button1`  
3. **Group related strings**: Use prefixes like `onboarding_`, `auth_`, etc.
4. **Add descriptions**: Use @-annotations in ARB files for translator context
5. **Handle plurals**: Use ICU syntax for plural forms when needed

### Pluralization Example

```json
{
  "itemCount": "{count, plural, =0{No items} =1{1 item} other{{count} items}}",
  "@itemCount": {
    "description": "Number of items",
    "placeholders": {
      "count": {
        "type": "int"
      }
    }
  }
}
```

## 🔧 Configuration Files

### l10n.yaml
```yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
```

### pubspec.yaml
```yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.20.2

flutter:
  generate: true
```

## 🚀 Getting Started

1. The localization system is already set up in your app
2. Your login and onboarding pages are already localized
3. You can immediately start adding new strings following the patterns above
4. Use the `LanguageSwitcher` widget to test different languages

That's it! Your app now has a clean, maintainable localization system following Flutter best practices.
