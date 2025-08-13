part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent {}


final class PhoneNumberAvailabilityChecked extends AuthEvent {
  final String phoneNumber;
  final String countryCode;

  PhoneNumberAvailabilityChecked({
    required this.phoneNumber,
    required this.countryCode,
  });
}

final class RequestLogin extends AuthEvent {
  final String phoneNumber;
  final String countryCode;

  RequestLogin({
    required this.phoneNumber,
    required this.countryCode,
  });
}

final class UserRegistrationWithOtpRequested extends AuthEvent {
  final String enteredOtp;
  final String sentOtp;
  final String phoneNumber;
  final String countryCode;
  final String country;
  final String fullName;
  final String email;

  UserRegistrationWithOtpRequested({
    required this.enteredOtp,
    required this.sentOtp,
    required this.phoneNumber,
    required this.countryCode,
    required this.country,
    required this.fullName,
    required this.email,
  });
}

final class SignOutRequested extends AuthEvent {}

final class AutoLoginRequested extends AuthEvent {}
