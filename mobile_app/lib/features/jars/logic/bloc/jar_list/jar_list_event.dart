part of 'jar_list_bloc.dart';

@immutable
sealed class JarListEvent {}

final class LoadJarList extends JarListEvent {}
