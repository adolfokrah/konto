import 'package:bloc/bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:meta/meta.dart';
import 'package:konto/core/services/service_registry.dart';

import '../../data/models/media_model.dart';
import '../../data/api_provider/media_api_provider.dart';
import '../../data/repository_provider/media_repository.dart';

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
      // Create MediaRepository with its dependencies directly
      final mediaApiProvider = MediaApiProvider(
        dio: ServiceRegistry().dio,
        userStorageService: ServiceRegistry().userStorageService,
      );
      final mediaRepository = MediaRepository(
        mediaApiProvider: mediaApiProvider,
      );

      // Upload image using MediaRepository
      final response = await mediaRepository.uploadImage(
        imageFile: event.imageFile,
        alt: event.alt ?? 'Uploaded Image',
      );

      if (response['success'] == true) {
        // Parse the media data from the response
        final mediaData = response['data'] as Map<String, dynamic>;
        final mediaModel = MediaModel.fromJson(mediaData);

        emit(MediaLoaded(media: mediaModel));
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
