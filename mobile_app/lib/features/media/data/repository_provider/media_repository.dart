import 'package:image_picker/image_picker.dart';
import 'package:konto/features/media/data/api_provider/media_api_provider.dart';

/// Repository for media operations
/// Orchestrates business logic between UI and API calls
class MediaRepository {
  final MediaApiProvider _mediaApiProvider;

  MediaRepository({required MediaApiProvider mediaApiProvider})
    : _mediaApiProvider = mediaApiProvider;

  /// Upload image to PayloadCMS media collection
  /// Returns success response with media data if successful
  Future<Map<String, dynamic>> uploadImage({
    required XFile imageFile,
    String? alt,
  }) async {
    try {
      final apiResponse = await _mediaApiProvider.uploadImage(
        imageFile: imageFile,
        alt: alt,
      );

      if (apiResponse['success'] == true) {
        return {
          'success': true,
          'data': apiResponse['data'],
          'message': apiResponse['message'] ?? 'Image uploaded successfully',
        };
      } else {
        // Handle API errors
        return {
          'success': false,
          'message': apiResponse['message'] ?? 'Failed to upload image',
          'error': apiResponse['error'],
          'statusCode': apiResponse['statusCode'],
        };
      }
    } catch (e) {
      // Handle unexpected errors
      return {
        'success': false,
        'message': 'An unexpected error occurred while uploading image',
        'error': e.toString(),
      };
    }
  }

  /// Delete media document
  /// Returns success response if successful
  Future<Map<String, dynamic>> deleteMedia({required String mediaId}) async {
    try {
      final apiResponse = await _mediaApiProvider.deleteMedia(mediaId: mediaId);

      if (apiResponse['success'] == true) {
        return {
          'success': true,
          'data': apiResponse['data'],
          'message': apiResponse['message'] ?? 'Media deleted successfully',
        };
      } else {
        // Handle API errors
        return {
          'success': false,
          'message': apiResponse['message'] ?? 'Failed to delete media',
          'error': apiResponse['error'],
          'statusCode': apiResponse['statusCode'],
        };
      }
    } catch (e) {
      // Handle unexpected errors
      return {
        'success': false,
        'message': 'An unexpected error occurred while deleting media',
        'error': e.toString(),
      };
    }
  }

  /// Convenience method: Upload image and return URL directly
  /// Returns the uploaded image URL if successful, null if failed
  Future<String?> uploadImageAndGetUrl({
    required XFile imageFile,
    String? alt,
  }) async {
    final result = await uploadImage(imageFile: imageFile, alt: alt);

    if (result['success'] == true && result['data'] != null) {
      final mediaData = result['data'] as Map<String, dynamic>;
      return mediaData['url'] as String?;
    }

    return null;
  }

  /// Convenience method: Upload image and return both ID and URL
  /// Returns a map with 'id' and 'url' if successful, null if failed
  Future<Map<String, String>?> uploadImageAndGetIdUrl({
    required XFile imageFile,
    String? alt,
  }) async {
    final result = await uploadImage(imageFile: imageFile, alt: alt);

    if (result['success'] == true && result['data'] != null) {
      final mediaData = result['data'] as Map<String, dynamic>;
      final id = mediaData['id'] as String?;
      final url = mediaData['url'] as String?;

      if (id != null && url != null) {
        return {'id': id, 'url': url};
      }
    }

    return null;
  }
}
