/// Comprehensive Jar model representing a single jar with all its properties and relationships
/// Based on the Jars collection schema from PayloadCMS

/// Model representing an invited collector in a jar
class InvitedCollector {
  final UserModel? collector;
  final String? phoneNumber;
  final String? name;
  final String status; // 'accepted' | 'pending'

  const InvitedCollector({
    this.collector,
    this.phoneNumber,
    this.name,
    required this.status,
  });

  factory InvitedCollector.fromJson(Map<String, dynamic> json) {
    return InvitedCollector(
      collector:
          json['collector'] != null
              ? UserModel.fromJson(json['collector'] as Map<String, dynamic>)
              : null,
      phoneNumber: json['phoneNumber'] as String?,
      name: json['name'] as String?,
      status: json['status'] as String? ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (collector != null) 'collector': collector!.toJson(),
      if (phoneNumber != null) 'phoneNumber': phoneNumber,
      if (name != null) 'name': name,
      'status': status,
    };
  }

  bool get isAccepted => status == 'accepted';
  bool get isPending => status == 'pending';
}

class JarModel {
  final String id;
  final String name;
  final String? description;
  final String jarGroup;
  final MediaModel? image;
  final bool isActive;
  final bool isFixedContribution;
  final double? acceptedContributionAmount;
  final double goalAmount;
  final DateTime? deadline;
  final String currency; // 'ghc' | 'ngn'
  final UserModel creator;
  final List<InvitedCollector> invitedCollectors;
  final String? paymentLink;
  final bool acceptAnonymousContributions;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Computed/aggregate fields
  final double totalContributions;
  final int totalContributors;
  final double progressPercentage;

  const JarModel({
    required this.id,
    required this.name,
    this.description,
    required this.jarGroup,
    this.image,
    required this.isActive,
    required this.isFixedContribution,
    this.acceptedContributionAmount,
    required this.goalAmount,
    this.deadline,
    required this.currency,
    required this.creator,
    required this.invitedCollectors,
    this.paymentLink,
    required this.acceptAnonymousContributions,
    required this.createdAt,
    required this.updatedAt,
    required this.totalContributions,
    required this.totalContributors,
    required this.progressPercentage,
  });

  factory JarModel.fromJson(Map<String, dynamic> json) {
    final goalAmount = (json['goalAmount'] as num? ?? 0).toDouble();
    final totalContributions =
        (json['totalContributions'] as num? ?? 0).toDouble();

    return JarModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      jarGroup: json['jarGroup'] as String,
      image:
          json['image'] != null
              ? MediaModel.fromJson(json['image'] as Map<String, dynamic>)
              : null,
      isActive: json['isActive'] as bool? ?? true,
      isFixedContribution: json['isFixedContribution'] as bool? ?? false,
      acceptedContributionAmount:
          json['acceptedContributionAmount']?.toDouble(),
      goalAmount: goalAmount,
      deadline:
          json['deadline'] != null
              ? DateTime.parse(json['deadline'] as String)
              : null,
      currency: json['currency'] as String,
      creator: UserModel.fromJson(json['creator'] as Map<String, dynamic>),
      invitedCollectors:
          (json['invitedCollectors'] as List<dynamic>?)
              ?.map(
                (invitedCollector) => InvitedCollector.fromJson(
                  invitedCollector as Map<String, dynamic>,
                ),
              )
              .toList() ??
          [],
      paymentLink: json['paymentLink'] as String?,
      acceptAnonymousContributions:
          json['acceptAnonymousContributions'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      totalContributions: totalContributions,
      totalContributors: (json['totalContributors'] as num? ?? 0).toInt(),
      progressPercentage:
          goalAmount > 0
              ? (totalContributions / goalAmount * 100).clamp(0, 100)
              : 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'jarGroup': jarGroup,
      'image': image?.toJson(),
      'isActive': isActive,
      'isFixedContribution': isFixedContribution,
      'acceptedContributionAmount': acceptedContributionAmount,
      'goalAmount': goalAmount,
      'deadline': deadline?.toIso8601String(),
      'currency': currency,
      'creator': creator.toJson(),
      'invitedCollectors':
          invitedCollectors
              .map((invitedCollector) => invitedCollector.toJson())
              .toList(),
      'paymentLink': paymentLink,
      'acceptAnonymousContributions': acceptAnonymousContributions,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'totalContributions': totalContributions,
      'totalContributors': totalContributors,
      'progressPercentage': progressPercentage,
    };
  }

  /// Create a copy of the jar with updated values
  JarModel copyWith({
    String? id,
    String? name,
    String? description,
    String? jarGroup,
    MediaModel? image,
    bool? isActive,
    bool? isFixedContribution,
    double? acceptedContributionAmount,
    double? goalAmount,
    DateTime? deadline,
    String? currency,
    UserModel? creator,
    List<InvitedCollector>? invitedCollectors,
    String? paymentLink,
    bool? acceptAnonymousContributions,
    List<String>? acceptedPaymentMethods,
    DateTime? createdAt,
    DateTime? updatedAt,
    double? totalContributions,
    int? totalContributors,
    double? progressPercentage,
  }) {
    return JarModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      jarGroup: jarGroup ?? this.jarGroup,
      image: image ?? this.image,
      isActive: isActive ?? this.isActive,
      isFixedContribution: isFixedContribution ?? this.isFixedContribution,
      acceptedContributionAmount:
          acceptedContributionAmount ?? this.acceptedContributionAmount,
      goalAmount: goalAmount ?? this.goalAmount,
      deadline: deadline ?? this.deadline,
      currency: currency ?? this.currency,
      creator: creator ?? this.creator,
      invitedCollectors: invitedCollectors ?? this.invitedCollectors,
      paymentLink: paymentLink ?? this.paymentLink,
      acceptAnonymousContributions:
          acceptAnonymousContributions ?? this.acceptAnonymousContributions,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      totalContributions: totalContributions ?? this.totalContributions,
      totalContributors: totalContributors ?? this.totalContributors,
      progressPercentage: progressPercentage ?? this.progressPercentage,
    );
  }

  /// Check if the jar has a deadline
  bool get hasDeadline => deadline != null;

  /// Check if the jar deadline has passed
  bool get isExpired => hasDeadline && deadline!.isBefore(DateTime.now());

  /// Check if the jar goal has been reached
  bool get isGoalReached => goalAmount > 0 && totalContributions >= goalAmount;

  /// Get remaining amount to reach goal
  double get remainingAmount =>
      goalAmount > totalContributions ? goalAmount - totalContributions : 0;

  /// Check if the user is the creator of this jar
  bool isCreator(String userId) => creator.id == userId;

  /// Check if the user is a collector for this jar
  bool isCollector(String userId) => invitedCollectors.any(
    (invitedCollector) => invitedCollector.collector?.id == userId,
  );

  /// Check if the user can contribute to this jar (is creator or collector)
  bool canUserContribute(String userId) =>
      isCreator(userId) || isCollector(userId);

  /// Get formatted currency symbol for this jar
  String get currencySymbol {
    switch (currency.toLowerCase()) {
      case 'ghc':
        return '₵';
      case 'ngn':
        return '₦';
      case 'usd':
        return '\$';
      case 'eur':
        return '€';
      case 'gbp':
        return '£';
      default:
        return currency.toUpperCase();
    }
  }

  /// Get all accepted invited collectors
  List<InvitedCollector> get acceptedCollectors =>
      invitedCollectors.where((collector) => collector.isAccepted).toList();

  /// Get all pending invited collectors
  List<InvitedCollector> get pendingCollectors =>
      invitedCollectors.where((collector) => collector.isPending).toList();

  /// Get count of accepted collectors
  int get acceptedCollectorCount => acceptedCollectors.length;

  /// Get count of pending collectors
  int get pendingCollectorCount => pendingCollectors.length;

  /// Check if user has been invited (either accepted or pending)
  bool isUserInvited(String userId) => invitedCollectors.any(
    (invitedCollector) => invitedCollector.collector?.id == userId,
  );
}

/// Media model representing uploaded files/images
class MediaModel {
  final String id;
  final String alt;
  final String filename;
  final String? mimeType;
  final int? filesize;
  final int? width;
  final int? height;
  final String? url;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const MediaModel({
    required this.id,
    required this.alt,
    required this.filename,
    this.mimeType,
    this.filesize,
    this.width,
    this.height,
    this.url,
    this.createdAt,
    this.updatedAt,
  });

  factory MediaModel.fromJson(Map<String, dynamic> json) {
    return MediaModel(
      id: json['id'] as String,
      alt:
          json['alt'] as String? ??
          '', // alt is required in PayloadCMS but make it safe
      filename: json['filename'] as String,
      mimeType: json['mimeType'] as String?,
      filesize: json['filesize'] as int?,
      width: json['width'] as int?,
      height: json['height'] as int?,
      url: json['url'] as String?,
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
      'alt': alt,
      'filename': filename,
      'mimeType': mimeType,
      'filesize': filesize,
      'width': width,
      'height': height,
      'url': url,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

/// User model for jar creators and collectors
class UserModel {
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

  const UserModel({
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

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      fullName: json['fullName'] as String,
      phoneNumber: json['phoneNumber'] as String,
      countryCode: json['countryCode'] as String? ?? '',
      country: json['country'] as String,
      isKYCVerified: json['isKYCVerified'] as bool? ?? false,
      photo:
          json['photo'] != null
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
      'photo': photo?.toJson(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  /// Get user initials for avatar display
  String get initials {
    final words = fullName.trim().split(' ');
    if (words.isEmpty) return '?';

    if (words.length == 1) {
      return words[0].isNotEmpty ? words[0][0].toUpperCase() : '?';
    } else {
      return '${words[0][0].toUpperCase()}${words[1][0].toUpperCase()}';
    }
  }

  /// Get formatted phone number with country code
  String get formattedPhoneNumber => '$countryCode$phoneNumber';
}
