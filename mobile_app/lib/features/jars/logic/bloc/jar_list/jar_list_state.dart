part of 'jar_list_bloc.dart';

@immutable
sealed class JarListState {}

final class JarListInitial extends JarListState {}

final class JarListLoading extends JarListState {}

final class JarListLoaded extends JarListState {
  final JarList jars;

  JarListLoaded(this.jars);
}

final class JarListError extends JarListState {
  final String message;

  JarListError(this.message);
}
