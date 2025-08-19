part of 'jar_create_bloc.dart';

@immutable
sealed class JarCreateState {}

final class JarCreateInitial extends JarCreateState {}

final class JarCreateLoading extends JarCreateState {}

final class JarCreateSuccess extends JarCreateState {
  final Map<String, dynamic> jarData;

  JarCreateSuccess({required this.jarData});
}

final class JarCreateFailure extends JarCreateState {
  final String error;

  JarCreateFailure(this.error);
}
