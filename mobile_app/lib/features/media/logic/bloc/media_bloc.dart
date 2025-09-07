import 'package:bloc/bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:konto/core/enums/media_upload_context.dart';

import '../../data/models/media_model.dart';

part 'media_event.dart';
part 'media_state.dart';

class MediaBloc extends Bloc<MediaEvent, MediaState> {
  MediaBloc() : super(MediaInitial()) {
    on<RequestUploadMedia>(_requestUploadMedia);
  }

  Future<void> _requestUploadMedia(
    RequestUploadMedia event,
    Emitter<MediaState> emit,
  ) async {
    emit(MediaLoading());

    try {
      // Use MediaRepository from ServiceRegistry
      final mediaRepository = ServiceRegistry().mediaRepository;

      // Upload image using MediaRepository
      final response = await mediaRepository.uploadImage(
        imageFile: event.imageFile,
        alt: event.alt ?? 'Uploaded Image',
      );

      print('DEBUG: Full response: $response');

      // Check if response contains doc (successful upload)
      if (response['success'] == true && response['data']['doc'] != null) {
        // Parse the media data from the response - it's nested under data.doc
        final mediaData = response['data']['doc'] as Map<String, dynamic>;
        print('DEBUG: Media data: $mediaData');
        final mediaModel = MediaModel.fromJson(mediaData);

        emit(MediaLoaded(media: mediaModel, context: event.context));
      } else {
        // Handle upload failure
        final errorMessage = response['message'] ?? 'Failed to upload image';
        emit(MediaError(errorMessage: errorMessage));
      }
    } catch (e) {
      // Handle unexpected errors
      emit(MediaError(errorMessage: 'An unexpected error occurred: $e'));
    }
  }
}
