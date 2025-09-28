part of 'jar_invite_action_bloc.dart';

@immutable
sealed class JarInviteActionState {}

final class JarInviteActionInitial extends JarInviteActionState {}

final class JarInviteActionLoading extends JarInviteActionState {}

final class JarInviteActionSuccess extends JarInviteActionState {
  JarInviteActionSuccess();
}

final class JarInviteActionError extends JarInviteActionState {
  final String message;

  JarInviteActionError({required this.message});
}
