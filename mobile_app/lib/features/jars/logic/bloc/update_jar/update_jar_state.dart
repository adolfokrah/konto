part of 'update_jar_bloc.dart';

@immutable
sealed class UpdateJarState {}

final class UpdateJarInitial extends UpdateJarState {}

final class UpdateJarInProgress extends UpdateJarState {}

final class UpdateJarSuccess extends UpdateJarState {}

final class UpdateJarFailure extends UpdateJarState {
  final String errorMessage;

  UpdateJarFailure(this.errorMessage);
}
