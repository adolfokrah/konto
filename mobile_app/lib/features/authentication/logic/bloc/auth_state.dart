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

final class PhoneNumberAvailabilityResult extends AuthState {
  final bool exists;
  final bool shouldLogin;
  final bool shouldRegister;
  final String message;
  final String phoneNumber;
  final String countryCode;

  const PhoneNumberAvailabilityResult({
    required this.exists,
    required this.shouldLogin,
    required this.shouldRegister,
    required this.message,
    required this.phoneNumber,
    required this.countryCode,
  });
}

final class AuthAuthenticated extends AuthState {
  final String phoneNumber;

  const AuthAuthenticated(this.phoneNumber);
}

final class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

final class AuthCodeSentSuccess extends AuthState {
  final String verificationId;
  final String phoneNumber;
  final String countryCode;

  const AuthCodeSentSuccess({
    required this.verificationId,
    required this.phoneNumber,
    required this.countryCode,
  });
}

final class AuthFailure extends AuthState {
  final String error;

  const AuthFailure(this.error);
}

final class UserRegistrationSuccess extends AuthState {
  final User user;
  final String? token;
  final bool requiresLogin;

  const UserRegistrationSuccess({
    required this.user,
    this.token,
    this.requiresLogin = false,
  });
}

final class UserRegistrationFailure extends AuthState {
  final String error;
  final Map<String, dynamic>? errors;

  const UserRegistrationFailure({
    required this.error,
    this.errors,
  });
}

final class UserRegistrationOtpSent extends AuthState {
  final String phoneNumber;
  final String countryCode;
  final String country;
  final String fullName;
  final String email;
  final String sentOtp;

  const UserRegistrationOtpSent({
    required this.phoneNumber,
    required this.countryCode,
    required this.country,
    required this.fullName,
    required this.email,
    required this.sentOtp,
  });
}

final class AutoLoginLoading extends AuthState {
  const AutoLoginLoading();
}

final class AutoLoginSuccess extends AuthState {
  final User user;
  final String token;

  const AutoLoginSuccess({
    required this.user,
    required this.token,
  });
}

final class AutoLoginFailed extends AuthState {
  final String message;

  const AutoLoginFailed({
    required this.message,
  });
}
