part of 'jar_summary_reload_bloc.dart';

@immutable
sealed class JarSummaryReloadEvent {}

final class ReloadJarSummaryRequested extends JarSummaryReloadEvent {
  ReloadJarSummaryRequested();
}
