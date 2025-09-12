import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:konto/core/config/backend_config.dart';
import 'package:konto/core/services/base_api_provider.dart';
import 'package:konto/core/services/user_storage_service.dart';

/// API Provider for media-related operations (image uploads to PayloadCMS)
class MediaApiProvider extends BaseApiProvider {
  MediaApiProvider({
    required Dio dio,
    required UserStorageService userStorageService,
  }) : super(dio: dio, userStorageService: userStorageService);

  /// Upload image to PayloadCMS media collection
  ///
  /// Takes an XFile (from image_picker) and uploads it to PayloadCMS
  /// Returns the media document with id and url on success
  Future<Map<String, dynamic>> uploadImage({
    required XFile imageFile,
    String? alt,
  }) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      // Create alt text from filename (always use filename-based alt for consistency)
      final imageAlt = _generateAltFromFilename(imageFile.name);

      print('DEBUG: Image name: "${imageFile.name}"');
      print('DEBUG: Generated alt: "$imageAlt"');

      // Create multipart form data using PayloadCMS format
      final multipartFile = await MultipartFile.fromFile(
        imageFile.path,
        filename: imageFile.name,
        contentType: MediaType.parse('image/jpeg'), // Explicit content type
      );

      // PayloadCMS requires additional fields to be sent in a _payload JSON field
      final payloadData = {'alt': imageAlt};

      final formData = FormData.fromMap({
        'file': multipartFile,
        '_payload': jsonEncode(payloadData), // PayloadCMS format
      });

      print(
        'DEBUG: FormData fields: ${formData.fields.map((f) => '${f.key}: ${f.value}').toList()}',
      );
      print(
        'DEBUG: FormData files: ${formData.files.map((f) => '${f.key}: ${f.value.filename}').toList()}',
      );
      print('DEBUG: Alt text being sent: "$imageAlt"');

      // Upload to PayloadCMS media endpoint
      final response = await dio.post(
        '${BackendConfig.apiBaseUrl}/media',
        data: formData,
        options: Options(
          headers: headers,
          // Let Dio automatically set Content-Type with proper boundary
        ),
      );

      // PayloadCMS returns the created media document
      return {
        'success': true,
        'data': response.data,
        'message': 'Image uploaded successfully',
      };
    } catch (e) {
      return handleApiError(e, 'uploading image');
    }
  }

  /// Removes media file and document from PayloadCMS
  Future<Map<String, dynamic>> deleteMedia({required String mediaId}) async {
    try {
      // Get authenticated headers
      final headers = await getAuthenticatedHeaders();

      if (headers == null) {
        return getUnauthenticatedError();
      }

      final response = await dio.delete(
        '${BackendConfig.apiBaseUrl}/media/$mediaId',
        options: Options(headers: headers),
      );

      return {
        'success': true,
        'data': response.data,
        'message': 'Media deleted successfully',
      };
    } catch (e) {
      return handleApiError(e, 'deleting media');
    }
  }

  /// Generate alt text from filename by replacing spaces with dashes
  /// and removing file extension
  String _generateAltFromFilename(String filename) {
    // Remove file extension
    final nameWithoutExtension = filename.split('.').first;

    // Replace spaces and underscores with dashes, convert to lowercase
    return nameWithoutExtension
        .replaceAll(' ', '-')
        .replaceAll('_', '-')
        .toLowerCase();
  }
}
