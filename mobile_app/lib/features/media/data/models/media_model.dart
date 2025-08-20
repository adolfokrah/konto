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
  });

  factory MediaModel.fromJson(Map<String, dynamic> json) {
    return MediaModel(
      id: json['id'] as String,
      alt:
          json['alt'] as String? ??
          '', // alt is required in PayloadCMS but make it safe
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
