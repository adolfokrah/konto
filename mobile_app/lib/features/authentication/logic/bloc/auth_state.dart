part of 'auth_bloc.dart';

@immutable
sealed class AuthState {
  const AuthState();
}

final class AuthInitial extends AuthState {
  const AuthInitial();
}

final class AuthLoading extends AuthState {
  const AuthLoading();
}

final class AuthAuthenticated extends AuthState {
  final User user;
  final String token;

  const AuthAuthenticated({required this.user, required this.token});
}

final class AuthError extends AuthState {
  final String error;

  const AuthError({required this.error});
}

final class PhoneNumberAvailable extends AuthState {
  final String phoneNumber;
  final String countryCode;

  const PhoneNumberAvailable({
    required this.phoneNumber,
    required this.countryCode,
  });
}

final class PhoneNumberNotAvailable extends AuthState {
  final String phoneNumber;
  final String countryCode;

  const PhoneNumberNotAvailable({
    required this.phoneNumber,
    required this.countryCode,
  });
}
