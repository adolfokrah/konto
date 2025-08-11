# Mnotify SMS Integration Setup

## 🚀 Quick Setup

### 1. Get Mnotify Credentials
1. Sign up at [Mnotify](https://mnotify.com)
2. Get your API key from the dashboard
3. Request a Sender ID (e.g., "Konto" - max 8 characters for Ghana)

### 2. Configure Your App
1. Open `lib/core/config/sms_config.dart`
2. Replace these values:
   ```dart
   static const String mnotifyApiKey = 'your_actual_api_key_here';
   static const String senderId = 'YourApp'; // Your approved sender ID
   ```

### 3. Test SMS Sending
The SMS service will automatically:
- ✅ Generate 6-digit OTP codes
- ✅ Send via Mnotify API
- ✅ Handle success/error responses
- ✅ Work with auto SMS pickup (`sms_autofill` package)

### 4. Production Setup
For production apps, consider:
- Moving API keys to environment variables
- Adding retry logic for failed SMS
- Implementing rate limiting
- Adding SMS cost monitoring

## 🔧 API Response Handling
Mnotify typically returns:
- Success: `{status: 'success', code: '2000'}`
- Error: `{status: 'error', message: 'Error description'}`

## 📱 SMS Message Format
Default: "Your Konto verification code is: 123456. Valid for 5 minutes. Do not share this code."

You can customize this in `sms_config.dart` → `getOtpMessage()` method.
