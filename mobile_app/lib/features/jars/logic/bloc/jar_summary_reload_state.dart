part of 'jar_summary_reload_bloc.dart';

@immutable
sealed class JarSummaryReloadState {}

final class JarSummaryReloadInitial extends JarSummaryReloadState {}

final class JarSummaryReloading extends JarSummaryReloadState {}

final class JarSummaryReloaded extends JarSummaryReloadState {}

final class JarSummaryReloadError extends JarSummaryReloadState {
  final String message;

  JarSummaryReloadError({required this.message});
}
