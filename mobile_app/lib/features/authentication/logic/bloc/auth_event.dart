part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent {}

final class CheckUserExistence extends AuthEvent {
  final String phoneNumber;
  final String countryCode;
  final String? email;
  final String? username;

  CheckUserExistence({
    required this.phoneNumber,
    required this.countryCode,
    this.email,
    this.username,
  });
}

final class RequestLogin extends AuthEvent {
  final String phoneNumber;
  final String countryCode;

  RequestLogin({required this.phoneNumber, required this.countryCode});
}

final class RequestRegistration extends AuthEvent {
  final String phoneNumber;
  final String countryCode;
  final String country;
  final String firstName;
  final String lastName;
  final String username;
  final String email;

  RequestRegistration({
    required this.phoneNumber,
    required this.countryCode,
    required this.country,
    required this.firstName,
    required this.lastName,
    required this.username,
    required this.email,
  });
}

final class SignOutRequested extends AuthEvent {}

final class AutoLoginRequested extends AuthEvent {}

final class UpdateUserData extends AuthEvent {
  final User updatedUser;
  final String token;

  UpdateUserData({required this.updatedUser, required this.token});
}
