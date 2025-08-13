part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent {}


final class CheckUserExistence extends AuthEvent {
  final String phoneNumber;
  final String countryCode;
  final String? email;

  CheckUserExistence({
    required this.phoneNumber,
    required this.countryCode,
    this.email,
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

final class RequestRegistration extends AuthEvent {
  final String phoneNumber;
  final String countryCode;
  final String country;
  final String fullName;
  final String email;

  RequestRegistration({
    required this.phoneNumber,
    required this.countryCode,
    required this.country,
    required this.fullName,
    required this.email,
  });
}

final class SignOutRequested extends AuthEvent {}

final class AutoLoginRequested extends AuthEvent {}
