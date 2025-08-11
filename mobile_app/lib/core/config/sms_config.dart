// SMS Configuration - Store your Mnotify credentials here
class SmsConfig {
  // Mnotify API key
  static const String mnotifyApiKey = 'A67zyKtxltxoH5iTDgz671wMD';
  
  // TODO: Replace with your approved sender ID from Mnotify
  static const String senderId = 'perple'; // Max 8 characters for Ghana
  
  // Mnotify API endpoints
  static const String baseUrl = 'https://api.mnotify.com/api/sms/quick';
  // OTP settings
  static const int otpLength = 6;
  static const int otpValidityMinutes = 5;
  
  // Message template
  static String getOtpMessage(String otp) {
    return 'Your Konto verification code is: $otp. Valid for $otpValidityMinutes minutes. Do not share this code.';
  }
}



