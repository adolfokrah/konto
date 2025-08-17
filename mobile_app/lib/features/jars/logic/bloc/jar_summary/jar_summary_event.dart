part of 'jar_summary_bloc.dart';

@immutable
sealed class JarEvent {}

final class GetJarSummaryRequested extends JarEvent {
  GetJarSummaryRequested();
}

final class RefreshJarSummaryRequested extends JarEvent {
  RefreshJarSummaryRequested();
}

final class UpdateJarSummaryRequested extends JarEvent {
  final JarSummaryModel jarData;

  UpdateJarSummaryRequested({required this.jarData});
}

final class SetCurrentJarRequested extends JarEvent {
  final String jarId;

  SetCurrentJarRequested({required this.jarId});
}
