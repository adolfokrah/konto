part of 'update_jar_bloc.dart';

@immutable
sealed class UpdateJarState {}

final class UpdateJarInitial extends UpdateJarState {}

final class UpdateJarInProgress extends UpdateJarState {}

final class UpdateJarSuccess extends UpdateJarState {
  final bool silent;
  UpdateJarSuccess({this.silent = false});
}

final class UpdateJarFailure extends UpdateJarState {
  final String errorMessage;

  UpdateJarFailure(this.errorMessage);
}

final class LeaveJarSuccess extends UpdateJarState {}

final class LeaveJarFailure extends UpdateJarState {
  final String errorMessage;

  LeaveJarFailure(this.errorMessage);
}
