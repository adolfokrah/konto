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
  String get pleaseEnterFullName => 'Veuillez entrer votre nom complet';

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
    return 'Votre code de vérification Hoga est : $otp. Valable pendant $minutes minutes. Ne partagez pas ce code.';
  }

  @override
  String hiUser(String firstName) {
    return 'Salut $firstName !';
  }

  @override
  String get retry => 'Réessayer';

  @override
  String get jars => 'Pots';

  @override
  String get jar => 'Pot';

  @override
  String get contribute => 'Contribuer';

  @override
  String get addContribution => 'Ajouter une contribution';

  @override
  String get request => 'Demander';

  @override
  String get info => 'Info';

  @override
  String get more => 'Plus';

  @override
  String get collectors => 'Collecteurs';

  @override
  String get updatingJar => 'Mise à jour du pot...';

  @override
  String get themeSettingsTitle => 'Paramètres du thème';

  @override
  String get updatingThemeSettings => 'Mise à jour des paramètres du thème...';

  @override
  String get updatingLanguageSettings =>
      'Mise à jour des paramètres de la langue...';

  @override
  String get theme => 'Thème';

  @override
  String get language => 'Langue';

  @override
  String get notifications => 'Notifications';

  @override
  String get appSettings => 'Paramètres de l\'application';

  @override
  String get light => 'Clair';

  @override
  String get dark => 'Sombre';

  @override
  String get system => 'Système';

  @override
  String get contributions => 'Contributions';

  @override
  String get searchContributions => 'Rechercher des contributions';

  @override
  String amountToBeTransferred(String currency, String amount) {
    return '$currency$amount à transférer';
  }

  @override
  String get balanceBreakdown => 'Répartition du Solde';

  @override
  String get balanceBreakdownDescription =>
      'Voici une répartition détaillée du solde de votre pot, des contributions et de ce que nous vous devons.';

  @override
  String get cash => 'Espèces';

  @override
  String get bankTransfer => 'Virement bancaire';

  @override
  String get mobileMoney => 'Mobile money';

  @override
  String contributionsCount(int count) {
    return '$count Contributions';
  }

  @override
  String get totalContributions => 'Total des Contributions';

  @override
  String get totalTransfers => 'Total des Virements';

  @override
  String get totalWeOweYou => 'Total que nous vous devons';

  @override
  String get transfersNote =>
      'Remarque : Les virements excluent les contributions en espèces et par virement bancaire';

  @override
  String get selectDateRange => 'Sélectionner la Plage de Dates';

  @override
  String get jarFilter => 'Filtre de pot';

  @override
  String get clearAll => 'Tout effacer';

  @override
  String get selectAll => 'Tout sélectionner';

  @override
  String get paymentMethod => 'Méthode de paiement';

  @override
  String get status => 'Statut';

  @override
  String get collector => 'Collecteur';

  @override
  String get date => 'Date';

  @override
  String get selectDate => 'Sélectionner une date';

  @override
  String get filter => 'Filtrer';

  @override
  String get mobileMoneyPayment => 'Mobile money';

  @override
  String get cashPayment => 'Espèces';

  @override
  String get bankTransferPayment => 'Virement bancaire';

  @override
  String get cardPayment => 'Carte';

  @override
  String get applePayPayment => 'Apple Pay';

  @override
  String get statusPending => 'En attente';

  @override
  String get statusCompleted => 'Terminé';

  @override
  String get statusFailed => 'Échoué';

  @override
  String get statusTransferred => 'Transféré';

  @override
  String get dateAll => 'Tout';

  @override
  String get dateToday => 'Aujourd\'hui';

  @override
  String get dateYesterday => 'Hier';

  @override
  String get dateLast7Days => '7 derniers jours';

  @override
  String get dateLast30Days => '30 derniers jours';

  @override
  String get dateCustomRange => 'Plage personnalisée';

  @override
  String get today => 'Aujourd\'hui';

  @override
  String get yesterday => 'Hier';

  @override
  String get recentContributions => 'Transactions Récentes';

  @override
  String get noContributionsYet => 'Aucune contribution pour l\'instant';

  @override
  String get noContributionsFound => 'Aucune contribution trouvée';

  @override
  String get beTheFirstToContribute =>
      'Soyez le premier à contribuer à ce pot !';

  @override
  String get seeAll => 'Voir tout';

  @override
  String get createNewJarMessage =>
      'Créez un nouveau pot pour voir les détails ici.';

  @override
  String get contributeFeatureComingSoon =>
      'Fonctionnalité de contribution bientôt disponible !';

  @override
  String get setGoalFeatureComingSoon =>
      'Fonctionnalité de définition d\'objectif bientôt disponible !';

  @override
  String get contributionDetailsComingSoon =>
      'Détails de contribution bientôt disponibles !';

  @override
  String viewAllContributionsComingSoon(int count) {
    return 'Voir toutes les $count contributions bientôt disponible !';
  }

  @override
  String get refreshTimedOut => 'Délai d\'actualisation dépassé';

  @override
  String get goal => 'Objectif';

  @override
  String goalAmountOf(String currency, String amount) {
    return 'sur $currency$amount';
  }

  @override
  String get pleaseEnterValidAmount => 'Veuillez saisir un montant valide';

  @override
  String deadlineDate(String date) {
    return 'Échéance $date';
  }

  @override
  String daysLeft(int days) {
    return '$days jours restants';
  }

  @override
  String get overdue => 'En retard';

  @override
  String get goalReached => 'Objectif Atteint';

  @override
  String get failedToFetchContribution =>
      'Échec de la récupération de la contribution.';

  @override
  String get paymentStatusPending => 'En attente';

  @override
  String get paymentStatusCompleted => 'Terminé';

  @override
  String get paymentStatusFailed => 'Échoué';

  @override
  String get paymentStatusTransferred => 'Transféré';

  @override
  String get momoPaymentSuccessful => 'Paiement réussi ! ✅';

  @override
  String get momoPaymentFailed => 'Paiement échoué ❌';

  @override
  String get momoCompleteAuthorization =>
      'Veuillez terminer le processus d\'autorisation sur votre téléphone mobile';

  @override
  String get momoDontClosePage => 'Veuillez ne pas fermer cette page.';

  @override
  String get momoEnterVoucherCode => 'Entrez le code de bon';

  @override
  String get momoSubmitVoucher => 'Soumettre le bon';

  @override
  String get momoValidVoucherCodeRequired =>
      'Veuillez entrer un code de bon valide';

  @override
  String get momoWaitingAuthorization =>
      'En attente de l\'autorisation du contributeur pour le paiement...';

  @override
  String get momoPaymentFailedTryAgain =>
      'Le paiement a échoué. Veuillez réessayer.';

  @override
  String get transferredTo => 'Transféré à';

  @override
  String get at => 'à';

  @override
  String percentageCompleted(String percentage) {
    return '$percentage% terminé';
  }

  @override
  String get noGoalSetYet => 'Vous n\'avez pas encore défini d\'objectif.';

  @override
  String get setGoal => 'Définir un objectif';

  @override
  String get anonymous => 'Inconnu';

  @override
  String dayAgo(int days) {
    return 'Il y a $days jour';
  }

  @override
  String daysAgo(int days) {
    return 'Il y a $days jours';
  }

  @override
  String hourAgo(int hours) {
    return 'Il y a $hours heure';
  }

  @override
  String hoursAgo(int hours) {
    return 'Il y a $hours heures';
  }

  @override
  String minuteAgo(int minutes) {
    return 'Il y a $minutes minute';
  }

  @override
  String minutesAgo(int minutes) {
    return 'Il y a $minutes minutes';
  }

  @override
  String get justNow => 'À l\'instant';

  @override
  String get failedToReloadJarSummary =>
      'Échec du rechargement du résumé du pot';

  @override
  String get failedToLoadJarSummary => 'Échec du chargement du résumé du pot';

  @override
  String get failedToSetCurrentJar =>
      'Échec de la définition du pot actuel. Veuillez réessayer.';

  @override
  String get unexpectedErrorSettingCurrentJar =>
      'Une erreur inattendue s\'est produite lors de la définition du pot actuel';

  @override
  String unexpectedErrorOccurred(String error) {
    return 'Une erreur inattendue s\'est produite';
  }

  @override
  String get createNewJar => 'Créer un nouveau pot';

  @override
  String get createJarFeatureComingSoon =>
      'Fonctionnalité de création de pot bientôt disponible !';

  @override
  String get user => 'Utilisateur';

  @override
  String userWithLastDigits(String digits) {
    return 'Utilisateur $digits';
  }

  @override
  String get requestContribution => 'Demander une Contribution';

  @override
  String get scanToGetContribution => 'Scanner pour obtenir une contribution';

  @override
  String get byAnyone => 'par n\'importe qui';

  @override
  String get shareLink => 'Partager le Lien';

  @override
  String get copyLink => 'Copier le Lien';

  @override
  String get qrCodeInstructions =>
      'Partagez ce code QR avec les contributeurs pour qu\'ils puissent facilement accéder à votre pot et faire des contributions.';

  @override
  String contributeToJar(String jarName) {
    return 'Contribuer à $jarName';
  }

  @override
  String get linkCopiedToClipboard => 'Lien copié dans le presse-papier';

  @override
  String get failedToShareLink => 'Échec du partage du lien';

  @override
  String get failedToCopyLink => 'Échec de la copie du lien';

  @override
  String get share => 'Partager';

  @override
  String get scanTheQRCodeToContribute => 'Scannez le code QR pour contribuer';

  @override
  String shareJarMessage(String jarName, String paymentLink) {
    return 'Aidez-moi à atteindre mon objectif pour \"$jarName\"! Contribuez ici: $paymentLink';
  }

  @override
  String shareGenericMessage(String paymentLink) {
    return 'Aidez-moi à atteindre mon objectif! Contribuez ici: $paymentLink';
  }

  @override
  String get jarSummaryRetrievedSuccessfully =>
      'Résumé du jar récupéré avec succès';

  @override
  String get failedToParseJarData => 'Échec de l\'analyse des données du jar';

  @override
  String modelParsingError(String error) {
    return 'Erreur d\'analyse du modèle: $error';
  }

  @override
  String get failedToRetrieveJarSummary =>
      'Échec de la récupération du résumé du jar';

  @override
  String get unexpectedErrorRetrievingJarSummary =>
      'Une erreur inattendue s\'est produite lors de la récupération du résumé du jar';

  @override
  String get close => 'Fermer';

  @override
  String get createJar => 'Créer un Pot';

  @override
  String get errorLoadingJars => 'Erreur lors du chargement des pots';

  @override
  String get noJarsFound => 'Aucun pot trouvé';

  @override
  String get createYourFirstJar => 'Créez votre premier pot pour commencer';

  @override
  String get noJarsInThisGroup => 'Aucun pot dans ce groupe';

  @override
  String get tapToLoadYourJars => 'Appuyez pour charger vos pots';

  @override
  String get setUpYourJar => 'Configurez votre pot';

  @override
  String get jarName => 'Nom du Pot';

  @override
  String get enterJarName => 'Entrez le nom du pot';

  @override
  String get currency => 'Devise';

  @override
  String get collaborators => 'Collaborateurs';

  @override
  String get invite => 'Inviter';

  @override
  String get jarNameCannotBeEmpty => 'Le nom du pot ne peut pas être vide';

  @override
  String get pleaseSelectJarGroup => 'Veuillez sélectionner un groupe de pot';

  @override
  String get selectJarGroup => 'Sélectionner un Groupe de Pot';

  @override
  String get changeName => 'Changer le nom';

  @override
  String get changeJarImage => 'Changer l\'image du pot';

  @override
  String get setJarImage => 'Définir l\'image du pot';

  @override
  String get editJarName => 'Modifier le Nom du Pot';

  @override
  String get jarNameUpdatedSuccessfully => 'Nom du pot mis à jour avec succès';

  @override
  String get enterNewJarName => 'Entrez le nouveau nom du pot';

  @override
  String get save => 'Enregistrer';

  @override
  String get editJarDescription => 'Modifier la Description du Pot';

  @override
  String get jarDescriptionUpdatedSuccessfully =>
      'Description du pot mise à jour avec succès';

  @override
  String jarDescriptionHint(String jarName) {
    return '$jarName a besoin d\'une histoire à raconter et à faire grandir.';
  }

  @override
  String get error => 'Erreur';

  @override
  String get noJarDataAvailable => 'Aucune donnée de pot disponible';

  @override
  String get jarBroken => 'Pot Cassé';

  @override
  String get jarBrokenDescription =>
      'Le pot a été cassé de façon permanente et ne peut plus être accessible.';

  @override
  String get okay => 'D\'accord';

  @override
  String get breakJar => 'Casser le pot';

  @override
  String get breakJarConfirmationMessage =>
      'Une fois le pot cassé, vous perdrez définitivement l\'accès à celui-ci.';

  @override
  String get breakButton => 'Casser';

  @override
  String get other => 'Autre';

  @override
  String get jarGroup => 'Groupe de pot';

  @override
  String get notAvailable => 'N/A';

  @override
  String get description => 'Description';

  @override
  String get noDescriptionAvailable => 'Aucune description disponible';

  @override
  String get isFixedContribution => 'Contribution fixe ?';

  @override
  String get fixedContributionAmount => 'Montant de contribution fixe';

  @override
  String get fixedContributionAmountUpdatedSuccessfully =>
      'Montant de contribution fixe du pot mis à jour avec succès';

  @override
  String get reopenJar => 'Rouvrir le pot';

  @override
  String get sealJar => 'Sceller le pot';

  @override
  String get reopenJarMessage =>
      'Les gens pourront à nouveau contribuer à ce pot';

  @override
  String get sealJarMessage =>
      'Les gens ne pourront plus contribuer à ce pot jusqu\'à ce qu\'il soit rouvert';

  @override
  String get reopen => 'Rouvrir';

  @override
  String get seal => 'Sceller';

  @override
  String get jarCreatedSuccessfully => 'Pot créé avec succès';

  @override
  String get unknown => 'Inconnu';

  @override
  String get inviteCollaborators => 'Inviter des collaborateurs';

  @override
  String get searchContacts => 'Rechercher des contacts...';

  @override
  String get tryAgain => 'Réessayer';

  @override
  String get recent => 'Récent';

  @override
  String get otherContacts => 'Autres contacts';

  @override
  String noContactsFoundFor(String searchQuery) {
    return 'Aucun contact trouvé pour \"$searchQuery\"';
  }

  @override
  String get noContactsFound => 'Aucun contact trouvé';

  @override
  String get errorLoadingContacts =>
      'Erreur lors du chargement des contacts. Veuillez vérifier les autorisations de l\'application.';

  @override
  String get contact => 'Contact';

  @override
  String get done => 'Terminé';

  @override
  String get openSettings => 'Ouvrir les paramètres';

  @override
  String get maximumCollaboratorsSelected =>
      'Maximum 4 collaborateurs peuvent être sélectionnés';

  @override
  String get contactsPermissionPermanentlyDenied =>
      'L\'autorisation d\'accès aux contacts est définitivement refusée. Veuillez l\'activer dans Paramètres > Confidentialité et sécurité > Contacts.';

  @override
  String get contactsPermissionRequired =>
      'L\'autorisation d\'accès aux contacts est requise pour inviter des collaborateurs.';

  @override
  String errorRequestingContactsPermission(String error) {
    return 'Erreur lors de la demande d\'autorisation d\'accès aux contacts : $error';
  }

  @override
  String get searchCurrencies => 'Rechercher des devises...';

  @override
  String get selectCurrency => 'Sélectionner la devise';

  @override
  String get selectedCurrency => 'Devise sélectionnée';

  @override
  String get availableCurrencies => 'Devises disponibles';

  @override
  String get currencyNGN => 'Naira nigérian';

  @override
  String get currencyGHS => 'Cedi ghanéen';

  @override
  String get currencyUSD => 'Dollar américain';

  @override
  String get currencyEUR => 'Euro';

  @override
  String get currencyGBP => 'Livre sterling';

  @override
  String get change => 'Modifier';

  @override
  String get failedToCreateJar => 'Échec de la création du pot';

  @override
  String get uploadImage => 'Télécharger une image';

  @override
  String get takePhoto => 'Prendre une photo';

  @override
  String get useCameraToTakePhoto =>
      'Utiliser l\'appareil photo pour prendre une photo';

  @override
  String get chooseFromGallery => 'Choisir dans la galerie';

  @override
  String get selectImageFromGallery =>
      'Sélectionner une image de votre galerie';

  @override
  String get uploadingImage => 'Téléchargement de l\'image...';

  @override
  String get uploadFailed => 'Échec du téléchargement';

  @override
  String get categoryFuneral => 'Funérailles';

  @override
  String get categoryParties => 'Fêtes';

  @override
  String get categoryTrips => 'Voyages';

  @override
  String get categoryWeddings => 'Mariages';

  @override
  String get categorySavingGroups => 'Groupes d\'épargne';

  @override
  String get categoryOther => 'Autre';

  @override
  String get requestPayment => 'Demander un paiement';

  @override
  String get amount => 'Montant';

  @override
  String get paymentMethodMobileMoney => 'Mobile Money';

  @override
  String get paymentMethodCash => 'Espèces';

  @override
  String get paymentMethodBankTransfer => 'Virement bancaire';

  @override
  String get operator => 'Opérateur';

  @override
  String get mobileMoneyNumber => 'Numéro Mobile Money';

  @override
  String get enterMobileMoneyNumber => 'Entrez le numéro mobile money';

  @override
  String get contributorName => 'Nom du contributeur';

  @override
  String get enterContributorName => 'Entrez le nom du contributeur';

  @override
  String get accountName => 'Nom du compte';

  @override
  String get enterAccountName => 'Entrez le nom du compte';

  @override
  String get processing => 'Traitement...';

  @override
  String get saveContribution => 'Enregistrer la contribution';

  @override
  String get pleaseEnterContributorName =>
      'Veuillez entrer le nom du contributeur';

  @override
  String get pleaseEnterMobileMoneyNumber =>
      'Veuillez entrer votre numéro mobile money pour les paiements Mobile Money';

  @override
  String get pleaseEnterValidMobileMoneyNumber =>
      'Veuillez entrer un numéro mobile money valide (ex: 0241234567)';

  @override
  String get pleaseEnterAccountName => 'Veuillez entrer le nom du compte';

  @override
  String get paymentRequestSentSuccessfully =>
      'Demande de paiement envoyée avec succès !';

  @override
  String get failedToSendPaymentRequest =>
      'Échec de l\'envoi de la demande de paiement.';

  @override
  String get unknownError => 'Erreur inconnue';

  @override
  String get unexpectedError => 'Une erreur inattendue s\'est produite';

  @override
  String get charges => 'Frais';

  @override
  String get viaPaymentLink => 'Via lien de paiement';

  @override
  String get contributor => 'Contributeur';

  @override
  String get contributorPhoneNumber => 'Numéro de téléphone du contributeur';

  @override
  String get accountNumber => 'Numéro de compte';

  @override
  String get help => 'Aide';

  @override
  String get comingSoon => 'Bientôt disponible';

  @override
  String get jarGoal => 'Objectif du Pot';

  @override
  String get removeGoal => 'Supprimer l\'objectif';

  @override
  String get cancel => 'Annuler';

  @override
  String get deadline => 'Date limite';

  @override
  String get tapCalendarButtonToSetDeadline =>
      'Appuyez sur le bouton calendrier pour définir la date limite';

  @override
  String get failedToUpdateJarGoal =>
      'Échec de la mise à jour de l\'objectif du pot';

  @override
  String get active => 'Actif';

  @override
  String get pending => 'En attente';

  @override
  String get remind => 'Rappeler';

  @override
  String smsInvitationMessage(String jarName, String jarLink) {
    return 'Salut ! 👋, je vous invite à être collecteur pour le pot \"$jarName\".\n\nEn tant que collecteur, vous aiderez à collecter les contributions au nom de ce pot.\n\nRejoignez maintenant : $jarLink\n\nTéléchargez l\'application Konto pour commencer à aider à collecter les contributions !\n\nBonnes économies ! 💰';
  }

  @override
  String smsReminderMessage(
    String inviterName,
    String jarName,
    String jarLink,
  ) {
    return '🔔 Rappel :\n\n$inviterName attend que vous rejoigniez le pot \"$jarName\" !\n\nRejoignez ici : $jarLink\n\nNe ratez pas cette opportunité d\'épargne !\n\nTéléchargez l\'application Konto maintenant 📱';
  }

  @override
  String get account => 'Compte';

  @override
  String get personalDetails => 'Détails personnels';

  @override
  String get withdrawalAccount => 'Compte de retrait';

  @override
  String get changePhoneNumber => 'Changer le numéro de téléphone';

  @override
  String get security => 'Sécurité';

  @override
  String get accountPin => 'Code PIN du compte';

  @override
  String get enableDisableBiometric => 'Activer/désactiver Face ID ou Touch ID';

  @override
  String get about => 'À propos';

  @override
  String get aboutKonto => 'À propos de Konto';

  @override
  String get socialMedia => 'Réseaux sociaux';

  @override
  String get termsOfServices => 'Conditions de service';

  @override
  String get contactUs => 'Contactez-nous';

  @override
  String get appRating => 'Évaluation de l\'app';

  @override
  String get logout => 'Déconnexion';

  @override
  String get closeAccount => 'Fermer le compte';

  @override
  String get doYouWantToLogout => 'Voulez-vous vous déconnecter ?';

  @override
  String get logoutDescription =>
      'Vous devrez vous reconnecter pour accéder à votre compte.';

  @override
  String get doYouWantToCloseAccount => 'Voulez-vous fermer le compte ?';

  @override
  String get closeAccountDescription =>
      'Cette action ne peut pas être annulée. Toutes vos données seront définitivement supprimées.';

  @override
  String get comingSoonTitle => 'Bientôt disponible';

  @override
  String get comingSoonDescription =>
      'Cette fonctionnalité sera disponible dans une prochaine mise à jour.';

  @override
  String get editProfile => 'Modifier le profil';

  @override
  String get personalInformation => 'Informations personnelles';

  @override
  String get updateAccount => 'Mettre à jour le compte';

  @override
  String get profileUpdatedSuccessfully => 'Profil mis à jour avec succès !';

  @override
  String get personalDetailsUpdatedSuccessfully =>
      'Détails personnels mis à jour avec succès !';

  @override
  String get reVerificationWarning =>
      'Lors de la mise à jour de votre nom complet ou de votre pays, vous devez effectuer une re-vérification de compte pour confirmer l\'exactitude de vos informations.';

  @override
  String get phoneNumberUpdatedSuccessfully =>
      'Numéro de téléphone mis à jour avec succès';

  @override
  String get ok => 'OK';

  @override
  String get bank => 'Banque';

  @override
  String get accountHolderName => 'Nom du titulaire du compte';

  @override
  String get pleaseEnterAccountNumber => 'Veuillez entrer le numéro de compte';

  @override
  String get pleaseSelectBank => 'Veuillez sélectionner une banque';

  @override
  String get withdrawalAccountUpdatedSuccessfully =>
      'Compte de retrait mis à jour avec succès';

  @override
  String get contributionsTransferredAutomatically =>
      'Remarque: Les contributions mobile money seront automatiquement transférées vers ce compte.';

  @override
  String get contributorPaid => 'Contributeur payé';

  @override
  String get platformCharge => 'Frais de plateforme';

  @override
  String get paymentProcessing => 'Traitement de paiement';

  @override
  String get transferFee => 'Frais de transfert';

  @override
  String get chargeBreakdown => 'Répartition des frais';
}
