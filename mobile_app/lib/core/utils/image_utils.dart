import 'package:Hoga/core/config/backend_config.dart';

/// Utility class for image-related operations
class ImageUtils {
  /// Helper method to construct full image URL from relative path
  ///
  /// Takes a relative path and converts it to a full URL using the backend base URL.
  /// If the path is already a full URL (starts with http:// or https://),
  /// it returns the path as is.
  ///
  /// Example:
  /// ```dart
  /// final fullUrl = ImageUtils.constructImageUrl('/uploads/image.jpg');
  /// // Returns: 'https://your-backend.com/uploads/image.jpg'
  /// ```
  static String constructImageUrl(String relativePath) {
    final baseUrl = BackendConfig.imageBaseUrl;

    // If the path is already a full URL, return it as is
    if (relativePath.startsWith('http://') ||
        relativePath.startsWith('https://')) {
      return relativePath;
    }

    // If the path starts with '/', remove it to avoid double slashes
    final cleanPath =
        relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;

    // Construct the full URL
    return '$baseUrl/$cleanPath';
  }
}
