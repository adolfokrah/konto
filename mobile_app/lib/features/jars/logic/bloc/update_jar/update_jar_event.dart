part of 'update_jar_bloc.dart';

@immutable
sealed class UpdateJarEvent {}

final class UpdateJarRequested extends UpdateJarEvent {
  final String jarId;
  final Map<String, dynamic> updates;

  UpdateJarRequested({required this.jarId, required this.updates});
}
