/// Models for the Jar List API response
class JarList {
  final List<JarGroup> groups;

  const JarList({required this.groups});

  factory JarList.fromJson(List<dynamic> json) {
    return JarList(
      groups:
          json
              .map((item) => JarGroup.fromJson(item as Map<String, dynamic>))
              .toList(),
    );
  }

  /// Create JarList from API response that has success/data structure
  factory JarList.fromApiResponse(Map<String, dynamic> apiResponse) {
    final data = apiResponse['data'] as List<dynamic>? ?? [];
    return JarList.fromJson(data);
  }

  List<Map<String, dynamic>> toJson() {
    return groups.map((group) => group.toJson()).toList();
  }

  /// Get all jars across all groups
  List<JarListItem> get allJars {
    return groups.expand((group) => group.jars).toList();
  }

  /// Get total number of jars
  int get totalJarCount {
    return groups.fold(0, (total, group) => total + group.jarCount);
  }

  /// Get ungrouped jars group if it exists
  JarGroup? get ungroupedGroup {
    try {
      return groups.firstWhere((group) => group.isUngrouped);
    } catch (e) {
      return null;
    }
  }
}

class JarGroup {
  final String id;
  final String name;
  final String? description;
  final List<JarListItem> jars;
  final int totalJars;
  final double totalGoalAmount;
  final double totalContributions;
  final String? createdAt;
  final String? updatedAt;

  const JarGroup({
    required this.id,
    required this.name,
    this.description,
    required this.jars,
    required this.totalJars,
    required this.totalGoalAmount,
    required this.totalContributions,
    this.createdAt,
    this.updatedAt,
  });

  factory JarGroup.fromJson(Map<String, dynamic> json) {
    return JarGroup(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      jars:
          (json['jars'] as List<dynamic>?)
              ?.map(
                (item) => JarListItem.fromJson(item as Map<String, dynamic>),
              )
              .toList() ??
          [],
      totalJars: json['totalJars'] ?? 0,
      totalGoalAmount: (json['totalGoalAmount'] ?? 0).toDouble(),
      totalContributions: (json['totalContributions'] ?? 0).toDouble(),
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'jars': jars.map((jar) => jar.toJson()).toList(),
      'totalJars': totalJars,
      'totalGoalAmount': totalGoalAmount,
      'totalContributions': totalContributions,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  /// Returns true if this is the ungrouped jars group
  bool get isUngrouped => id == 'ungrouped';

  /// Returns the total number of jars in this group
  int get jarCount => jars.length;

  /// Returns the average goal amount per jar
  double get averageGoalAmount =>
      totalJars > 0 ? totalGoalAmount / totalJars : 0;

  /// Returns the completion percentage (contributions vs goal)
  double get completionPercentage {
    if (totalGoalAmount <= 0) return 0;
    return (totalContributions / totalGoalAmount) * 100;
  }
}

class JarListItem {
  final String id;
  final String name;
  final String? description;
  final JarImage? image;
  final bool isActive;
  final bool isFixedContribution;
  final double? acceptedContributionAmount;
  final double goalAmount;
  final String? deadline;
  final String currency; // 'ghc' | 'ngn'
  final JarCreator creator;
  final List<JarInvitedCollector> invitedCollectors;
  final String? paymentLink;
  final bool acceptAnonymousContributions;
  final List<String> acceptedPaymentMethods;
  final String createdAt;
  final String updatedAt;
  final double totalContributions;

  const JarListItem({
    required this.id,
    required this.name,
    this.description,
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
    required this.acceptedPaymentMethods,
    required this.createdAt,
    required this.updatedAt,
    required this.totalContributions,
  });

  factory JarListItem.fromJson(Map<String, dynamic> json) {
    return JarListItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      image:
          json['image'] != null
              ? JarImage.fromJson(json['image'] as Map<String, dynamic>)
              : null,
      isActive: json['isActive'] ?? true,
      isFixedContribution: json['isFixedContribution'] ?? false,
      acceptedContributionAmount:
          json['acceptedContributionAmount']?.toDouble(),
      goalAmount: (json['goalAmount'] ?? 0).toDouble(),
      deadline: json['deadline'],
      currency: json['currency'] ?? 'ghc',
      creator: JarCreator.fromJson(json['creator'] as Map<String, dynamic>),
      invitedCollectors:
          (json['invitedCollectors'] as List<dynamic>?)
              ?.map(
                (item) =>
                    JarInvitedCollector.fromJson(item as Map<String, dynamic>),
              )
              .toList() ??
          [],
      paymentLink: json['paymentLink'],
      acceptAnonymousContributions:
          json['acceptAnonymousContributions'] ?? false,
      acceptedPaymentMethods:
          (json['acceptedPaymentMethods'] as List<dynamic>?)
              ?.map((item) => item.toString())
              .toList() ??
          [],
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
      totalContributions: (json['totalContributions'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'image': image?.toJson(),
      'isActive': isActive,
      'isFixedContribution': isFixedContribution,
      'acceptedContributionAmount': acceptedContributionAmount,
      'goalAmount': goalAmount,
      'deadline': deadline,
      'currency': currency,
      'creator': creator.toJson(),
      'invitedCollectors':
          invitedCollectors.map((collector) => collector.toJson()).toList(),
      'paymentLink': paymentLink,
      'acceptAnonymousContributions': acceptAnonymousContributions,
      'acceptedPaymentMethods': acceptedPaymentMethods,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'totalContributions': totalContributions,
    };
  }
}

class JarImage {
  final String id;
  final String url;
  final String filename;

  const JarImage({required this.id, required this.url, required this.filename});

  factory JarImage.fromJson(Map<String, dynamic> json) {
    return JarImage(
      id: json['id'] ?? '',
      url: json['url'] ?? '',
      filename: json['filename'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'url': url, 'filename': filename};
  }
}

class JarCreator {
  final String id;
  final String name;
  final UserProfilePicture? profilePicture;

  const JarCreator({required this.id, required this.name, this.profilePicture});

  factory JarCreator.fromJson(Map<String, dynamic> json) {
    return JarCreator(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      profilePicture:
          json['profilePicture'] != null
              ? UserProfilePicture.fromJson(
                json['profilePicture'] as Map<String, dynamic>,
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'profilePicture': profilePicture?.toJson()};
  }
}

class JarCollector {
  final String id;
  final String name;
  final UserProfilePicture? profilePicture;

  const JarCollector({
    required this.id,
    required this.name,
    this.profilePicture,
  });

  factory JarCollector.fromJson(Map<String, dynamic> json) {
    return JarCollector(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      profilePicture:
          json['profilePicture'] != null
              ? UserProfilePicture.fromJson(
                json['profilePicture'] as Map<String, dynamic>,
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'profilePicture': profilePicture?.toJson()};
  }
}

class JarInvitedCollector {
  final JarCollector? collector;
  final String? phoneNumber;
  final String? name;
  final String status; // 'accepted' | 'pending'

  const JarInvitedCollector({
    this.collector,
    this.phoneNumber,
    this.name,
    required this.status,
  });

  factory JarInvitedCollector.fromJson(Map<String, dynamic> json) {
    return JarInvitedCollector(
      collector:
          json['collector'] != null
              ? JarCollector.fromJson(json['collector'] as Map<String, dynamic>)
              : null,
      phoneNumber: json['phoneNumber'] as String?,
      name: json['name'] as String?,
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'collector': collector?.toJson(),
      'phoneNumber': phoneNumber,
      'name': name,
      'status': status,
    };
  }
}

class UserProfilePicture {
  final String id;
  final String url;

  const UserProfilePicture({required this.id, required this.url});

  factory UserProfilePicture.fromJson(Map<String, dynamic> json) {
    return UserProfilePicture(id: json['id'] ?? '', url: json['url'] ?? '');
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'url': url};
  }
}
