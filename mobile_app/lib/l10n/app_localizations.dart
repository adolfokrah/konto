import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('fr'),
  ];

  /// The title of the application
  ///
  /// In en, this message translates to:
  /// **'Konto'**
  String get appTitle;

  /// Login button text
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// Create account button text
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// Phone number input placeholder
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get phoneNumber;

  /// Login page subtitle
  ///
  /// In en, this message translates to:
  /// **'Sign in to collect, contribute, or\ntrack with confidence.'**
  String get loginSubtitle;

  /// First onboarding screen title
  ///
  /// In en, this message translates to:
  /// **'Create with\nPurpose'**
  String get onboardingTitle1;

  /// First onboarding screen description
  ///
  /// In en, this message translates to:
  /// **'Set up a jar in seconds to collect funds for weddings, funerals, birthdays, etc.'**
  String get onboardingDescription1;

  /// Second onboarding screen title
  ///
  /// In en, this message translates to:
  /// **'Give with\nConfidence'**
  String get onboardingTitle2;

  /// Second onboarding screen description
  ///
  /// In en, this message translates to:
  /// **'Support loved ones with secure and transparent contributions.'**
  String get onboardingDescription2;

  /// Third onboarding screen title
  ///
  /// In en, this message translates to:
  /// **'Track Every\nContribution'**
  String get onboardingTitle3;

  /// Third onboarding screen description
  ///
  /// In en, this message translates to:
  /// **'See who contributed, how much, and get notified when you hit your goal.'**
  String get onboardingDescription3;

  /// Next button text
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// Continue button text
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueText;

  /// Home page placeholder text
  ///
  /// In en, this message translates to:
  /// **'Home Page - Coming Soon'**
  String get homePageComingSoon;

  /// Country picker search placeholder
  ///
  /// In en, this message translates to:
  /// **'Search countries'**
  String get searchCountries;

  /// Header for recently selected country
  ///
  /// In en, this message translates to:
  /// **'Recent Selection'**
  String get recentSelection;

  /// Header for selected country in search results
  ///
  /// In en, this message translates to:
  /// **'Selected Country'**
  String get selectedCountry;

  /// Header for other countries list
  ///
  /// In en, this message translates to:
  /// **'Other Countries'**
  String get otherCountries;

  /// Header for other search results
  ///
  /// In en, this message translates to:
  /// **'Other Results'**
  String get otherResults;

  /// Header for search results
  ///
  /// In en, this message translates to:
  /// **'Search Results'**
  String get searchResults;

  /// Message when no countries match search
  ///
  /// In en, this message translates to:
  /// **'No countries found'**
  String get noCountriesFound;

  /// Country name: Ghana
  ///
  /// In en, this message translates to:
  /// **'Ghana'**
  String get countryGhana;

  /// Country name: Nigeria
  ///
  /// In en, this message translates to:
  /// **'Nigeria'**
  String get countryNigeria;

  /// Country name: United States
  ///
  /// In en, this message translates to:
  /// **'United States'**
  String get countryUnitedStates;

  /// Country name: France
  ///
  /// In en, this message translates to:
  /// **'France'**
  String get countryFrance;

  /// Country name: Germany
  ///
  /// In en, this message translates to:
  /// **'Germany'**
  String get countryGermany;

  /// Message shown when bottom sheet is too small
  ///
  /// In en, this message translates to:
  /// **'Drag up to expand'**
  String get dragUpToExpand;

  /// Search placeholder for options picker
  ///
  /// In en, this message translates to:
  /// **'Search options...'**
  String get searchOptions;

  /// Header for all options list
  ///
  /// In en, this message translates to:
  /// **'All Options'**
  String get allOptions;

  /// Message when no options match search
  ///
  /// In en, this message translates to:
  /// **'No options found'**
  String get noOptionsFound;

  /// Terms and conditions agreement text
  ///
  /// In en, this message translates to:
  /// **'By signing up you agree with our '**
  String get bySigningUpYouAgree;

  /// Terms and conditions link text
  ///
  /// In en, this message translates to:
  /// **'Terms & Conditions'**
  String get termsAndConditions;

  /// Conjunction word between terms and privacy policy
  ///
  /// In en, this message translates to:
  /// **' and '**
  String get and;

  /// Privacy policy link text
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// Full name input label
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fullName;

  /// Email input label
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// Country selection label
  ///
  /// In en, this message translates to:
  /// **'Country'**
  String get country;

  /// Register page title
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// Phone number input placeholder text
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phoneNumberPlaceholder;

  /// OTP page title
  ///
  /// In en, this message translates to:
  /// **'Enter OTP'**
  String get enterOtp;

  /// OTP page subtitle with contact type
  ///
  /// In en, this message translates to:
  /// **'We sent a 6-digit code to your {contactType}'**
  String otpSubtitle(String contactType);

  /// Contact type for phone number
  ///
  /// In en, this message translates to:
  /// **'phone number'**
  String get phoneNumberContactType;

  /// Contact type for email address
  ///
  /// In en, this message translates to:
  /// **'email address'**
  String get emailContactType;

  /// Generic contact type
  ///
  /// In en, this message translates to:
  /// **'contact'**
  String get contactType;

  /// Text before resend button
  ///
  /// In en, this message translates to:
  /// **'Didn\'t receive the code? '**
  String get didntReceiveCode;

  /// Resend button text
  ///
  /// In en, this message translates to:
  /// **'Resend'**
  String get resend;

  /// Resend countdown text
  ///
  /// In en, this message translates to:
  /// **'Resend in {seconds}s'**
  String resendIn(int seconds);

  /// Message shown when requesting resend
  ///
  /// In en, this message translates to:
  /// **'Requesting new code. If you get \"too many requests\", wait 15-30 minutes.'**
  String get resendMessage;

  /// Success message when OTP is verified
  ///
  /// In en, this message translates to:
  /// **'Verification successful!'**
  String get verificationSuccessful;

  /// Success message when resend is successful
  ///
  /// In en, this message translates to:
  /// **'Verification code sent successfully!'**
  String get verificationCodeSent;

  /// Loading text shown when checking user existence
  ///
  /// In en, this message translates to:
  /// **'Checking...'**
  String get checking;

  /// Error message when phone number is empty
  ///
  /// In en, this message translates to:
  /// **'Please enter a phone number'**
  String get pleaseEnterPhoneNumber;

  /// Error message when full name is empty
  ///
  /// In en, this message translates to:
  /// **'Please enter your full name'**
  String get pleaseEnterFullName;

  /// Error message when email address is empty
  ///
  /// In en, this message translates to:
  /// **'Please enter your email address'**
  String get pleaseEnterEmailAddress;

  /// Error message when phone number is empty in registration form
  ///
  /// In en, this message translates to:
  /// **'Please enter your phone number'**
  String get pleaseEnterPhoneNumberRegister;

  /// Error message when user tries to register with existing account
  ///
  /// In en, this message translates to:
  /// **'Account already exists'**
  String get accountAlreadyExists;

  /// Error message when phone availability check fails
  ///
  /// In en, this message translates to:
  /// **'Error checking phone availability'**
  String get errorCheckingPhoneAvailability;

  /// Error message when phone number check connection fails
  ///
  /// In en, this message translates to:
  /// **'Failed to check phone number availability. Connection failed'**
  String get failedToCheckPhoneNumber;

  /// Generic login failure message
  ///
  /// In en, this message translates to:
  /// **'Login failed'**
  String get loginFailed;

  /// Generic registration failure message
  ///
  /// In en, this message translates to:
  /// **'Registration failed'**
  String get registrationFailed;

  /// Error message when sign out fails
  ///
  /// In en, this message translates to:
  /// **'Failed to sign out'**
  String get failedToSignOut;

  /// Error message when entered OTP does not match the sent code
  ///
  /// In en, this message translates to:
  /// **'OTP does not match the sent code. Please try again.'**
  String get otpDoesNotMatch;

  /// Generic error message when verification code sending fails
  ///
  /// In en, this message translates to:
  /// **'Failed to send verification code'**
  String get failedToSendVerificationCode;

  /// Error message when verification code sending fails with retry instruction
  ///
  /// In en, this message translates to:
  /// **'Failed to send verification code. Please try again.'**
  String get failedToSendVerificationCodeTryAgain;

  /// SMS message template for OTP verification code
  ///
  /// In en, this message translates to:
  /// **'Your Konto verification code is: {otp}. Valid for {minutes} minutes. Do not share this code.'**
  String otpSmsMessage(String otp, int minutes);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
