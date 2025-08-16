part of 'jar_summary_bloc.dart';

@immutable
sealed class JarEvent {}

final class GetJarSummaryRequested extends JarEvent {
  GetJarSummaryRequested();
}

final class SetCurrentJarRequested extends JarEvent {
  final String jarId;

  SetCurrentJarRequested({required this.jarId});
}
