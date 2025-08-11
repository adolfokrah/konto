# Firebase Phone Authentication Integration Guide

## ✅ Setup Complete

### 1. Firebase Console Setup (Required)
- [x] Enable Phone Authentication in Firebase Console
- [ ] Add SHA-1 hash: `67:D9:C0:B1:D5:4B:29:47:C7:20:0B:DC:00:95:13:CF:3F:3A:74:40`
- [x] iOS Push Notifications configured
- [x] Android configuration ready

### 2. Code Implementation (Complete)
- [x] Firebase Auth dependencies added
- [x] Phone authentication service created
- [x] Authentication bloc implemented
- [x] Verification bloc updated with Firebase
- [x] Login view updated to use Firebase
- [x] OTP view updated to handle verification

## 🚀 How to Use

### Step 1: Complete Firebase Console Setup
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Authentication > Sign-in method
4. Enable "Phone" as a sign-in provider
5. Go to Project Settings > General
6. Add your SHA-1 hash: `67:D9:C0:B1:D5:4B:29:47:C7:20:0B:DC:00:95:13:CF:3F:3A:74:40`

### Step 2: Test the Implementation
1. Run your app: `flutter run`
2. Navigate to the login screen
3. Enter a phone number (use international format)
4. Tap "Login"
5. You should receive an SMS with a verification code
6. Enter the code on the OTP screen
7. If successful, you'll be authenticated

### Step 3: Testing with Firebase Test Numbers (Optional)
For testing without sending real SMS:
1. In Firebase Console > Authentication > Sign-in method
2. Scroll down to "Phone numbers for testing"
3. Add a test phone number (e.g., +1 650-555-3434) with test code (e.g., 123456)
4. Use these in your app for testing

## 📁 Files Created/Modified

### New Files:
- `lib/core/services/phone_auth_service.dart` - Phone authentication service
- `lib/features/authentication/logic/bloc/auth_bloc.dart` - Authentication bloc
- `lib/features/authentication/logic/bloc/auth_event.dart` - Auth events
- `lib/features/authentication/logic/bloc/auth_state.dart` - Auth states

### Modified Files:
- `lib/main.dart` - Added AuthBloc provider
- `lib/features/verification/logic/bloc/verification_bloc.dart` - Updated with Firebase
- `lib/features/verification/logic/bloc/verification_event.dart` - Added phone auth events
- `lib/features/verification/logic/bloc/verification_state.dart` - Added new states
- `lib/features/authentication/presentation/views/login_view.dart` - Firebase integration
- `lib/features/verification/presentation/pages/otp_view.dart` - Updated for Firebase
- `ios/Runner/Runner.entitlements` - Added push notifications entitlement

## 🛠 Usage Examples

### 1. Login Flow
```dart
// User enters phone number and taps login
context.read<AuthBloc>().add(
  PhoneNumberSubmitted(
    phoneNumber: '+1234567890',
    countryCode: '+1',
  ),
);
```

### 2. OTP Verification
```dart
// User enters OTP code
context.read<VerificationBloc>().add(
  OtpSubmitted('123456'),
);
```

### 3. Check Authentication State
```dart
// Check if user is logged in
context.read<AuthBloc>().add(AuthStateChecked());
```

### 4. Sign Out
```dart
// Sign out user
context.read<AuthBloc>().add(SignOutRequested());
```

## 🔧 Customization

### Phone Number Formatting
The `PhoneAuthService.formatPhoneNumber()` method automatically formats phone numbers to international format.

### Error Handling
All Firebase errors are caught and converted to user-friendly messages in the blocs.

### Loading States
Both AuthBloc and VerificationBloc have loading states for better UX.

## 🚨 Important Notes

1. **Testing on Real Device**: Phone authentication only works on real devices, not simulators
2. **SMS Costs**: Be aware that sending SMS costs money based on your Firebase billing plan
3. **Rate Limiting**: Firebase has built-in rate limiting for SMS to prevent abuse
4. **International Format**: Always use international format for phone numbers (+countrycode)

## 🐛 Troubleshooting

### Common Issues:
1. **SHA-1 not added**: Make sure you've added the correct SHA-1 hash to Firebase
2. **APNs not configured**: For iOS, ensure push notifications are properly set up
3. **Network issues**: Ensure device has internet connection
4. **Invalid phone format**: Use international format with country code

### Error Messages:
- "invalid-phone-number": Phone number format is incorrect
- "too-many-requests": Rate limit exceeded, try again later
- "session-expired": Verification code expired, request new one

## 📱 Testing

Run the app and test with:
1. Real phone number (will receive actual SMS)
2. Firebase test numbers (no SMS sent, use predefined codes)

## 🎯 Next Steps

After successful implementation:
1. Add proper error handling UI
2. Implement user profile management
3. Add sign-out functionality
4. Handle authentication state persistence
5. Add loading indicators and better UX
