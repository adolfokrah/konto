/// Comprehensive Contribution model representing a single contribution with all its properties and relationships
/// Based on the Contributions collection schema from PayloadCMS

/// Model representing a user session within a user object
class UserSession {
  final String id;
  final DateTime createdAt;
  final DateTime expiresAt;

  const UserSession({
    required this.id,
    required this.createdAt,
    required this.expiresAt,
  });

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      id: json['id'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt.toIso8601String(),
      'expiresAt': expiresAt.toIso8601String(),
    };
  }
}

/// Model representing app settings within a user object
class UserAppSettings {
  final String language;
  final bool darkMode;
  final bool biometricAuthEnabled;
  final UserNotificationSettings notificationsSettings;

  const UserAppSettings({
    required this.language,
    required this.darkMode,
    required this.biometricAuthEnabled,
    required this.notificationsSettings,
  });

  factory UserAppSettings.fromJson(Map<String, dynamic> json) {
    return UserAppSettings(
      language: json['language'] as String? ?? 'en',
      darkMode: json['darkMode'] as bool? ?? false,
      biometricAuthEnabled: json['biometricAuthEnabled'] as bool? ?? false,
      notificationsSettings: UserNotificationSettings.fromJson(
        json['notificationsSettings'] as Map<String, dynamic>? ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'language': language,
      'darkMode': darkMode,
      'biometricAuthEnabled': biometricAuthEnabled,
      'notificationsSettings': notificationsSettings.toJson(),
    };
  }
}

/// Model representing notification settings within user app settings
class UserNotificationSettings {
  final bool pushNotificationsEnabled;
  final bool emailNotificationsEnabled;
  final bool smsNotificationsEnabled;

  const UserNotificationSettings({
    required this.pushNotificationsEnabled,
    required this.emailNotificationsEnabled,
    required this.smsNotificationsEnabled,
  });

  factory UserNotificationSettings.fromJson(Map<String, dynamic> json) {
    return UserNotificationSettings(
      pushNotificationsEnabled:
          json['pushNotificationsEnabled'] as bool? ?? true,
      emailNotificationsEnabled:
          json['emailNotificationsEnabled'] as bool? ?? true,
      smsNotificationsEnabled:
          json['smsNotificationsEnabled'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pushNotificationsEnabled': pushNotificationsEnabled,
      'emailNotificationsEnabled': emailNotificationsEnabled,
      'smsNotificationsEnabled': smsNotificationsEnabled,
    };
  }
}

/// Model representing a user within the contribution
class ContributionUser {
  final String id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String countryCode;
  final String country;
  final bool isKYCVerified;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<UserSession> sessions;
  final UserAppSettings appSettings;

  const ContributionUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    required this.countryCode,
    required this.country,
    required this.isKYCVerified,
    required this.createdAt,
    required this.updatedAt,
    required this.sessions,
    required this.appSettings,
  });

  factory ContributionUser.fromJson(Map<String, dynamic> json) {
    return ContributionUser(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      phoneNumber: json['phoneNumber'] as String,
      countryCode: json['countryCode'] as String,
      country: json['country'] as String,
      isKYCVerified: json['isKYCVerified'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      sessions:
          (json['sessions'] as List<dynamic>?)
              ?.map(
                (session) =>
                    UserSession.fromJson(session as Map<String, dynamic>),
              )
              .toList() ??
          [],
      appSettings: UserAppSettings.fromJson(
        json['appSettings'] as Map<String, dynamic>? ?? {},
      ),
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
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'sessions': sessions.map((session) => session.toJson()).toList(),
      'appSettings': appSettings.toJson(),
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

/// Model representing an invited collector within a jar
class JarInvitedCollector {
  final ContributionUser? collector;
  final String? phoneNumber;
  final String? name;
  final String status; // 'accepted' | 'pending'
  final String? id;

  const JarInvitedCollector({
    this.collector,
    this.phoneNumber,
    this.name,
    required this.status,
    this.id,
  });

  factory JarInvitedCollector.fromJson(Map<String, dynamic> json) {
    return JarInvitedCollector(
      collector:
          json['collector'] != null
              ? ContributionUser.fromJson(
                json['collector'] as Map<String, dynamic>,
              )
              : null,
      phoneNumber: json['phoneNumber'] as String?,
      name: json['name'] as String?,
      status: json['status'] as String? ?? 'pending',
      id: json['id'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (collector != null) 'collector': collector!.toJson(),
      if (phoneNumber != null) 'phoneNumber': phoneNumber,
      if (name != null) 'name': name,
      'status': status,
      if (id != null) 'id': id,
    };
  }

  bool get isAccepted => status == 'accepted';
  bool get isPending => status == 'pending';
}

/// Model representing a jar within the contribution
class ContributionJar {
  final String id;
  final String name;
  final String jarGroup;
  final dynamic image; // Can be null or media object
  final bool isActive;
  final bool isFixedContribution;
  final double goalAmount;
  final String currency;
  final ContributionUser creator;
  final List<JarInvitedCollector> invitedCollectors;
  final bool acceptAnonymousContributions;
  final List<String> acceptedPaymentMethods;
  final String status;
  final String paymentLink;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ContributionJar({
    required this.id,
    required this.name,
    required this.jarGroup,
    this.image,
    required this.isActive,
    required this.isFixedContribution,
    required this.goalAmount,
    required this.currency,
    required this.creator,
    required this.invitedCollectors,
    required this.acceptAnonymousContributions,
    required this.acceptedPaymentMethods,
    required this.status,
    required this.paymentLink,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ContributionJar.fromJson(Map<String, dynamic> json) {
    return ContributionJar(
      id: json['id'] as String,
      name: json['name'] as String,
      jarGroup: json['jarGroup'] as String? ?? '',
      image: json['image'], // Keep as dynamic for now
      isActive: json['isActive'] as bool? ?? true,
      isFixedContribution: json['isFixedContribution'] as bool? ?? false,
      goalAmount: (json['goalAmount'] as num? ?? 0).toDouble(),
      currency: json['currency'] as String,
      creator: ContributionUser.fromJson(
        json['creator'] as Map<String, dynamic>,
      ),
      invitedCollectors:
          (json['invitedCollectors'] as List<dynamic>?)
              ?.map(
                (collector) => JarInvitedCollector.fromJson(
                  collector as Map<String, dynamic>,
                ),
              )
              .toList() ??
          [],
      acceptAnonymousContributions:
          json['acceptAnonymousContributions'] as bool? ?? false,
      acceptedPaymentMethods: List<String>.from(
        json['acceptedPaymentMethods'] as List<dynamic>? ?? [],
      ),
      status: json['status'] as String,
      paymentLink: json['paymentLink'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'jarGroup': jarGroup,
      'image': image,
      'isActive': isActive,
      'isFixedContribution': isFixedContribution,
      'goalAmount': goalAmount,
      'currency': currency,
      'creator': creator.toJson(),
      'invitedCollectors':
          invitedCollectors.map((collector) => collector.toJson()).toList(),
      'acceptAnonymousContributions': acceptAnonymousContributions,
      'acceptedPaymentMethods': acceptedPaymentMethods,
      'status': status,
      'paymentLink': paymentLink,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

/// Main Contribution model
class ContributionModel {
  final String id;
  final ContributionJar jar;
  final String? contributor;
  final String? contributorPhoneNumber;
  final String? paymentMethod; // 'mobile-money' | 'bank-transfer' | 'cash'
  final String? accountNumber;
  final double amountContributed;
  final double? charges; // Optional charges associated with the contribution
  final String
  paymentStatus; // 'pending' | 'completed' | 'failed' | 'transferred'
  final ContributionUser collector;
  final bool viaPaymentLink;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ContributionModel({
    required this.id,
    required this.jar,
    this.contributor,
    this.contributorPhoneNumber,
    this.paymentMethod,
    this.accountNumber,
    required this.amountContributed,
    this.charges,
    required this.paymentStatus,
    required this.collector,
    required this.viaPaymentLink,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ContributionModel.fromJson(Map<String, dynamic> json) {
    return ContributionModel(
      id: json['id'] as String,
      jar: ContributionJar.fromJson(json['jar'] as Map<String, dynamic>),
      contributor: json['contributor'] as String?,
      contributorPhoneNumber: json['contributorPhoneNumber'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
      accountNumber: json['accountNumber'] as String?,
      amountContributed: (json['amountContributed'] as num).toDouble(),
      charges:
          json['charges'] != null ? (json['charges'] as num).toDouble() : null,
      paymentStatus: json['paymentStatus'] as String,
      collector: ContributionUser.fromJson(
        json['collector'] as Map<String, dynamic>,
      ),
      viaPaymentLink: json['viaPaymentLink'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'jar': jar.toJson(),
      if (contributor != null) 'contributor': contributor,
      if (contributorPhoneNumber != null)
        'contributorPhoneNumber': contributorPhoneNumber,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (accountNumber != null) 'accountNumber': accountNumber,
      'amountContributed': amountContributed,
      if (charges != null) 'charges': charges,
      'paymentStatus': paymentStatus,
      'collector': collector.toJson(),
      'viaPaymentLink': viaPaymentLink,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Create a copy of the contribution with updated values
  ContributionModel copyWith({
    String? id,
    ContributionJar? jar,
    String? contributor,
    String? contributorPhoneNumber,
    String? paymentMethod,
    String? accountNumber,
    double? amountContributed,
    double? charges,
    String? paymentStatus,
    ContributionUser? collector,
    bool? viaPaymentLink,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ContributionModel(
      id: id ?? this.id,
      jar: jar ?? this.jar,
      contributor: contributor ?? this.contributor,
      contributorPhoneNumber:
          contributorPhoneNumber ?? this.contributorPhoneNumber,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      accountNumber: accountNumber ?? this.accountNumber,
      amountContributed: amountContributed ?? this.amountContributed,
      charges: charges ?? this.charges,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      collector: collector ?? this.collector,
      viaPaymentLink: viaPaymentLink ?? this.viaPaymentLink,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Helper getters for better UX
  bool get isPending => paymentStatus == 'pending';
  bool get isCompleted => paymentStatus == 'completed';
  bool get isFailed => paymentStatus == 'failed';
  bool get isTransferred => paymentStatus == 'transferred';

  bool get isMobileMoney => paymentMethod == 'mobile-money';
  bool get isBankTransfer => paymentMethod == 'bank-transfer';
  bool get isCash => paymentMethod == 'cash';

  /// Get formatted amount with currency
  String get formattedAmount =>
      '${jar.currency.toUpperCase()} ${amountContributed.toStringAsFixed(2)}';

  /// Get contributor display name (fallback to phone number if name is null)
  String get contributorDisplayName =>
      contributor ?? contributorPhoneNumber ?? 'Konto';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ContributionModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'ContributionModel(id: $id, contributor: $contributor, amount: $amountContributed, status: $paymentStatus)';
  }
}
