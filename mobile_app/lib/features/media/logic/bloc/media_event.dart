part of 'media_bloc.dart';

@immutable
sealed class MediaEvent {}

final class RequestUploadMedia extends MediaEvent {
  final XFile imageFile;
  final String? alt;
  final MediaUploadContext context;

  RequestUploadMedia({
    required this.imageFile,
    this.alt,
    this.context = MediaUploadContext.general,
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
