/// Phone validation utility for Ghana phone numbers
class PhoneValidationUtils {
  /// Valid Ghana mobile network prefixes (without the leading 0)
  /// MTN: 24, 54, 55, 59
  /// Vodafone: 20, 50
  /// AirtelTigo: 26, 27, 56, 57
  /// Glo: 23
  static const List<String> _validGhanaPrefixes = [
    '20', '23', '24', '26', '27', // First digit 2
    '50', '54', '55', '56', '57', '59', // First digit 5
  ];

  /// Validates a Ghana phone number
  ///
  /// Accepts formats:
  /// - 0XXXXXXXXX (10 digits starting with 0)
  /// - XXXXXXXXX (9 digits without leading 0)
  /// - +233XXXXXXXXX (9 digits after +233)
  /// - 233XXXXXXXXX (9 digits after 233)
  ///
  /// Returns true if the phone number is valid for Ghana
  static bool isValidGhanaPhoneNumber(String phoneNumber) {
    if (phoneNumber.isEmpty) {
      return false;
    }

    // Remove all spaces and special characters except + at the start
    String cleaned = phoneNumber.trim().replaceAll(RegExp(r'[\s\-\(\)]'), '');

    // Handle different formats
    String digitsOnly;

    if (cleaned.startsWith('+233')) {
      // Format: +233XXXXXXXXX
      digitsOnly = cleaned.substring(4);
    } else if (cleaned.startsWith('233')) {
      // Format: 233XXXXXXXXX
      digitsOnly = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      // Format: 0XXXXXXXXX - remove leading 0
      digitsOnly = cleaned.substring(1);
    } else {
      // Format: XXXXXXXXX (already without prefix)
      digitsOnly = cleaned;
    }

    // Must be exactly 9 digits
    if (digitsOnly.length != 9) {
      return false;
    }

    // Must contain only digits
    if (!RegExp(r'^[0-9]+$').hasMatch(digitsOnly)) {
      return false;
    }

    // Check if the first two digits match a valid Ghana mobile prefix
    String prefix = digitsOnly.substring(0, 2);
    return _validGhanaPrefixes.contains(prefix);
  }

  /// Normalizes a Ghana phone number to the format: 0XXXXXXXXX
  ///
  /// Returns the phone number in local format (with leading 0)
  /// Returns empty string if the phone number is invalid
  static String normalizeToLocalFormat(String phoneNumber) {
    if (!isValidGhanaPhoneNumber(phoneNumber)) {
      return '';
    }

    String cleaned = phoneNumber.trim().replaceAll(RegExp(r'[\s\-\(\)]'), '');
    String digitsOnly;

    if (cleaned.startsWith('+233')) {
      digitsOnly = cleaned.substring(4);
    } else if (cleaned.startsWith('233')) {
      digitsOnly = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      digitsOnly = cleaned.substring(1);
    } else {
      digitsOnly = cleaned;
    }

    return '0$digitsOnly';
  }

  /// Normalizes a Ghana phone number to international format: +233XXXXXXXXX
  ///
  /// Returns the phone number with +233 prefix (without leading 0)
  /// Returns empty string if the phone number is invalid
  static String normalizeToInternationalFormat(String phoneNumber) {
    if (!isValidGhanaPhoneNumber(phoneNumber)) {
      return '';
    }

    String cleaned = phoneNumber.trim().replaceAll(RegExp(r'[\s\-\(\)]'), '');
    String digitsOnly;

    if (cleaned.startsWith('+233')) {
      return cleaned; // Already in correct format
    } else if (cleaned.startsWith('233')) {
      return '+$cleaned';
    } else if (cleaned.startsWith('0')) {
      digitsOnly = cleaned.substring(1);
    } else {
      digitsOnly = cleaned;
    }

    return '+233$digitsOnly';
  }

  /// Gets the mobile network name from a Ghana phone number
  ///
  /// Returns the network name (MTN, Vodafone, AirtelTigo, Glo) or 'Unknown'
  static String getNetworkName(String phoneNumber) {
    if (!isValidGhanaPhoneNumber(phoneNumber)) {
      return 'Unknown';
    }

    String cleaned = phoneNumber.trim().replaceAll(RegExp(r'[\s\-\(\)]'), '');
    String digitsOnly;

    if (cleaned.startsWith('+233')) {
      digitsOnly = cleaned.substring(4);
    } else if (cleaned.startsWith('233')) {
      digitsOnly = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      digitsOnly = cleaned.substring(1);
    } else {
      digitsOnly = cleaned;
    }

    String prefix = digitsOnly.substring(0, 2);

    switch (prefix) {
      case '24':
      case '54':
      case '55':
      case '59':
        return 'MTN';
      case '20':
      case '50':
        return 'Vodafone';
      case '26':
      case '27':
      case '56':
      case '57':
        return 'AirtelTigo';
      case '23':
        return 'Glo';
      default:
        return 'Unknown';
    }
  }

  /// Returns a user-friendly error message for invalid Ghana phone numbers
  static String getValidationErrorMessage() {
    return 'Please enter a valid Ghana mobile number (e.g., 0241234567)';
  }

  /// Returns a detailed error message explaining why a phone number is invalid
  static String getDetailedValidationError(String phoneNumber) {
    if (phoneNumber.isEmpty) {
      return 'Phone number is required';
    }

    String cleaned = phoneNumber.trim().replaceAll(RegExp(r'[\s\-\(\)]'), '');
    String digitsOnly;

    if (cleaned.startsWith('+233')) {
      digitsOnly = cleaned.substring(4);
    } else if (cleaned.startsWith('233')) {
      digitsOnly = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      digitsOnly = cleaned.substring(1);
    } else {
      digitsOnly = cleaned;
    }

    if (!RegExp(r'^[0-9]+$').hasMatch(digitsOnly)) {
      return 'Phone number must contain only digits';
    }

    if (digitsOnly.length < 9) {
      return 'Phone number is too short (must be 9 digits after prefix)';
    }

    if (digitsOnly.length > 9) {
      return 'Phone number is too long (must be 9 digits after prefix)';
    }

    String prefix = digitsOnly.substring(0, 2);
    if (!_validGhanaPrefixes.contains(prefix)) {
      return 'Invalid network prefix. Must start with: 020, 023, 024, 026, 027, 050, 054, 055, 056, 057, or 059';
    }

    return 'Invalid phone number';
  }
}
