part of 'media_bloc.dart';

@immutable
sealed class MediaEvent {}

final class RequestUploadMedia extends MediaEvent {
  final XFile imageFile;
  final String? alt;
  final MediaUploadContext context;

  /// Target Payload collection endpoint. Defaults to `media` so existing
  /// callers are unaffected. Pass `business-documents` to upload to the
  /// private business documents collection.
  final String collection;

  /// Optional identifier for the specific upload slot (e.g. which director's
  /// ID document). Echoed back on [MediaLoaded] so callers can tell which of
  /// several concurrent uploads completed.
  final String? contextId;

  RequestUploadMedia({
    required this.imageFile,
    this.alt,
    this.context = MediaUploadContext.general,
    this.collection = 'media',
    this.contextId,
  });
}

final class RequestUploadKycDocuments extends MediaEvent {
  final String frontFilePath;
  final String backFilePath;
  final String photoFilePath;
  final String documentType;

  RequestUploadKycDocuments({
    required this.frontFilePath,
    required this.backFilePath,
    required this.photoFilePath,
    required this.documentType,
  });
}
