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

  /// Greeting text in app bar
  ///
  /// In en, this message translates to:
  /// **'Hi {firstName} !'**
  String hiUser(String firstName);

  /// Retry button text
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// Jars text on button
  ///
  /// In en, this message translates to:
  /// **'Jars'**
  String get jars;

  /// Singular jar text
  ///
  /// In en, this message translates to:
  /// **'Jar'**
  String get jar;

  /// Contribute button text
  ///
  /// In en, this message translates to:
  /// **'Contribute'**
  String get contribute;

  /// Add contribution page title
  ///
  /// In en, this message translates to:
  /// **'Add contribution'**
  String get addContribution;

  /// Request button text
  ///
  /// In en, this message translates to:
  /// **'Request'**
  String get request;

  /// Info button text
  ///
  /// In en, this message translates to:
  /// **'Info'**
  String get info;

  /// More button text
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get more;

  /// Collectors card title
  ///
  /// In en, this message translates to:
  /// **'Collectors'**
  String get collectors;

  /// Contributions card title
  ///
  /// In en, this message translates to:
  /// **'Contributions'**
  String get contributions;

  /// Recent contributions section title
  ///
  /// In en, this message translates to:
  /// **'Recent Contributions'**
  String get recentContributions;

  /// Message when there are no contributions
  ///
  /// In en, this message translates to:
  /// **'No contributions yet'**
  String get noContributionsYet;

  /// Encouragement message when there are no contributions
  ///
  /// In en, this message translates to:
  /// **'Be the first to contribute to this jar!'**
  String get beTheFirstToContribute;

  /// See all button text
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get seeAll;

  /// Message shown when no jar is available
  ///
  /// In en, this message translates to:
  /// **'Create a new jar to see details here.'**
  String get createNewJarMessage;

  /// Coming soon message for contribute feature
  ///
  /// In en, this message translates to:
  /// **'Contribute feature coming soon!'**
  String get contributeFeatureComingSoon;

  /// Coming soon message for set goal feature
  ///
  /// In en, this message translates to:
  /// **'Set Goal feature coming soon!'**
  String get setGoalFeatureComingSoon;

  /// Coming soon message for contribution details
  ///
  /// In en, this message translates to:
  /// **'Contribution details coming soon!'**
  String get contributionDetailsComingSoon;

  /// Coming soon message for viewing all contributions
  ///
  /// In en, this message translates to:
  /// **'View all {count} contributions coming soon!'**
  String viewAllContributionsComingSoon(int count);

  /// Error message when refresh times out
  ///
  /// In en, this message translates to:
  /// **'Refresh timed out'**
  String get refreshTimedOut;

  /// Goal text for progress card
  ///
  /// In en, this message translates to:
  /// **'Goal'**
  String get goal;

  /// Goal amount text showing progress
  ///
  /// In en, this message translates to:
  /// **'of {currency}{amount}'**
  String goalAmountOf(String currency, String amount);

  /// Error message for invalid amount input
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid amount'**
  String get pleaseEnterValidAmount;

  /// Deadline text with date
  ///
  /// In en, this message translates to:
  /// **'Deadline {date}'**
  String deadlineDate(String date);

  /// Days remaining text
  ///
  /// In en, this message translates to:
  /// **'{days} days left'**
  String daysLeft(int days);

  /// Text shown when deadline has passed
  ///
  /// In en, this message translates to:
  /// **'Overdue'**
  String get overdue;

  /// Text shown when the goal amount has been reached or exceeded
  ///
  /// In en, this message translates to:
  /// **'Goal Reached'**
  String get goalReached;

  /// Error message when fetching a contribution fails
  ///
  /// In en, this message translates to:
  /// **'Failed to fetch contribution.'**
  String get failedToFetchContribution;

  /// Payment status: pending
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get paymentStatusPending;

  /// Payment status: completed
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get paymentStatusCompleted;

  /// Payment status: failed
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get paymentStatusFailed;

  /// Payment status: transferred
  ///
  /// In en, this message translates to:
  /// **'Transferred'**
  String get paymentStatusTransferred;

  /// Preposition used in time expressions like 'Jan 15, 2025 at 2:30 PM'
  ///
  /// In en, this message translates to:
  /// **'at'**
  String get at;

  /// Percentage completion text
  ///
  /// In en, this message translates to:
  /// **'{percentage}% completed'**
  String percentageCompleted(String percentage);

  /// Message when no goal is set
  ///
  /// In en, this message translates to:
  /// **'You do not have a goal set yet.'**
  String get noGoalSetYet;

  /// Set goal button text
  ///
  /// In en, this message translates to:
  /// **'Set Goal'**
  String get setGoal;

  /// Anonymous contributor name
  ///
  /// In en, this message translates to:
  /// **'Anonymous'**
  String get anonymous;

  /// Single day ago text
  ///
  /// In en, this message translates to:
  /// **'{days} day ago'**
  String dayAgo(int days);

  /// Multiple days ago text
  ///
  /// In en, this message translates to:
  /// **'{days} days ago'**
  String daysAgo(int days);

  /// Single hour ago text
  ///
  /// In en, this message translates to:
  /// **'{hours} hour ago'**
  String hourAgo(int hours);

  /// Multiple hours ago text
  ///
  /// In en, this message translates to:
  /// **'{hours} hours ago'**
  String hoursAgo(int hours);

  /// Single minute ago text
  ///
  /// In en, this message translates to:
  /// **'{minutes} minute ago'**
  String minuteAgo(int minutes);

  /// Multiple minutes ago text
  ///
  /// In en, this message translates to:
  /// **'{minutes} minutes ago'**
  String minutesAgo(int minutes);

  /// Just now timestamp text
  ///
  /// In en, this message translates to:
  /// **'Just now'**
  String get justNow;

  /// Error message when jar summary reload fails
  ///
  /// In en, this message translates to:
  /// **'Failed to reload jar summary'**
  String get failedToReloadJarSummary;

  /// Error message when jar summary loading fails
  ///
  /// In en, this message translates to:
  /// **'Failed to load jar summary'**
  String get failedToLoadJarSummary;

  /// Error message when setting current jar fails
  ///
  /// In en, this message translates to:
  /// **'Failed to set current jar. Please try again.'**
  String get failedToSetCurrentJar;

  /// Error message for unexpected errors while setting current jar
  ///
  /// In en, this message translates to:
  /// **'An unexpected error occurred while setting current jar'**
  String get unexpectedErrorSettingCurrentJar;

  /// Generic unexpected error message with error details
  ///
  /// In en, this message translates to:
  /// **'An unexpected error occurred: {error}'**
  String unexpectedErrorOccurred(String error);

  /// Create new jar button text
  ///
  /// In en, this message translates to:
  /// **'Create new jar'**
  String get createNewJar;

  /// Coming soon message for create jar feature
  ///
  /// In en, this message translates to:
  /// **'Create jar feature coming soon!'**
  String get createJarFeatureComingSoon;

  /// Default user name fallback
  ///
  /// In en, this message translates to:
  /// **'User'**
  String get user;

  /// Anonymous user name with last 4 digits of phone number
  ///
  /// In en, this message translates to:
  /// **'User {digits}'**
  String userWithLastDigits(String digits);

  /// Request contribution screen title
  ///
  /// In en, this message translates to:
  /// **'Request Contribution'**
  String get requestContribution;

  /// Text showing what the QR code is for
  ///
  /// In en, this message translates to:
  /// **'Scan to get contribution'**
  String get scanToGetContribution;

  /// Text indicating anyone can contribute
  ///
  /// In en, this message translates to:
  /// **'by anyone'**
  String get byAnyone;

  /// Share link button text
  ///
  /// In en, this message translates to:
  /// **'Share Link'**
  String get shareLink;

  /// Copy link button text
  ///
  /// In en, this message translates to:
  /// **'Copy Link'**
  String get copyLink;

  /// Instructions for using the QR code
  ///
  /// In en, this message translates to:
  /// **'Share this QR code with contributors so they can easily access your jar and make contributions.'**
  String get qrCodeInstructions;

  /// Subject line when sharing jar link
  ///
  /// In en, this message translates to:
  /// **'Contribute to {jarName}'**
  String contributeToJar(String jarName);

  /// Success message when link is copied
  ///
  /// In en, this message translates to:
  /// **'Link copied to clipboard'**
  String get linkCopiedToClipboard;

  /// Error message when sharing fails
  ///
  /// In en, this message translates to:
  /// **'Failed to share link'**
  String get failedToShareLink;

  /// Error message when copying fails
  ///
  /// In en, this message translates to:
  /// **'Failed to copy link'**
  String get failedToCopyLink;

  /// Share button text
  ///
  /// In en, this message translates to:
  /// **'Share'**
  String get share;

  /// Instructions for scanning QR code
  ///
  /// In en, this message translates to:
  /// **'Scan the QR code to contribute'**
  String get scanTheQRCodeToContribute;

  /// Share message when sharing a specific jar
  ///
  /// In en, this message translates to:
  /// **'Help me reach my goal for \"{jarName}\"! Contribute here: {paymentLink}'**
  String shareJarMessage(String jarName, String paymentLink);

  /// Share message when jar name is not available
  ///
  /// In en, this message translates to:
  /// **'Help me reach my goal! Contribute here: {paymentLink}'**
  String shareGenericMessage(String paymentLink);

  /// Success message when jar summary is retrieved
  ///
  /// In en, this message translates to:
  /// **'Jar summary retrieved successfully'**
  String get jarSummaryRetrievedSuccessfully;

  /// Error message when jar data parsing fails
  ///
  /// In en, this message translates to:
  /// **'Failed to parse jar data'**
  String get failedToParseJarData;

  /// Error message for model parsing issues
  ///
  /// In en, this message translates to:
  /// **'Model parsing error: {error}'**
  String modelParsingError(String error);

  /// Error message when jar summary retrieval fails
  ///
  /// In en, this message translates to:
  /// **'Failed to retrieve jar summary'**
  String get failedToRetrieveJarSummary;

  /// Error message for unexpected errors during jar summary retrieval
  ///
  /// In en, this message translates to:
  /// **'An unexpected error occurred while retrieving jar summary'**
  String get unexpectedErrorRetrievingJarSummary;

  /// Close button text
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// Create jar button text
  ///
  /// In en, this message translates to:
  /// **'Create Jar'**
  String get createJar;

  /// Error message when jar loading fails
  ///
  /// In en, this message translates to:
  /// **'Error loading jars'**
  String get errorLoadingJars;

  /// Message when no jars are available
  ///
  /// In en, this message translates to:
  /// **'No jars found'**
  String get noJarsFound;

  /// Encouragement message for first jar creation
  ///
  /// In en, this message translates to:
  /// **'Create your first jar to get started'**
  String get createYourFirstJar;

  /// Message when a jar group is empty
  ///
  /// In en, this message translates to:
  /// **'No jars in this group'**
  String get noJarsInThisGroup;

  /// Message for initial state before loading jars
  ///
  /// In en, this message translates to:
  /// **'Tap to load your jars'**
  String get tapToLoadYourJars;

  /// Title text for jar creation screen
  ///
  /// In en, this message translates to:
  /// **'Set up your jar'**
  String get setUpYourJar;

  /// Label for jar name input field
  ///
  /// In en, this message translates to:
  /// **'Jar Name'**
  String get jarName;

  /// Placeholder text for jar name input field
  ///
  /// In en, this message translates to:
  /// **'Enter jar name'**
  String get enterJarName;

  /// Label for currency field
  ///
  /// In en, this message translates to:
  /// **'Currency'**
  String get currency;

  /// Label for collaborators section
  ///
  /// In en, this message translates to:
  /// **'Collaborators'**
  String get collaborators;

  /// Invite button text
  ///
  /// In en, this message translates to:
  /// **'Invite'**
  String get invite;

  /// Error message when jar name field is empty
  ///
  /// In en, this message translates to:
  /// **'Jar name cannot be empty'**
  String get jarNameCannotBeEmpty;

  /// Error message when no jar group is selected
  ///
  /// In en, this message translates to:
  /// **'Please select a jar group'**
  String get pleaseSelectJarGroup;

  /// Title for jar group picker dialog
  ///
  /// In en, this message translates to:
  /// **'Select Jar Group'**
  String get selectJarGroup;

  /// Menu option to change jar name
  ///
  /// In en, this message translates to:
  /// **'Change name'**
  String get changeName;

  /// Menu option to change jar image
  ///
  /// In en, this message translates to:
  /// **'Change jar image'**
  String get changeJarImage;

  /// Menu option to set initial jar image
  ///
  /// In en, this message translates to:
  /// **'Set jar image'**
  String get setJarImage;

  /// Title for edit jar name screen
  ///
  /// In en, this message translates to:
  /// **'Edit Jar Name'**
  String get editJarName;

  /// Success message when jar name is updated
  ///
  /// In en, this message translates to:
  /// **'Jar name updated successfully'**
  String get jarNameUpdatedSuccessfully;

  /// Hint text for jar name input field
  ///
  /// In en, this message translates to:
  /// **'Enter new jar name'**
  String get enterNewJarName;

  /// Generic save button text
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// Title for edit jar description screen
  ///
  /// In en, this message translates to:
  /// **'Edit Jar Description'**
  String get editJarDescription;

  /// Success message when jar description is updated
  ///
  /// In en, this message translates to:
  /// **'Jar description updated successfully'**
  String get jarDescriptionUpdatedSuccessfully;

  /// Hint text for jar description input field
  ///
  /// In en, this message translates to:
  /// **'{jarName} needs a story to tell and grow.'**
  String jarDescriptionHint(String jarName);

  /// Generic error label
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// Message when jar data is not available
  ///
  /// In en, this message translates to:
  /// **'No jar data available'**
  String get noJarDataAvailable;

  /// Title when jar is broken
  ///
  /// In en, this message translates to:
  /// **'Jar Broken'**
  String get jarBroken;

  /// Description shown when jar is broken
  ///
  /// In en, this message translates to:
  /// **'The jar has been permanently broken and can no longer be accessed.'**
  String get jarBrokenDescription;

  /// Generic okay button text
  ///
  /// In en, this message translates to:
  /// **'Okay'**
  String get okay;

  /// Action to break a jar
  ///
  /// In en, this message translates to:
  /// **'Break jar'**
  String get breakJar;

  /// Confirmation message before breaking a jar
  ///
  /// In en, this message translates to:
  /// **'Once the jar is broken, you will permanently lose access to it.'**
  String get breakJarConfirmationMessage;

  /// Button text to confirm breaking
  ///
  /// In en, this message translates to:
  /// **'Break'**
  String get breakButton;

  /// Default jar group when none specified
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get other;

  /// Label for jar group field
  ///
  /// In en, this message translates to:
  /// **'Jar group'**
  String get jarGroup;

  /// Text shown when information is not available
  ///
  /// In en, this message translates to:
  /// **'N/A'**
  String get notAvailable;

  /// Status label
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// Label for description field
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get description;

  /// Message when no description is provided
  ///
  /// In en, this message translates to:
  /// **'No description available'**
  String get noDescriptionAvailable;

  /// Label asking if jar has fixed contribution amount
  ///
  /// In en, this message translates to:
  /// **'is Fixed Contribution?'**
  String get isFixedContribution;

  /// Label for fixed contribution amount field
  ///
  /// In en, this message translates to:
  /// **'Fixed contribution Amount'**
  String get fixedContributionAmount;

  /// Success message when fixed contribution amount is updated
  ///
  /// In en, this message translates to:
  /// **'Jar fixed contribution amount updated successfully'**
  String get fixedContributionAmountUpdatedSuccessfully;

  /// Action to reopen a sealed jar
  ///
  /// In en, this message translates to:
  /// **'Reopen jar'**
  String get reopenJar;

  /// Action to seal a jar
  ///
  /// In en, this message translates to:
  /// **'Seal jar'**
  String get sealJar;

  /// Message explaining what happens when jar is reopened
  ///
  /// In en, this message translates to:
  /// **'People will be able to contribute to this jar again'**
  String get reopenJarMessage;

  /// Message explaining what happens when jar is sealed
  ///
  /// In en, this message translates to:
  /// **'People will be no longer able to contribute to this jar until it is reopened'**
  String get sealJarMessage;

  /// Button text to reopen jar
  ///
  /// In en, this message translates to:
  /// **'Reopen'**
  String get reopen;

  /// Button text to seal jar
  ///
  /// In en, this message translates to:
  /// **'Seal'**
  String get seal;

  /// Success message when jar is created
  ///
  /// In en, this message translates to:
  /// **'Jar created successfully'**
  String get jarCreatedSuccessfully;

  /// Unknown label
  ///
  /// In en, this message translates to:
  /// **'Unknown'**
  String get unknown;

  /// Title for invite collectors screen
  ///
  /// In en, this message translates to:
  /// **'Invite collectors'**
  String get inviteCollaborators;

  /// Placeholder text for contact search input
  ///
  /// In en, this message translates to:
  /// **'Search contacts...'**
  String get searchContacts;

  /// Button text to retry an action
  ///
  /// In en, this message translates to:
  /// **'Try Again'**
  String get tryAgain;

  /// Section header for recent contacts
  ///
  /// In en, this message translates to:
  /// **'Recent'**
  String get recent;

  /// Section header for other contacts
  ///
  /// In en, this message translates to:
  /// **'Other contacts'**
  String get otherContacts;

  /// Message when no contacts match search query
  ///
  /// In en, this message translates to:
  /// **'No contacts found for \"{searchQuery}\"'**
  String noContactsFoundFor(String searchQuery);

  /// Message when no contacts are available
  ///
  /// In en, this message translates to:
  /// **'No contacts found'**
  String get noContactsFound;

  /// Error message when contacts cannot be loaded
  ///
  /// In en, this message translates to:
  /// **'Error loading contacts. Please check app permissions.'**
  String get errorLoadingContacts;

  /// Default text for unnamed contact
  ///
  /// In en, this message translates to:
  /// **'Contact'**
  String get contact;

  /// Done button text
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// Button text to open app settings
  ///
  /// In en, this message translates to:
  /// **'Open Settings'**
  String get openSettings;

  /// Error message when trying to select more than 4 collectors
  ///
  /// In en, this message translates to:
  /// **'Maximum 4 collectors can be selected'**
  String get maximumCollaboratorsSelected;

  /// Error message when contacts permission is permanently denied
  ///
  /// In en, this message translates to:
  /// **'Contacts permission is permanently denied. Please enable it in Settings > Privacy & Security > Contacts.'**
  String get contactsPermissionPermanentlyDenied;

  /// Error message when contacts permission is not granted
  ///
  /// In en, this message translates to:
  /// **'Contacts permission is required to invite collectors.'**
  String get contactsPermissionRequired;

  /// Error message when there's an issue requesting contacts permission
  ///
  /// In en, this message translates to:
  /// **'Error requesting contacts permission: {error}'**
  String errorRequestingContactsPermission(String error);

  /// Placeholder text for currency search input
  ///
  /// In en, this message translates to:
  /// **'Search currencies...'**
  String get searchCurrencies;

  /// Title for currency selection dialog
  ///
  /// In en, this message translates to:
  /// **'Select Currency'**
  String get selectCurrency;

  /// Section header for currently selected currency
  ///
  /// In en, this message translates to:
  /// **'Selected Currency'**
  String get selectedCurrency;

  /// Section header for available currencies list
  ///
  /// In en, this message translates to:
  /// **'Available Currencies'**
  String get availableCurrencies;

  /// Nigerian Naira currency name
  ///
  /// In en, this message translates to:
  /// **'Nigerian Naira'**
  String get currencyNGN;

  /// Ghanaian Cedi currency name
  ///
  /// In en, this message translates to:
  /// **'Ghanaian Cedi'**
  String get currencyGHC;

  /// US Dollar currency name
  ///
  /// In en, this message translates to:
  /// **'US Dollar'**
  String get currencyUSD;

  /// Euro currency name
  ///
  /// In en, this message translates to:
  /// **'Euro'**
  String get currencyEUR;

  /// British Pound currency name
  ///
  /// In en, this message translates to:
  /// **'British Pound'**
  String get currencyGBP;

  /// Button text to change currency selection
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get change;

  /// Error message when jar creation fails
  ///
  /// In en, this message translates to:
  /// **'Failed to create jar'**
  String get failedToCreateJar;

  /// Title for image upload bottom sheet
  ///
  /// In en, this message translates to:
  /// **'Upload Image'**
  String get uploadImage;

  /// Option to take photo with camera
  ///
  /// In en, this message translates to:
  /// **'Take Photo'**
  String get takePhoto;

  /// Description for take photo option
  ///
  /// In en, this message translates to:
  /// **'Use camera to take a photo'**
  String get useCameraToTakePhoto;

  /// Option to choose image from gallery
  ///
  /// In en, this message translates to:
  /// **'Choose from Gallery'**
  String get chooseFromGallery;

  /// Description for gallery selection option
  ///
  /// In en, this message translates to:
  /// **'Select an image from your gallery'**
  String get selectImageFromGallery;

  /// Loading text when uploading image
  ///
  /// In en, this message translates to:
  /// **'Uploading image...'**
  String get uploadingImage;

  /// Error message when image upload fails
  ///
  /// In en, this message translates to:
  /// **'Upload failed'**
  String get uploadFailed;

  /// Category name for funeral-related jars
  ///
  /// In en, this message translates to:
  /// **'Funeral'**
  String get categoryFuneral;

  /// Category name for party-related jars
  ///
  /// In en, this message translates to:
  /// **'Parties'**
  String get categoryParties;

  /// Category name for trip-related jars
  ///
  /// In en, this message translates to:
  /// **'Trips'**
  String get categoryTrips;

  /// Category name for wedding-related jars
  ///
  /// In en, this message translates to:
  /// **'Weddings'**
  String get categoryWeddings;

  /// Category name for saving group jars
  ///
  /// In en, this message translates to:
  /// **'Saving groups'**
  String get categorySavingGroups;

  /// Category name for other types of jars
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get categoryOther;

  /// Title for request payment screen
  ///
  /// In en, this message translates to:
  /// **'Request Payment'**
  String get requestPayment;

  /// Label for amount section
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get amount;

  /// Label for payment method selection
  ///
  /// In en, this message translates to:
  /// **'Payment Method'**
  String get paymentMethod;

  /// Mobile Money payment method option
  ///
  /// In en, this message translates to:
  /// **'Mobile Money'**
  String get paymentMethodMobileMoney;

  /// Cash payment method option
  ///
  /// In en, this message translates to:
  /// **'Cash'**
  String get paymentMethodCash;

  /// Bank Transfer payment method option
  ///
  /// In en, this message translates to:
  /// **'Bank Transfer'**
  String get paymentMethodBankTransfer;

  /// Label for mobile money operator selection
  ///
  /// In en, this message translates to:
  /// **'Operator'**
  String get operator;

  /// Label for mobile money number input
  ///
  /// In en, this message translates to:
  /// **'Mobile Money Number'**
  String get mobileMoneyNumber;

  /// Placeholder for mobile money number input
  ///
  /// In en, this message translates to:
  /// **'Enter mobile money number'**
  String get enterMobileMoneyNumber;

  /// Label for contributor name input
  ///
  /// In en, this message translates to:
  /// **'Contributor Name'**
  String get contributorName;

  /// Placeholder for contributor name input
  ///
  /// In en, this message translates to:
  /// **'Enter contributor name'**
  String get enterContributorName;

  /// Label for account name input
  ///
  /// In en, this message translates to:
  /// **'Account Name'**
  String get accountName;

  /// Placeholder for account name input
  ///
  /// In en, this message translates to:
  /// **'Enter account name'**
  String get enterAccountName;

  /// Text shown when processing request
  ///
  /// In en, this message translates to:
  /// **'Processing...'**
  String get processing;

  /// Button text for saving contribution
  ///
  /// In en, this message translates to:
  /// **'Save Contribution'**
  String get saveContribution;

  /// Error message for missing contributor name
  ///
  /// In en, this message translates to:
  /// **'Please enter contributor name'**
  String get pleaseEnterContributorName;

  /// Error message for missing mobile money number
  ///
  /// In en, this message translates to:
  /// **'Please enter your mobile money number for Mobile Money payments'**
  String get pleaseEnterMobileMoneyNumber;

  /// Error message for invalid mobile money number
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid mobile money number (e.g., 0241234567)'**
  String get pleaseEnterValidMobileMoneyNumber;

  /// Error message for missing account name
  ///
  /// In en, this message translates to:
  /// **'Please enter account name'**
  String get pleaseEnterAccountName;

  /// Success message when payment request is sent
  ///
  /// In en, this message translates to:
  /// **'Payment request sent successfully!'**
  String get paymentRequestSentSuccessfully;

  /// Error message when payment request fails
  ///
  /// In en, this message translates to:
  /// **'Failed to send payment request.'**
  String get failedToSendPaymentRequest;

  /// Generic unknown error message
  ///
  /// In en, this message translates to:
  /// **'Unknown error'**
  String get unknownError;

  /// Generic unexpected error message
  ///
  /// In en, this message translates to:
  /// **'An unexpected error occurred'**
  String get unexpectedError;

  /// Charges label
  ///
  /// In en, this message translates to:
  /// **'Charges'**
  String get charges;

  /// Via payment link label
  ///
  /// In en, this message translates to:
  /// **'Via Payment Link'**
  String get viaPaymentLink;

  /// Contributor label
  ///
  /// In en, this message translates to:
  /// **'Contributor'**
  String get contributor;

  /// Contributor phone number label
  ///
  /// In en, this message translates to:
  /// **'Contributor Phone Number'**
  String get contributorPhoneNumber;

  /// Account number label
  ///
  /// In en, this message translates to:
  /// **'Account Number'**
  String get accountNumber;

  /// Collector label
  ///
  /// In en, this message translates to:
  /// **'Collector'**
  String get collector;

  /// Help label
  ///
  /// In en, this message translates to:
  /// **'Help'**
  String get help;

  /// Coming soon label
  ///
  /// In en, this message translates to:
  /// **'Coming soon'**
  String get comingSoon;

  /// Jar goal page title
  ///
  /// In en, this message translates to:
  /// **'Jar Goal'**
  String get jarGoal;

  /// Remove goal button text
  ///
  /// In en, this message translates to:
  /// **'Remove Goal'**
  String get removeGoal;

  /// Cancel button text
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// Deadline label
  ///
  /// In en, this message translates to:
  /// **'Deadline'**
  String get deadline;

  /// Instruction text for setting deadline
  ///
  /// In en, this message translates to:
  /// **'Tap calendar button to set deadline'**
  String get tapCalendarButtonToSetDeadline;

  /// Error message when jar goal update fails
  ///
  /// In en, this message translates to:
  /// **'Failed to update jar goal'**
  String get failedToUpdateJarGoal;

  /// Active status label
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get active;

  /// Pending status label
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pending;

  /// Remind button text
  ///
  /// In en, this message translates to:
  /// **'Remind'**
  String get remind;

  /// SMS message template for collector invitation
  ///
  /// In en, this message translates to:
  /// **'Hi! 👋, I invite you to be a collector for \"{jarName}\" jar.\n\nAs a collector, you\'ll help collect contributions on behalf of this jar.\n\nJoin now: {jarLink}\n\nDownload Konto app to start helping collect contributions!\n\nHappy saving! 💰'**
  String smsInvitationMessage(String jarName, String jarLink);

  /// SMS message template for collector reminder
  ///
  /// In en, this message translates to:
  /// **'🔔 Reminder:\n\n{inviterName} is waiting for you to join \"{jarName}\" jar!\n\nJoin here: {jarLink}\n\nDon\'t miss out on this savings opportunity!\n\nDownload Konto app now 📱'**
  String smsReminderMessage(String inviterName, String jarName, String jarLink);
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
