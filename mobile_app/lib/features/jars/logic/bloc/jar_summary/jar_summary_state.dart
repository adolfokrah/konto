part of 'jar_summary_bloc.dart';

@immutable
sealed class JarSummaryState {}

final class JarSummaryInitial extends JarSummaryState {}

final class JarSummaryLoading extends JarSummaryState {}

final class JarSummaryLoaded extends JarSummaryState {
  final JarSummaryModel jarData;

  JarSummaryLoaded({required this.jarData});
}

final class JarSummaryError extends JarSummaryState {
  final String message;
  final int? statusCode;

  JarSummaryError({required this.message, this.statusCode});
}
