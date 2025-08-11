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
}
