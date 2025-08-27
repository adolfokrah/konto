part of 'user_account_bloc.dart';

@immutable
sealed class UserAccountState {}

final class UserAccountInitial extends UserAccountState {}

final class UserAccountLoading extends UserAccountState {}

final class UserAccountSuccess extends UserAccountState {
  final User updatedUser;
  final String token;

  UserAccountSuccess({required this.updatedUser, required this.token});
}

final class UserAccountError extends UserAccountState {
  final String message;

  UserAccountError({required this.message});
}
