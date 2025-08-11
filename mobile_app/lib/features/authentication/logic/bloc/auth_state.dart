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
  final String phoneNumber;

  const AuthAuthenticated(this.phoneNumber);
}

final class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

final class AuthCodeSentSuccess extends AuthState {
  final String verificationId;
  final String phoneNumber;

  const AuthCodeSentSuccess({
    required this.verificationId,
    required this.phoneNumber,
  });
}

final class AuthFailure extends AuthState {
  final String error;

  const AuthFailure(this.error);
}
