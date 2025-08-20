part of 'media_bloc.dart';

@immutable
sealed class MediaEvent {}

final class RequestUploadMedia extends MediaEvent {
  final XFile imageFile;
  final String? alt;

  RequestUploadMedia({required this.imageFile, this.alt});
}
