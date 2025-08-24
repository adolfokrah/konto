// Models for the Jar Summary API response
import 'package:konto/core/utils/currency_utils.dart';

class JarSummaryModel {
  final String id;
  final String name;
  final String? description;
  final double goalAmount;
  final double acceptedContributionAmount;
  final String currency; // 'ghc' | 'ngn'
  final bool isActive;
  final bool isFixedContribution;
  final UserModel creator;
  final List<InvitedCollectorModel>? invitedCollectors;
  final List<String> acceptedPaymentMethods;
  final bool acceptAnonymousContributions;
  final String? paymentLink;
  final String? jarGroup;
  final MediaModel? image;
  final DateTime? deadline;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ContributionModel> contributions;
  final List<double>? chartData; // Chart data for last 10 days
  final double totalContributedAmount; // Total amount from all contributions

  const JarSummaryModel({
    required this.id,
    required this.name,
    this.description,
    required this.goalAmount,
    required this.acceptedContributionAmount,
    required this.currency,
    required this.isActive,
    required this.isFixedContribution,
    required this.creator,
    this.invitedCollectors,
    required this.acceptedPaymentMethods,
    required this.acceptAnonymousContributions,
    this.paymentLink,
    this.jarGroup,
    this.image,
    this.deadline,
    required this.createdAt,
    required this.updatedAt,
    required this.contributions,
    this.chartData,
    required this.totalContributedAmount,
  });

  /// Utility function to calculate total contributions from completed contributions
  double get totalContributions {
    return contributions
        .where((contribution) => contribution.paymentStatus == 'completed')
        .fold(
          0.0,
          (total, contribution) => total + contribution.amountContributed,
        );
  }

  /// Utility function to get formatted total contributions with currency
  String get formattedTotalContributions {
    final total = totalContributions;
    return CurrencyUtils.formatAmount(total, currency);
  }

  /// Utility function to get formatted total contributed amount from API with currency
  String get formattedTotalContributedAmount {
    return CurrencyUtils.formatAmount(totalContributedAmount, currency);
  }

  /// Get currency symbol
  String get currencySymbol {
    return CurrencyUtils.getCurrencySymbol(currency);
  }

  factory JarSummaryModel.fromJson(Map<String, dynamic> json) {
    return JarSummaryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      goalAmount: (json['goalAmount'] as num? ?? 0).toDouble(),
      acceptedContributionAmount:
          (json['acceptedContributionAmount'] as num? ?? 0).toDouble(),
      currency: json['currency'] as String,
      isActive: json['isActive'] as bool,
      isFixedContribution: json['isFixedContribution'] as bool,
      creator: UserModel.fromJson(json['creator'] as Map<String, dynamic>),
      invitedCollectors:
          (json['invitedCollectors'] as List<dynamic>?)
              ?.map(
                (invitedCollector) => InvitedCollectorModel.fromJson(
                  invitedCollector as Map<String, dynamic>,
                ),
              )
              .toList(),
      acceptedPaymentMethods:
          (json['acceptedPaymentMethods'] as List<dynamic>)
              .map((method) => method as String)
              .toList(),
      acceptAnonymousContributions:
          json['acceptAnonymousContributions'] as bool,
      paymentLink: json['paymentLink'] as String?,
      jarGroup: json['jarGroup'] as String?,
      image:
          json['image'] != null
              ? MediaModel.fromJson(json['image'] as Map<String, dynamic>)
              : null,
      deadline:
          json['deadline'] != null
              ? DateTime.parse(json['deadline'] as String)
              : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      contributions:
          json['contributions'] is List
              ? (json['contributions'] as List<dynamic>)
                  .map(
                    (contribution) => ContributionModel.fromJson(
                      contribution as Map<String, dynamic>,
                    ),
                  )
                  .toList()
              : json['contributions'] is Map &&
                  json['contributions']['docs'] is List
              ? (json['contributions']['docs'] as List<dynamic>)
                  .map(
                    (contribution) => ContributionModel.fromJson(
                      contribution as Map<String, dynamic>,
                    ),
                  )
                  .toList()
              : <ContributionModel>[],
      chartData:
          json['chartData'] != null
              ? (json['chartData'] as List<dynamic>)
                  .map((value) => (value as num? ?? 0).toDouble())
                  .toList()
              : null,
      totalContributedAmount:
          (json['totalContributedAmount'] as num? ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'goalAmount': goalAmount,
      'acceptedContributionAmount': acceptedContributionAmount,
      'currency': currency,
      'isActive': isActive,
      'isFixedContribution': isFixedContribution,
      'creator': creator.toJson(),
      'invitedCollectors':
          invitedCollectors
              ?.map((invitedCollector) => invitedCollector.toJson())
              .toList(),
      'acceptedPaymentMethods': acceptedPaymentMethods,
      'acceptAnonymousContributions': acceptAnonymousContributions,
      'paymentLink': paymentLink,
      'jarGroup': jarGroup,
      'image': image?.toJson(),
      'deadline': deadline?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'contributions':
          contributions.map((contribution) => contribution.toJson()).toList(),
      'chartData': chartData,
      'totalContributedAmount': totalContributedAmount,
    };
  }
}

class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String countryCode;
  final String country;
  final bool isKYCVerified;
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
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

class InvitedCollectorModel {
  final UserModel? collector;
  final String? phoneNumber;
  final String? name;
  final String status; // 'accepted' | 'pending'

  const InvitedCollectorModel({
    this.collector,
    this.phoneNumber,
    this.name,
    required this.status,
  });

  factory InvitedCollectorModel.fromJson(Map<String, dynamic> json) {
    return InvitedCollectorModel(
      collector:
          json['collector'] != null
              ? UserModel.fromJson(json['collector'] as Map<String, dynamic>)
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

class ContributionModel {
  final String id;
  final dynamic
  jar; // Can be String ID or populated JarModel - keep as dynamic for flexibility
  final String? contributor;
  final String? contributorPhoneNumber;
  final String? paymentMethod; // 'mobile-money' | 'bank-transfer' | 'cash'
  final String? accountNumber; // Account number for bank transfers
  final double amountContributed;
  final double? charges; // Optional charges associated with the contribution
  final String
  paymentStatus; // 'pending' | 'completed' | 'failed' | 'transferred'
  final UserModel? collector;
  final bool? viaPaymentLink;
  final DateTime? createdAt;
  final DateTime? updatedAt;

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
    this.collector,
    this.viaPaymentLink,
    this.createdAt,
    this.updatedAt,
  });

  factory ContributionModel.fromJson(Map<String, dynamic> json) {
    return ContributionModel(
      id: json['id'] as String,
      jar: json['jar'], // Keep as dynamic - can be String or Map
      contributor: json['contributor'] as String?,
      contributorPhoneNumber: json['contributorPhoneNumber'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
      accountNumber: json['accountNumber'] as String?,
      amountContributed: (json['amountContributed'] as num? ?? 0).toDouble(),
      charges:
          json['charges'] != null ? (json['charges'] as num).toDouble() : null,
      paymentStatus: json['paymentStatus'] as String,
      collector:
          json['collector'] != null
              ? UserModel.fromJson(json['collector'] as Map<String, dynamic>)
              : null, // Provide a fallback empty UserModel
      viaPaymentLink: json['viaPaymentLink'] as bool?,
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
      'jar': jar is Map ? jar : jar.toString(), // Handle both cases
      'contributor': contributor,
      'contributorPhoneNumber': contributorPhoneNumber,
      'paymentMethod': paymentMethod,
      'accountNumber': accountNumber,
      'amountContributed': amountContributed,
      'charges': charges,
      'paymentStatus': paymentStatus,
      'collector': collector?.toJson(),
      'viaPaymentLink': viaPaymentLink,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

class ContributionsPaginatedModel {
  final List<ContributionModel> docs;
  final int totalDocs;
  final int limit;
  final int page;
  final int totalPages;
  final bool hasNextPage;
  final bool hasPrevPage;
  final int? nextPage;
  final int? prevPage;

  const ContributionsPaginatedModel({
    required this.docs,
    required this.totalDocs,
    required this.limit,
    required this.page,
    required this.totalPages,
    required this.hasNextPage,
    required this.hasPrevPage,
    this.nextPage,
    this.prevPage,
  });

  factory ContributionsPaginatedModel.fromJson(Map<String, dynamic> json) {
    return ContributionsPaginatedModel(
      docs:
          (json['docs'] as List<dynamic>)
              .map(
                (doc) =>
                    ContributionModel.fromJson(doc as Map<String, dynamic>),
              )
              .toList(),
      totalDocs: json['totalDocs'] as int,
      limit: json['limit'] as int,
      page: json['page'] as int,
      totalPages: json['totalPages'] as int,
      hasNextPage: json['hasNextPage'] as bool,
      hasPrevPage: json['hasPrevPage'] as bool,
      nextPage: json['nextPage'] as int?,
      prevPage: json['prevPage'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'docs': docs.map((doc) => doc.toJson()).toList(),
      'totalDocs': totalDocs,
      'limit': limit,
      'page': page,
      'totalPages': totalPages,
      'hasNextPage': hasNextPage,
      'hasPrevPage': hasPrevPage,
      'nextPage': nextPage,
      'prevPage': prevPage,
    };
  }
}

class JarSummaryResponse {
  final bool success;
  final JarSummaryModel data;
  final String? message;

  const JarSummaryResponse({
    required this.success,
    required this.data,
    this.message,
  });

  factory JarSummaryResponse.fromJson(Map<String, dynamic> json) {
    return JarSummaryResponse(
      success: json['success'] as bool,
      data: JarSummaryModel.fromJson(json['data'] as Map<String, dynamic>),
      message: json['message'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'data': data.toJson(), 'message': message};
  }
}

class JarSummaryErrorResponse {
  final bool success;
  final String message;

  const JarSummaryErrorResponse({required this.success, required this.message});

  factory JarSummaryErrorResponse.fromJson(Map<String, dynamic> json) {
    return JarSummaryErrorResponse(
      success: json['success'] as bool,
      message: json['message'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message};
  }
}
