// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'Konto';

  @override
  String get login => 'Connexion';

  @override
  String get createAccount => 'Créer un compte';

  @override
  String get phoneNumber => 'Numéro de téléphone';

  @override
  String get loginSubtitle =>
      'Connectez-vous pour collecter, contribuer ou\nsuivre en toute confiance.';

  @override
  String get onboardingTitle1 => 'Créer avec\nObjectif';

  @override
  String get onboardingDescription1 =>
      'Configurez un pot en quelques secondes pour collecter des fonds pour les mariages, funérailles, anniversaires, etc.';

  @override
  String get onboardingTitle2 => 'Donner avec\nConfiance';

  @override
  String get onboardingDescription2 =>
      'Soutenez vos proches avec des contributions sécurisées et transparentes.';

  @override
  String get onboardingTitle3 => 'Suivre Chaque\nContribution';

  @override
  String get onboardingDescription3 =>
      'Voyez qui a contribué, combien, et soyez averti quand vous atteignez votre objectif.';

  @override
  String get next => 'Suivant';

  @override
  String get continueText => 'Continuer';

  @override
  String get homePageComingSoon => 'Page d\'accueil - Bientôt disponible';

  @override
  String get searchCountries => 'Rechercher des pays';

  @override
  String get recentSelection => 'Sélection récente';

  @override
  String get selectedCountry => 'Pays sélectionné';

  @override
  String get otherCountries => 'Autres pays';

  @override
  String get otherResults => 'Autres résultats';

  @override
  String get searchResults => 'Résultats de recherche';

  @override
  String get noCountriesFound => 'Aucun pays trouvé';

  @override
  String get countryGhana => 'Ghana';

  @override
  String get countryNigeria => 'Nigéria';

  @override
  String get countryUnitedStates => 'États-Unis';

  @override
  String get countryFrance => 'France';

  @override
  String get countryGermany => 'Allemagne';

  @override
  String get dragUpToExpand => 'Glissez vers le haut pour développer';

  @override
  String get searchOptions => 'Rechercher des options...';

  @override
  String get allOptions => 'Toutes les options';

  @override
  String get noOptionsFound => 'Aucune option trouvée';

  @override
  String get bySigningUpYouAgree => 'En vous inscrivant, vous acceptez nos ';

  @override
  String get termsAndConditions => 'Conditions d\'utilisation';

  @override
  String get and => ' et ';

  @override
  String get privacyPolicy => 'Politique de confidentialité';

  @override
  String get fullName => 'Nom complet';

  @override
  String get email => 'Email';

  @override
  String get country => 'Pays';

  @override
  String get register => 'S\'inscrire';

  @override
  String get phoneNumberPlaceholder => 'Numéro de téléphone';

  @override
  String get enterOtp => 'Entrer le code OTP';

  @override
  String otpSubtitle(String contactType) {
    return 'Nous avons envoyé un code à 6 chiffres à votre $contactType';
  }

  @override
  String get phoneNumberContactType => 'numéro de téléphone';

  @override
  String get emailContactType => 'adresse e-mail';

  @override
  String get contactType => 'contact';

  @override
  String get didntReceiveCode => 'Vous n\'avez pas reçu le code ? ';

  @override
  String get resend => 'Renvoyer';

  @override
  String resendIn(int seconds) {
    return 'Renvoyer dans ${seconds}s';
  }

  @override
  String get resendMessage =>
      'Demande d\'un nouveau code. Si vous obtenez \"trop de demandes\", attendez 15-30 minutes.';

  @override
  String get verificationSuccessful => 'Vérification réussie !';

  @override
  String get verificationCodeSent =>
      'Code de vérification envoyé avec succès !';

  @override
  String get checking => 'Vérification...';

  @override
  String get pleaseEnterPhoneNumber => 'Veuillez saisir un numéro de téléphone';

  @override
  String get pleaseEnterFullName => 'Veuillez saisir votre nom complet';

  @override
  String get pleaseEnterEmailAddress => 'Veuillez saisir votre adresse e-mail';

  @override
  String get pleaseEnterPhoneNumberRegister =>
      'Veuillez saisir votre numéro de téléphone';

  @override
  String get accountAlreadyExists => 'Le compte existe déjà';

  @override
  String get errorCheckingPhoneAvailability =>
      'Erreur lors de la vérification de la disponibilité du téléphone';

  @override
  String get failedToCheckPhoneNumber =>
      'Impossible de vérifier la disponibilité du numéro de téléphone. Échec de la connexion';

  @override
  String get loginFailed => 'Échec de la connexion';

  @override
  String get registrationFailed => 'Échec de l\'inscription';

  @override
  String get failedToSignOut => 'Échec de la déconnexion';

  @override
  String get otpDoesNotMatch =>
      'Le code OTP ne correspond pas au code envoyé. Veuillez réessayer.';

  @override
  String get failedToSendVerificationCode =>
      'Échec de l\'envoi du code de vérification';

  @override
  String get failedToSendVerificationCodeTryAgain =>
      'Échec de l\'envoi du code de vérification. Veuillez réessayer.';

  @override
  String otpSmsMessage(String otp, int minutes) {
    return 'Votre code de vérification Konto est : $otp. Valable pendant $minutes minutes. Ne partagez pas ce code.';
  }
}
