// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Konto';

  @override
  String get login => 'Login';

  @override
  String get createAccount => 'Create Account';

  @override
  String get phoneNumber => 'Phone number';

  @override
  String get loginSubtitle =>
      'Sign in to collect, contribute, or\ntrack with confidence.';

  @override
  String get onboardingTitle1 => 'Create with\nPurpose';

  @override
  String get onboardingDescription1 =>
      'Set up a jar in seconds to collect funds for weddings, funerals, birthdays, etc.';

  @override
  String get onboardingTitle2 => 'Give with\nConfidence';

  @override
  String get onboardingDescription2 =>
      'Support loved ones with secure and transparent contributions.';

  @override
  String get onboardingTitle3 => 'Track Every\nContribution';

  @override
  String get onboardingDescription3 =>
      'See who contributed, how much, and get notified when you hit your goal.';

  @override
  String get next => 'Next';

  @override
  String get continueText => 'Continue';

  @override
  String get homePageComingSoon => 'Home Page - Coming Soon';

  @override
  String get searchCountries => 'Search countries';

  @override
  String get recentSelection => 'Recent Selection';

  @override
  String get selectedCountry => 'Selected Country';

  @override
  String get otherCountries => 'Other Countries';

  @override
  String get otherResults => 'Other Results';

  @override
  String get searchResults => 'Search Results';

  @override
  String get noCountriesFound => 'No countries found';

  @override
  String get countryGhana => 'Ghana';

  @override
  String get countryNigeria => 'Nigeria';

  @override
  String get countryUnitedStates => 'United States';

  @override
  String get countryFrance => 'France';

  @override
  String get countryGermany => 'Germany';

  @override
  String get dragUpToExpand => 'Drag up to expand';

  @override
  String get searchOptions => 'Search options...';

  @override
  String get allOptions => 'All Options';

  @override
  String get noOptionsFound => 'No options found';

  @override
  String get bySigningUpYouAgree => 'By signing up you agree with our ';

  @override
  String get termsAndConditions => 'Terms & Conditions';

  @override
  String get and => ' and ';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get fullName => 'Full name';

  @override
  String get email => 'Email';

  @override
  String get country => 'Country';

  @override
  String get register => 'Register';

  @override
  String get phoneNumberPlaceholder => 'Phone Number';

  @override
  String get enterOtp => 'Enter OTP';

  @override
  String otpSubtitle(String contactType) {
    return 'We sent a 6-digit code to your $contactType';
  }

  @override
  String get phoneNumberContactType => 'phone number';

  @override
  String get emailContactType => 'email address';

  @override
  String get contactType => 'contact';

  @override
  String get didntReceiveCode => 'Didn\'t receive the code? ';

  @override
  String get resend => 'Resend';

  @override
  String resendIn(int seconds) {
    return 'Resend in ${seconds}s';
  }

  @override
  String get resendMessage =>
      'Requesting new code. If you get \"too many requests\", wait 15-30 minutes.';

  @override
  String get verificationSuccessful => 'Verification successful!';

  @override
  String get verificationCodeSent => 'Verification code sent successfully!';

  @override
  String get checking => 'Checking...';

  @override
  String get pleaseEnterPhoneNumber => 'Please enter a phone number';

  @override
  String get pleaseEnterFullName => 'Please enter your full name';

  @override
  String get pleaseEnterEmailAddress => 'Please enter your email address';

  @override
  String get pleaseEnterPhoneNumberRegister => 'Please enter your phone number';

  @override
  String get accountAlreadyExists => 'Account already exists';

  @override
  String get errorCheckingPhoneAvailability =>
      'Error checking phone availability';

  @override
  String get failedToCheckPhoneNumber =>
      'Failed to check phone number availability. Connection failed';

  @override
  String get loginFailed => 'Login failed';

  @override
  String get registrationFailed => 'Registration failed';

  @override
  String get failedToSignOut => 'Failed to sign out';

  @override
  String get otpDoesNotMatch =>
      'OTP does not match the sent code. Please try again.';

  @override
  String get failedToSendVerificationCode => 'Failed to send verification code';

  @override
  String get failedToSendVerificationCodeTryAgain =>
      'Failed to send verification code. Please try again.';

  @override
  String otpSmsMessage(String otp, int minutes) {
    return 'Your Konto verification code is: $otp. Valid for $minutes minutes. Do not share this code.';
  }

  @override
  String hiUser(String firstName) {
    return 'Hi $firstName !';
  }

  @override
  String get retry => 'Retry';

  @override
  String get jars => 'Jars';

  @override
  String get jar => 'Jar';

  @override
  String get contribute => 'Contribute';

  @override
  String get addContribution => 'Add contribution';

  @override
  String get request => 'Request';

  @override
  String get info => 'Info';

  @override
  String get more => 'More';

  @override
  String get collectors => 'Collectors';

  @override
  String get contributions => 'Contributions';

  @override
  String get recentContributions => 'Recent Contributions';

  @override
  String get noContributionsYet => 'No contributions yet';

  @override
  String get beTheFirstToContribute =>
      'Be the first to contribute to this jar!';

  @override
  String get seeAll => 'See all';

  @override
  String get createNewJarMessage => 'Create a new jar to see details here.';

  @override
  String get contributeFeatureComingSoon => 'Contribute feature coming soon!';

  @override
  String get setGoalFeatureComingSoon => 'Set Goal feature coming soon!';

  @override
  String get contributionDetailsComingSoon =>
      'Contribution details coming soon!';

  @override
  String viewAllContributionsComingSoon(int count) {
    return 'View all $count contributions coming soon!';
  }

  @override
  String get refreshTimedOut => 'Refresh timed out';

  @override
  String get goal => 'Goal';

  @override
  String goalAmountOf(String currency, String amount) {
    return 'of $currency$amount';
  }

  @override
  String get pleaseEnterValidAmount => 'Please enter a valid amount';

  @override
  String deadlineDate(String date) {
    return 'Deadline $date';
  }

  @override
  String daysLeft(int days) {
    return '$days days left';
  }

  @override
  String get overdue => 'Overdue';

  @override
  String get at => 'at';

  @override
  String percentageCompleted(String percentage) {
    return '$percentage% completed';
  }

  @override
  String get noGoalSetYet => 'You do not have a goal set yet.';

  @override
  String get setGoal => 'Set Goal';

  @override
  String get anonymous => 'Anonymous';

  @override
  String dayAgo(int days) {
    return '$days day ago';
  }

  @override
  String daysAgo(int days) {
    return '$days days ago';
  }

  @override
  String hourAgo(int hours) {
    return '$hours hour ago';
  }

  @override
  String hoursAgo(int hours) {
    return '$hours hours ago';
  }

  @override
  String minuteAgo(int minutes) {
    return '$minutes minute ago';
  }

  @override
  String minutesAgo(int minutes) {
    return '$minutes minutes ago';
  }

  @override
  String get justNow => 'Just now';

  @override
  String get failedToReloadJarSummary => 'Failed to reload jar summary';

  @override
  String get failedToLoadJarSummary => 'Failed to load jar summary';

  @override
  String get failedToSetCurrentJar =>
      'Failed to set current jar. Please try again.';

  @override
  String get unexpectedErrorSettingCurrentJar =>
      'An unexpected error occurred while setting current jar';

  @override
  String unexpectedErrorOccurred(String error) {
    return 'An unexpected error occurred: $error';
  }

  @override
  String get createNewJar => 'Create new jar';

  @override
  String get createJarFeatureComingSoon => 'Create jar feature coming soon!';

  @override
  String get user => 'User';

  @override
  String userWithLastDigits(String digits) {
    return 'User $digits';
  }

  @override
  String get requestContribution => 'Request Contribution';

  @override
  String get scanToGetContribution => 'Scan to get contribution';

  @override
  String get byAnyone => 'by anyone';

  @override
  String get shareLink => 'Share Link';

  @override
  String get copyLink => 'Copy Link';

  @override
  String get qrCodeInstructions =>
      'Share this QR code with contributors so they can easily access your jar and make contributions.';

  @override
  String contributeToJar(String jarName) {
    return 'Contribute to $jarName';
  }

  @override
  String get linkCopiedToClipboard => 'Link copied to clipboard';

  @override
  String get failedToShareLink => 'Failed to share link';

  @override
  String get failedToCopyLink => 'Failed to copy link';

  @override
  String get share => 'Share';

  @override
  String get scanTheQRCodeToContribute => 'Scan the QR code to contribute';

  @override
  String shareJarMessage(String jarName, String paymentLink) {
    return 'Help me reach my goal for \"$jarName\"! Contribute here: $paymentLink';
  }

  @override
  String shareGenericMessage(String paymentLink) {
    return 'Help me reach my goal! Contribute here: $paymentLink';
  }

  @override
  String get jarSummaryRetrievedSuccessfully =>
      'Jar summary retrieved successfully';

  @override
  String get failedToParseJarData => 'Failed to parse jar data';

  @override
  String modelParsingError(String error) {
    return 'Model parsing error: $error';
  }

  @override
  String get failedToRetrieveJarSummary => 'Failed to retrieve jar summary';

  @override
  String get unexpectedErrorRetrievingJarSummary =>
      'An unexpected error occurred while retrieving jar summary';

  @override
  String get close => 'Close';

  @override
  String get createJar => 'Create Jar';

  @override
  String get errorLoadingJars => 'Error loading jars';

  @override
  String get noJarsFound => 'No jars found';

  @override
  String get createYourFirstJar => 'Create your first jar to get started';

  @override
  String get noJarsInThisGroup => 'No jars in this group';

  @override
  String get tapToLoadYourJars => 'Tap to load your jars';

  @override
  String get setUpYourJar => 'Set up your jar';

  @override
  String get jarName => 'Jar name';

  @override
  String get enterJarName => 'Enter jar name';

  @override
  String get currency => 'Currency';

  @override
  String get collaborators => 'Collaborators';

  @override
  String get invite => 'Invite';

  @override
  String get jarNameCannotBeEmpty => 'Jar name cannot be empty';

  @override
  String get pleaseSelectJarGroup => 'Please select a jar group';

  @override
  String get jarCreatedSuccessfully => 'Jar created successfully';

  @override
  String get unknown => 'Unknown';

  @override
  String get inviteCollaborators => 'Invite collaborators';

  @override
  String get searchContacts => 'Search contacts...';

  @override
  String get tryAgain => 'Try Again';

  @override
  String get recent => 'Recent';

  @override
  String get otherContacts => 'Other contacts';

  @override
  String noContactsFoundFor(String searchQuery) {
    return 'No contacts found for \"$searchQuery\"';
  }

  @override
  String get noContactsFound => 'No contacts found';

  @override
  String get errorLoadingContacts =>
      'Error loading contacts. Please check app permissions.';

  @override
  String get contact => 'Contact';

  @override
  String get done => 'Done';

  @override
  String get openSettings => 'Open Settings';

  @override
  String get maximumCollaboratorsSelected =>
      'Maximum 4 collaborators can be selected';

  @override
  String get contactsPermissionPermanentlyDenied =>
      'Contacts permission is permanently denied. Please enable it in Settings > Privacy & Security > Contacts.';

  @override
  String get contactsPermissionRequired =>
      'Contacts permission is required to invite collaborators.';

  @override
  String errorRequestingContactsPermission(String error) {
    return 'Error requesting contacts permission: $error';
  }

  @override
  String get searchCurrencies => 'Search currencies...';

  @override
  String get selectCurrency => 'Select Currency';

  @override
  String get selectedCurrency => 'Selected Currency';

  @override
  String get availableCurrencies => 'Available Currencies';

  @override
  String get currencyNGN => 'Nigerian Naira';

  @override
  String get currencyGHC => 'Ghanaian Cedi';

  @override
  String get currencyUSD => 'US Dollar';

  @override
  String get currencyEUR => 'Euro';

  @override
  String get currencyGBP => 'British Pound';

  @override
  String get change => 'Change';

  @override
  String get failedToCreateJar => 'Failed to create jar';

  @override
  String get uploadImage => 'Upload Image';

  @override
  String get takePhoto => 'Take Photo';

  @override
  String get useCameraToTakePhoto => 'Use camera to take a photo';

  @override
  String get chooseFromGallery => 'Choose from Gallery';

  @override
  String get selectImageFromGallery => 'Select an image from your gallery';

  @override
  String get uploadingImage => 'Uploading image...';

  @override
  String get uploadFailed => 'Upload failed';

  @override
  String get categoryFuneral => 'Funeral';

  @override
  String get categoryParties => 'Parties';

  @override
  String get categoryTrips => 'Trips';

  @override
  String get categoryWeddings => 'Weddings';

  @override
  String get categorySavingGroups => 'Saving groups';

  @override
  String get categoryOther => 'Other';
}
