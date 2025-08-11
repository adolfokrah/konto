part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent {}

final class PhoneNumberSubmitted extends AuthEvent {
  final String phoneNumber;
  final String countryCode;

  PhoneNumberSubmitted({
    required this.phoneNumber,
    required this.countryCode,
  });
}

final class SignOutRequested extends AuthEvent {}
