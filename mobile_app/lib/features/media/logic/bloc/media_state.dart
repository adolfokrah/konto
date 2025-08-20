part of 'media_bloc.dart';

@immutable
sealed class MediaState {}

final class MediaInitial extends MediaState {}

final class MediaLoading extends MediaState {}

final class MediaLoaded extends MediaState {
  final MediaModel media;

  MediaLoaded({required this.media});
}

final class MediaError extends MediaState {
  final String errorMessage;

  MediaError({required this.errorMessage});
}
