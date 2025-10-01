import 'package:Hoga/features/media/data/models/media_model.dart';

/// Model representing a collector/collaborator user
/// Used specifically for the collaborators feature to manage jar contributors

/// Enum representing collector status in a jar
enum CollectorStatus {
  pending('pending'),
  accepted('accepted'),
  declined('declined');

  const CollectorStatus(this.value);
  final String value;

  static CollectorStatus fromString(String value) {
    switch (value) {
      case 'accepted':
        return CollectorStatus.accepted;
      case 'declined':
        return CollectorStatus.declined;
      case 'pending':
      default:
        return CollectorStatus.pending;
    }
  }
}

/// Model representing a collector's profile picture
class CollectorProfilePicture {
  final String id;
  final String url;
  final String? filename;

  const CollectorProfilePicture({
    required this.id,
    required this.url,
    this.filename,
  });

  factory CollectorProfilePicture.fromJson(Map<String, dynamic> json) {
    return CollectorProfilePicture(
      id: json['id'] as String? ?? '',
      url: json['url'] as String? ?? '',
      filename: json['filename'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'url': url, if (filename != null) 'filename': filename};
  }
}

/// Core collector model representing a user who can contribute to jars
class CollectorModel {
  final String id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String countryCode;
  final String country;
  final bool isKYCVerified;
  final MediaModel? photo;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const CollectorModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    required this.countryCode,
    required this.country,
    required this.isKYCVerified,
    this.photo,
    this.createdAt,
    this.updatedAt,
  });

  factory CollectorModel.fromJson(Map<String, dynamic> json) {
    return CollectorModel(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      countryCode: json['countryCode'] as String? ?? '',
      country: json['country'] as String? ?? '',
      isKYCVerified: json['isKYCVerified'] as bool? ?? false,
      photo:
          json['photo'] != null && json['photo'] is Map<String, dynamic>
              ? MediaModel.fromJson(json['photo'] as Map<String, dynamic>)
              : null,
      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(json['createdAt'] as String)
              : null,
      updatedAt:
          json['updatedAt'] != null
              ? DateTime.parse(json['updatedAt'] as String)
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'countryCode': countryCode,
      'country': country,
      'isKYCVerified': isKYCVerified,
      if (photo != null) 'photo': photo!.toJson(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  /// Get formatted full phone number (countryCode + phoneNumber)
  String get fullPhoneNumber {
    final cleanCountryCode = countryCode.replaceAll('+', '');
    final cleanPhoneNumber =
        phoneNumber.startsWith('0') && phoneNumber.length > 1
            ? phoneNumber.substring(1)
            : phoneNumber;
    return '+$cleanCountryCode$cleanPhoneNumber';
  }

  /// Get display name (prioritizes fullName, falls back to phone number)
  String get displayName {
    if (fullName.isNotEmpty) return fullName;
    return fullPhoneNumber;
  }

  /// Check if this collector has a profile picture
  bool get hasProfilePicture => photo != null;

  /// Create a copy with updated values
  CollectorModel copyWith({
    String? id,
    String? email,
    String? fullName,
    String? phoneNumber,
    String? countryCode,
    String? country,
    bool? isKYCVerified,
    MediaModel? photo,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CollectorModel(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      countryCode: countryCode ?? this.countryCode,
      country: country ?? this.country,
      isKYCVerified: isKYCVerified ?? this.isKYCVerified,
      photo: photo ?? this.photo,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Model representing an invited collector in a jar context
class InvitedCollectorModel {
  final CollectorModel? collector;
  final String? phoneNumber;
  final String? name;
  final CollectorStatus status;
  final String? id;

  const InvitedCollectorModel({
    this.collector,
    this.phoneNumber,
    this.name,
    required this.status,
    this.id,
  });

  factory InvitedCollectorModel.fromJson(Map<String, dynamic> json) {
    return InvitedCollectorModel(
      collector:
          json['collector'] != null
              ? CollectorModel.fromJson(
                json['collector'] as Map<String, dynamic>,
              )
              : null,
      phoneNumber: json['phoneNumber'] as String?,
      name: json['name'] as String?,
      status: CollectorStatus.fromString(
        json['status'] as String? ?? 'pending',
      ),
      id: json['id'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (collector != null) 'collector': collector!.toJson(),
      if (phoneNumber != null) 'phoneNumber': phoneNumber,
      if (name != null) 'name': name,
      'status': status.value,
      if (id != null) 'id': id,
    };
  }

  /// Get display name for this invited collector
  String get displayName {
    if (collector != null) return collector!.displayName;
    if (name != null && name!.isNotEmpty) return name!;
    if (phoneNumber != null && phoneNumber!.isNotEmpty) return phoneNumber!;
    return 'Unknown Collector';
  }

  /// Get phone number for this invited collector
  String get collectorPhoneNumber {
    if (collector != null) return collector!.fullPhoneNumber;
    return phoneNumber ?? '';
  }

  /// Check if this invited collector has accepted the invitation
  bool get isAccepted => status == CollectorStatus.accepted;

  /// Check if this invited collector has a pending invitation
  bool get isPending => status == CollectorStatus.pending;

  /// Check if this invited collector has declined the invitation
  bool get isDeclined => status == CollectorStatus.declined;

  /// Check if this invited collector is registered in the system
  bool get isRegistered => collector != null;

  /// Create a copy with updated values
  InvitedCollectorModel copyWith({
    CollectorModel? collector,
    String? phoneNumber,
    String? name,
    CollectorStatus? status,
    String? id,
  }) {
    return InvitedCollectorModel(
      collector: collector ?? this.collector,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      name: name ?? this.name,
      status: status ?? this.status,
      id: id ?? this.id,
    );
  }
}

/// Model for collector search results
class CollectorSearchResult {
  final List<CollectorModel> registeredCollectors;
  final List<InvitedCollectorModel> invitedCollectors;
  final int totalCount;

  const CollectorSearchResult({
    required this.registeredCollectors,
    required this.invitedCollectors,
    required this.totalCount,
  });

  factory CollectorSearchResult.fromJson(Map<String, dynamic> json) {
    return CollectorSearchResult(
      registeredCollectors:
          (json['registeredCollectors'] as List<dynamic>?)
              ?.map(
                (item) => CollectorModel.fromJson(item as Map<String, dynamic>),
              )
              .toList() ??
          [],
      invitedCollectors:
          (json['invitedCollectors'] as List<dynamic>?)
              ?.map(
                (item) => InvitedCollectorModel.fromJson(
                  item as Map<String, dynamic>,
                ),
              )
              .toList() ??
          [],
      totalCount: json['totalCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'registeredCollectors':
          registeredCollectors.map((collector) => collector.toJson()).toList(),
      'invitedCollectors':
          invitedCollectors.map((collector) => collector.toJson()).toList(),
      'totalCount': totalCount,
    };
  }

  /// Check if the search returned any results
  bool get hasResults => totalCount > 0;

  /// Check if there are any registered collectors in the results
  bool get hasRegisteredCollectors => registeredCollectors.isNotEmpty;

  /// Check if there are any invited collectors in the results
  bool get hasInvitedCollectors => invitedCollectors.isNotEmpty;
}
