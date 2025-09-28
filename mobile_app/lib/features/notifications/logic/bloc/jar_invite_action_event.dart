part of 'jar_invite_action_bloc.dart';

@immutable
sealed class JarInviteActionEvent {}

final class AcceptDeclineJarInvite extends JarInviteActionEvent {
  final String jarId;
  final String action;
  AcceptDeclineJarInvite({required this.jarId, required this.action});
}
