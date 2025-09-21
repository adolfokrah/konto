part of 'media_bloc.dart';

@immutable
sealed class MediaState {}

final class MediaInitial extends MediaState {}

final class MediaLoading extends MediaState {}

final class MediaLoaded extends MediaState {
  final MediaModel media;
  final MediaUploadContext context;

  MediaLoaded({required this.media, required this.context});
}

final class MediaError extends MediaState {
  final String errorMessage;

  MediaError({required this.errorMessage});
}

final class KycDocumentsUploading extends MediaState {}

final class KycDocumentsUploaded extends MediaState {
  final Map<String, dynamic> uploadResult;

  KycDocumentsUploaded({required this.uploadResult});
}

final class KycDocumentsUploadError extends MediaState {
  final String errorMessage;

  KycDocumentsUploadError({required this.errorMessage});
}
