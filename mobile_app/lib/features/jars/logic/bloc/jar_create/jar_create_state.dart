part of 'jar_create_bloc.dart';

@immutable
sealed class JarCreateState {}

final class JarCreateInitial extends JarCreateState {}

final class JarCreateLoading extends JarCreateState {}

final class JarCreateSuccess extends JarCreateState {
  final JarModel jar;

  JarCreateSuccess(this.jar);
}

final class JarCreateFailure extends JarCreateState {
  final String error;

  JarCreateFailure(this.error);
}
