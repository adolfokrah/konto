# Firebase Phone Authentication Flow Diagram

## 🎯 Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FIREBASE PHONE AUTHENTICATION FLOW                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│              │    │              │    │                  │    │              │
│   USER UI    │    │   BLoC       │    │   REPOSITORY     │    │   SERVICE    │
│              │    │              │    │                  │    │              │
└──────────────┘    └──────────────┘    └──────────────────┘    └──────────────┘
        │                   │                      │                     │
        │                   │                      │                     │

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              📱 STEP 1: LOGIN SCREEN                            │
└─────────────────────────────────────────────────────────────────────────────────┘

    User enters phone number: +1234567890
        │
        ▼
    LoginView triggers AuthBloc
        │
        ▼
    PhoneNumberSubmitted(phoneNumber: "+1234567890", countryCode: "+1")
        │                   │
        ▼                   ▼
    AuthBloc                AuthRepository.formatPhoneNumber()
        │                   │
        ▼                   ▼
    AuthRepository          PhoneAuthService.verifyPhoneNumber()
        │                   │
        ▼                   ▼
    PhoneAuthService        🔥 FIREBASE 🔥
        │                   │
        ▼                   ▼
    Firebase sends SMS      User receives: "Your verification code is 123456"
        │
        ▼
    AuthCodeSent event triggered
        │
        ▼
    AuthCodeSentSuccess state emitted
        │
        ▼
    LoginView navigates to OtpView with verificationId

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            📟 STEP 2: OTP VERIFICATION                          │
└─────────────────────────────────────────────────────────────────────────────────┘

    User enters OTP: 123456
        │
        ▼
    OtpView triggers VerificationBloc
        │
        ▼
    OtpSubmitted("123456")
        │                   │
        ▼                   ▼
    VerificationBloc        VerificationRepository.verifyOtp()
        │                   │
        ▼                   ▼
    VerificationRepository  PhoneAuthService.createCredential()
        │                   │
        ▼                   ▼
    PhoneAuthService        🔥 FIREBASE 🔥
        │                   │
        ▼                   ▼
    Firebase validates      UserCredential returned
        │
        ▼
    VerificationSuccess state emitted
        │
        ▼
    User is authenticated! 🎉

```

## 🏗 Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLEAN ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐   USER INTERACTION
│   PRESENTATION  │   LoginView, OtpView
│     LAYER       │   
└─────────────────┘
        │
        ▼ Events (PhoneNumberSubmitted, OtpSubmitted)
┌─────────────────┐   STATE MANAGEMENT  
│   BUSINESS      │   AuthBloc, VerificationBloc
│   LOGIC LAYER   │   
└─────────────────┘
        │
        ▼ Repository calls
┌─────────────────┐   DATA ACCESS
│     DATA        │   AuthRepository, VerificationRepository
│     LAYER       │   
└─────────────────┘
        │
        ▼ Service calls
┌─────────────────┐   EXTERNAL APIs
│   SERVICE       │   PhoneAuthService
│     LAYER       │   
└─────────────────┘
        │
        ▼ Firebase calls
┌─────────────────┐   FIREBASE
│   EXTERNAL      │   Firebase Authentication
│   SERVICES      │   
└─────────────────┘
```

## 📊 State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                AUTH BLOC STATES                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

    AuthInitial
        │
        │ User enters phone number
        ▼
    AuthLoading
        │
        ├─ Success ──▶ AuthCodeSentSuccess ──▶ Navigate to OTP
        │
        └─ Error ────▶ AuthFailure ──▶ Show error message


┌─────────────────────────────────────────────────────────────────────────────────┐
│                            VERIFICATION BLOC STATES                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    VerificationInitial
        │
        │ User enters OTP
        ▼
    VerificationLoading  
        │
        ├─ Success ──▶ VerificationSuccess ──▶ User authenticated
        │
        └─ Error ────▶ VerificationFailure ──▶ Show error, try again
```

## 🔄 Event Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                EVENT SEQUENCE                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

1. 📱 User Input
   └─▶ LoginView: TextFormField("+1234567890")

2. 📤 Event Dispatch  
   └─▶ AuthBloc.add(PhoneNumberSubmitted(phoneNumber, countryCode))

3. 🔄 Business Logic
   └─▶ AuthBloc._onPhoneNumberSubmitted()
       └─▶ AuthRepository.verifyPhoneNumber()
           └─▶ PhoneAuthService.verifyPhoneNumber()
               └─▶ 🔥 Firebase.auth().verifyPhoneNumber()

4. 📬 Firebase Response
   └─▶ codeSent callback triggered
       └─▶ AuthBloc.add(AuthCodeSent(verificationId, phoneNumber))

5. 📱 State Update  
   └─▶ AuthBloc.emit(AuthCodeSentSuccess(verificationId, phoneNumber))

6. 🧭 Navigation
   └─▶ LoginView.BlocListener navigates to OtpView

7. 📟 OTP Entry
   └─▶ OtpView: OTPInput("123456")

8. 📤 Verification Event
   └─▶ VerificationBloc.add(OtpSubmitted("123456"))

9. 🔐 Verification Logic
   └─▶ VerificationBloc._onOtpSubmitted()
       └─▶ VerificationRepository.verifyOtp(verificationId, "123456")
           └─▶ PhoneAuthService.signInWithCredential()
               └─▶ 🔥 Firebase.auth().signInWithCredential()

10. ✅ Success
    └─▶ VerificationBloc.emit(VerificationSuccess())
        └─▶ User is authenticated! 🎉
```

## 📁 File Structure & Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FILE RESPONSIBILITIES                              │
└─────────────────────────────────────────────────────────────────────────────────┘

📱 PRESENTATION LAYER
├── lib/features/authentication/presentation/views/
│   └── login_view.dart ........................... UI for phone number input
├── lib/features/verification/presentation/pages/
│   └── otp_view.dart ............................ UI for OTP input

🧠 BUSINESS LOGIC LAYER  
├── lib/features/authentication/logic/bloc/
│   ├── auth_bloc.dart ........................... Phone number verification logic
│   ├── auth_event.dart .......................... Events (PhoneNumberSubmitted)
│   └── auth_state.dart .......................... States (AuthCodeSentSuccess)
├── lib/features/verification/logic/bloc/
│   ├── verification_bloc.dart ................... OTP verification logic
│   ├── verification_event.dart .................. Events (OtpSubmitted)
│   └── verification_state.dart .................. States (VerificationSuccess)

💾 DATA LAYER
├── lib/features/authentication/data/repositories/
│   └── auth_repository.dart ..................... Auth data operations
├── lib/features/verification/data/repositories/
│   └── verification_repository.dart ............. OTP verification operations

🔧 SERVICE LAYER
├── lib/core/services/
│   └── phone_auth_service.dart .................. Firebase integration

🚪 NAVIGATION
├── lib/route.dart ............................... App routing configuration
└── lib/main.dart ................................ App initialization & BLoC providers
```

This architecture ensures clean separation of concerns, testability, and maintainability! 🚀
