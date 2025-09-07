/// Comprehensive Media model representing uploaded files/images from PayloadCMS
/// Based on the Media collection schema with all available fields

class MediaModel {
  final String id;
  final String alt;
  final DateTime updatedAt;
  final DateTime createdAt;
  final String? url;
  final String? thumbnailURL;
  final String? filename;
  final String? mimeType;
  final int? filesize;
  final int? width;
  final int? height;
  final double? focalX;
  final double? focalY;

  /// Optional Payload generated key (present in nested objects sometimes)
  final String? key;

  /// Map of size name (thumbnail, small, medium, etc) to its variant metadata
  final Map<String, MediaSizeVariant>? sizes;

  const MediaModel({
    required this.id,
    required this.alt,
    required this.updatedAt,
    required this.createdAt,
    this.url,
    this.thumbnailURL,
    this.filename,
    this.mimeType,
    this.filesize,
    this.width,
    this.height,
    this.focalX,
    this.focalY,
    this.key,
    this.sizes,
  });

  factory MediaModel.fromJson(Map<String, dynamic> json) {
    // Parse sizes map if present
    Map<String, MediaSizeVariant>? parsedSizes;
    final rawSizes = json['sizes'];
    if (rawSizes is Map<String, dynamic>) {
      parsedSizes = rawSizes.map((key, value) {
        if (value is Map<String, dynamic>) {
          return MapEntry(key, MediaSizeVariant.fromJson(value));
        }
        return MapEntry(key, MediaSizeVariant.empty());
      });
      if (parsedSizes.isEmpty) parsedSizes = null;
    }

    return MediaModel(
      id: json['id'] as String,
      alt: json['alt'] as String? ?? '',
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      url: json['url'] as String?,
      thumbnailURL: json['thumbnailURL'] as String?,
      filename: json['filename'] as String?,
      mimeType: json['mimeType'] as String?,
      filesize: json['filesize'] as int?,
      width: json['width'] as int?,
      height: json['height'] as int?,
      focalX: (json['focalX'] as num?)?.toDouble(),
      focalY: (json['focalY'] as num?)?.toDouble(),
      key: json['_key'] as String?,
      sizes: parsedSizes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'alt': alt,
      'updatedAt': updatedAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      if (url != null) 'url': url,
      if (thumbnailURL != null) 'thumbnailURL': thumbnailURL,
      if (filename != null) 'filename': filename,
      if (mimeType != null) 'mimeType': mimeType,
      if (filesize != null) 'filesize': filesize,
      if (width != null) 'width': width,
      if (height != null) 'height': height,
      if (focalX != null) 'focalX': focalX,
      if (focalY != null) 'focalY': focalY,
      if (key != null) '_key': key,
      if (sizes != null) 'sizes': sizes!.map((k, v) => MapEntry(k, v.toJson())),
    };
  }

  /// Returns true if the media is an image (based on mimeType)
  bool get isImage => mimeType?.startsWith('image/') ?? false;

  /// Returns true if the media is a video (based on mimeType)
  bool get isVideo => mimeType?.startsWith('video/') ?? false;

  /// Returns a human-readable file size string
  String get fileSizeFormatted {
    if (filesize == null) return 'Unknown size';

    const int kb = 1024;
    const int mb = kb * 1024;
    const int gb = mb * 1024;

    if (filesize! >= gb) {
      return '${(filesize! / gb).toStringAsFixed(2)} GB';
    } else if (filesize! >= mb) {
      return '${(filesize! / mb).toStringAsFixed(2)} MB';
    } else if (filesize! >= kb) {
      return '${(filesize! / kb).toStringAsFixed(2)} KB';
    } else {
      return '$filesize B';
    }
  }

  /// Returns image dimensions as a formatted string
  String get dimensionsFormatted {
    if (width != null && height != null) {
      return '${width}x$height';
    }
    return 'Unknown dimensions';
  }

  /// Returns the best available image URL (thumbnailURL first, then url)
  String? get bestImageUrl => thumbnailURL ?? url;

  /// Copy method for creating modified instances
  MediaModel copyWith({
    String? id,
    String? alt,
    DateTime? updatedAt,
    DateTime? createdAt,
    String? url,
    String? thumbnailURL,
    String? filename,
    String? mimeType,
    int? filesize,
    int? width,
    int? height,
    double? focalX,
    double? focalY,
    String? key,
    Map<String, MediaSizeVariant>? sizes,
  }) {
    return MediaModel(
      id: id ?? this.id,
      alt: alt ?? this.alt,
      updatedAt: updatedAt ?? this.updatedAt,
      createdAt: createdAt ?? this.createdAt,
      url: url ?? this.url,
      thumbnailURL: thumbnailURL ?? this.thumbnailURL,
      filename: filename ?? this.filename,
      mimeType: mimeType ?? this.mimeType,
      filesize: filesize ?? this.filesize,
      width: width ?? this.width,
      height: height ?? this.height,
      focalX: focalX ?? this.focalX,
      focalY: focalY ?? this.focalY,
      key: key ?? this.key,
      sizes: sizes ?? this.sizes,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MediaModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'MediaModel(id: $id, alt: $alt, filename: $filename, url: $url)';
  }
}

/// Variant metadata for a particular media size (e.g., thumbnail, small, medium)
class MediaSizeVariant {
  final String? key;
  final int? width;
  final int? height;
  final String? mimeType;
  final int? filesize;
  final String? filename;
  final String? url;

  const MediaSizeVariant({
    this.key,
    this.width,
    this.height,
    this.mimeType,
    this.filesize,
    this.filename,
    this.url,
  });

  factory MediaSizeVariant.fromJson(Map<String, dynamic> json) {
    return MediaSizeVariant(
      key: json['_key'] as String?,
      width: json['width'] as int?,
      height: json['height'] as int?,
      mimeType: json['mimeType'] as String?,
      filesize: json['filesize'] as int?,
      filename: json['filename'] as String?,
      url: json['url'] as String?,
    );
  }

  factory MediaSizeVariant.empty() => const MediaSizeVariant();

  Map<String, dynamic> toJson() {
    return {
      if (key != null) '_key': key,
      'width': width,
      'height': height,
      'mimeType': mimeType,
      'filesize': filesize,
      'filename': filename,
      'url': url,
    };
  }
}
