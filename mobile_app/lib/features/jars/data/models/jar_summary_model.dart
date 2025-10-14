// Models for the Jar Summary API response
import 'package:Hoga/core/utils/currency_utils.dart';

/// Enum representing the type of contribution
enum ContributionType {
  contribution('contribution'),
  transfer('transfer');

  const ContributionType(this.value);
  final String value;

  static ContributionType fromString(String value) {
    switch (value) {
      case 'contribution':
        return ContributionType.contribution;
      case 'transfer':
        return ContributionType.transfer;
      default:
        return ContributionType.contribution; // Default fallback
    }
  }
}

/// Enum for jar status
enum JarStatus {
  open,
  broken,
  sealed;

  /// Convert string to JarStatus
  static JarStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return JarStatus.open;
      case 'broken':
        return JarStatus.broken;
      case 'sealed':
        return JarStatus.sealed;
      default:
        return JarStatus.open; // Default fallback
    }
  }

  /// Convert JarStatus to string
  @override
  String toString() {
    return name;
  }
}

/// Model for payment method breakdown data
class PaymentMethodBreakdown {
  final double totalAmount;
  final int totalCount;

  const PaymentMethodBreakdown({
    required this.totalAmount,
    required this.totalCount,
  });

  factory PaymentMethodBreakdown.fromJson(Map<String, dynamic> json) {
    return PaymentMethodBreakdown(
      totalAmount: (json['totalAmount'] as num? ?? 0).toDouble(),
      totalCount: (json['totalCount'] as num? ?? 0).toInt(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'totalAmount': totalAmount, 'totalCount': totalCount};
  }
}

/// Model for transactions grouped by payment method
class TransactionByPaymentMethod {
  final String paymentMethod;
  final double totalContributions;

  const TransactionByPaymentMethod({
    required this.paymentMethod,
    required this.totalContributions,
  });

  factory TransactionByPaymentMethod.fromJson(Map<String, dynamic> json) {
    return TransactionByPaymentMethod(
      paymentMethod: json['paymentMethod'] as String,
      totalContributions: (json['totalContributions'] as num? ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'paymentMethod': paymentMethod,
      'totalContributions': totalContributions,
    };
  }
}

/// Model for balance breakdown financial data
class BalanceBreakDown {
  final double totalContributedAmount;
  final double totalTransfers;
  final double totalAmountTobeTransferred;
  final PaymentMethodBreakdown cash;
  final PaymentMethodBreakdown bankTransfer;
  final PaymentMethodBreakdown mobileMoney;
  final PaymentMethodBreakdown card;
  final PaymentMethodBreakdown applePay;

  const BalanceBreakDown({
    required this.totalContributedAmount,
    required this.totalTransfers,
    required this.totalAmountTobeTransferred,
    required this.cash,
    required this.bankTransfer,
    required this.mobileMoney,
    required this.card,
    required this.applePay,
  });

  factory BalanceBreakDown.fromJson(Map<String, dynamic> json) {
    // Helper function to extract payment method breakdown from nested structure
    PaymentMethodBreakdown extractPaymentMethodBreakdown(
      Map<String, dynamic> json,
      String key,
    ) {
      final methodData = json[key] as Map<String, dynamic>? ?? {};
      final capitalizedKey =
          key.substring(0, 1).toUpperCase() + key.substring(1);

      return PaymentMethodBreakdown(
        totalAmount:
            (methodData['total${capitalizedKey}Amount'] as num? ?? 0)
                .toDouble(),
        totalCount:
            (methodData['total${capitalizedKey}Count'] as num? ?? 0).toInt(),
      );
    }

    return BalanceBreakDown(
      totalContributedAmount:
          (json['totalContributedAmount'] as num? ?? 0).toDouble(),
      totalTransfers: (json['totalTransfers'] as num? ?? 0).toDouble(),
      totalAmountTobeTransferred:
          (json['totalAmountTobeTransferred'] as num? ?? 0).toDouble(),
      cash: extractPaymentMethodBreakdown(json, 'cash'),
      bankTransfer: extractPaymentMethodBreakdown(json, 'bankTransfer'),
      mobileMoney: extractPaymentMethodBreakdown(json, 'mobileMoney'),
      card: extractPaymentMethodBreakdown(json, 'card'),
      applePay: extractPaymentMethodBreakdown(json, 'applePay'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalContributedAmount': totalContributedAmount,
      'totalTransfers': totalTransfers,
      'totalAmountTobeTransferred': totalAmountTobeTransferred,
      'cash': {
        'totalCashAmount': cash.totalAmount,
        'totalCashCount': cash.totalCount,
      },
      'bankTransfer': {
        'totalBankTransferAmount': bankTransfer.totalAmount,
        'totalBankTransferCount': bankTransfer.totalCount,
      },
      'mobileMoney': {
        'totalMobileMoneyAmount': mobileMoney.totalAmount,
        'totalMobileMoneyCount': mobileMoney.totalCount,
      },
      'card': {
        'totalCardAmount': card.totalAmount,
        'totalCardCount': card.totalCount,
      },
      'applePay': {
        'totalApplePayAmount': applePay.totalAmount,
        'totalApplePayCount': applePay.totalCount,
      },
    };
  }
}

class JarSummaryModel {
  final String id;
  final String name;
  final String? description;

  /// Optional thank you message to display to contributors
  final String? thankYouMessage;
  final double goalAmount;
  final double acceptedContributionAmount;
  final String currency; // 'GHS' | 'ngn'
  final bool isActive;
  final bool isFixedContribution;
  final JarStatus status; // 'open' | 'broken' | 'sealed'
  final UserModel creator;
  final List<InvitedCollectorModel>? invitedCollectors;
  final String? link;
  final bool? showGoal;
  final bool? showRecentContributions;
  final bool? allowAnonymousContributions;
  final String? jarGroup;
  final MediaModel? image;
  final DateTime? deadline;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ContributionModel> contributions;
  final List<double>? chartData; // Chart data for last 10 days
  final List<TransactionByPaymentMethod>?
  transactionsByPaymentMethod; // Transactions grouped by payment method
  final BalanceBreakDown balanceBreakDown; // Financial breakdown
  final bool isCreator; // Whether the current user is the creator of this jar
  final String?
  whoPaysPlatformFees; // Who pays platform fees: 'creator' or 'contributors'

  const JarSummaryModel({
    required this.id,
    required this.name,
    this.description,
    this.thankYouMessage,
    required this.goalAmount,
    required this.acceptedContributionAmount,
    required this.currency,
    required this.isActive,
    required this.isFixedContribution,
    required this.status,
    required this.creator,
    this.invitedCollectors,
    this.link,
    this.showGoal,
    this.showRecentContributions,
    this.allowAnonymousContributions,
    this.jarGroup,
    this.image,
    this.deadline,
    required this.createdAt,
    required this.updatedAt,
    required this.contributions,
    this.chartData,
    this.transactionsByPaymentMethod,
    required this.balanceBreakDown,
    required this.isCreator,
    this.whoPaysPlatformFees,
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
    return CurrencyUtils.formatAmount(
      balanceBreakDown.totalContributedAmount,
      currency,
    );
  }

  /// Get formatted total transfers amount
  String get formattedTotalTransfers {
    return CurrencyUtils.formatAmount(
      balanceBreakDown.totalTransfers,
      currency,
    );
  }

  /// Get formatted total amount to be transferred
  String get formattedTotalAmountTobeTransferred {
    return CurrencyUtils.formatAmount(
      balanceBreakDown.totalAmountTobeTransferred,
      currency,
    );
  }

  /// Get formatted cash amount
  String get formattedCashAmount {
    return CurrencyUtils.formatAmount(
      balanceBreakDown.cash.totalAmount,
      currency,
    );
  }

  /// Get formatted bank transfer amount
  String get formattedBankTransferAmount {
    return CurrencyUtils.formatAmount(
      balanceBreakDown.bankTransfer.totalAmount,
      currency,
    );
  }

  /// Get formatted mobile money amount
  String get formattedMobileMoneyAmount {
    return CurrencyUtils.formatAmount(
      balanceBreakDown.mobileMoney.totalAmount,
      currency,
    );
  }

  /// Get cash contribution count
  int get cashContributionCount => balanceBreakDown.cash.totalCount;

  /// Get bank transfer contribution count
  int get bankTransferContributionCount =>
      balanceBreakDown.bankTransfer.totalCount;

  /// Get mobile money contribution count
  int get mobileMoneyContributionCount =>
      balanceBreakDown.mobileMoney.totalCount;

  /// Get currency symbol
  String get currencySymbol {
    return CurrencyUtils.getCurrencySymbol(currency);
  }

  /// Check if jar is active
  bool get isJarActive => status == JarStatus.open;

  /// Check if jar is broken
  bool get isJarBroken => status == JarStatus.broken;

  /// Check if jar is closed
  bool get isJarClosed => status == JarStatus.sealed;

  /// Get status display name
  String get statusDisplayName {
    switch (status) {
      case JarStatus.open:
        return 'Open';
      case JarStatus.broken:
        return 'Broken';
      case JarStatus.sealed:
        return 'Sealed';
    }
  }

  factory JarSummaryModel.fromJson(Map<String, dynamic> json) {
    return JarSummaryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      thankYouMessage: json['thankYouMessage'] as String?,
      goalAmount: (json['goalAmount'] as num? ?? 0).toDouble(),
      acceptedContributionAmount:
          (json['acceptedContributionAmount'] as num? ?? 0).toDouble(),
      currency: json['currency'] as String,
      isActive: json['isActive'] as bool,
      isFixedContribution: json['isFixedContribution'] as bool,
      status: JarStatus.fromString(json['status'] as String? ?? 'open'),
      creator: UserModel.fromJson(json['creator'] as Map<String, dynamic>),
      invitedCollectors:
          (json['invitedCollectors'] as List<dynamic>?)
              ?.map(
                (invitedCollector) => InvitedCollectorModel.fromJson(
                  invitedCollector as Map<String, dynamic>,
                ),
              )
              .toList(),
      link:
          json['paymentPage'] != null
              ? json['paymentPage']['link'] as String?
              : null,
      showGoal:
          json['paymentPage'] != null
              ? json['paymentPage']['showGoal'] as bool?
              : null,
      showRecentContributions:
          json['paymentPage'] != null
              ? json['paymentPage']['showRecentContributions'] as bool?
              : null,
      allowAnonymousContributions: json['allowAnonymousContributions'] as bool?,
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
      transactionsByPaymentMethod:
          json['transactionsByPaymentMethod'] != null
              ? (json['transactionsByPaymentMethod'] as List<dynamic>)
                  .map(
                    (transaction) => TransactionByPaymentMethod.fromJson(
                      transaction as Map<String, dynamic>,
                    ),
                  )
                  .toList()
              : null,
      balanceBreakDown:
          json['balanceBreakDown'] != null
              ? BalanceBreakDown.fromJson(
                json['balanceBreakDown'] as Map<String, dynamic>,
              )
              : const BalanceBreakDown(
                totalContributedAmount: 0,
                totalTransfers: 0,
                totalAmountTobeTransferred: 0,
                cash: PaymentMethodBreakdown(totalAmount: 0, totalCount: 0),
                bankTransfer: PaymentMethodBreakdown(
                  totalAmount: 0,
                  totalCount: 0,
                ),
                mobileMoney: PaymentMethodBreakdown(
                  totalAmount: 0,
                  totalCount: 0,
                ),
                card: PaymentMethodBreakdown(totalAmount: 0, totalCount: 0),
                applePay: PaymentMethodBreakdown(totalAmount: 0, totalCount: 0),
              ),
      isCreator: json['isCreator'] as bool? ?? false,
      whoPaysPlatformFees: json['whoPaysPlatformFees'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'thankYouMessage': thankYouMessage,
      'goalAmount': goalAmount,
      'acceptedContributionAmount': acceptedContributionAmount,
      'currency': currency,
      'isActive': isActive,
      'isFixedContribution': isFixedContribution,
      'status': status.toString(),
      'creator': creator.toJson(),
      'invitedCollectors':
          invitedCollectors
              ?.map((invitedCollector) => invitedCollector.toJson())
              .toList(),
      'paymentPage': {
        'link': link,
        'showGoal': showGoal,
        'showRecentContributions': showRecentContributions,
      },
      'allowAnonymousContributions': allowAnonymousContributions,
      'jarGroup': jarGroup,
      'image': image?.toJson(),
      'deadline': deadline?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'contributions':
          contributions.map((contribution) => contribution.toJson()).toList(),
      'chartData': chartData,
      'transactionsByPaymentMethod':
          transactionsByPaymentMethod
              ?.map((transaction) => transaction.toJson())
              .toList(),
      'balanceBreakDown': balanceBreakDown.toJson(),
      'isCreator': isCreator,
      'whoPaysPlatformFees': whoPaysPlatformFees,
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

  /// Helper method to parse photo field which can be:
  /// - null (no photo)
  /// - String (photo ID only)
  /// - Map<String, dynamic> (populated photo object)
  static MediaModel? _parsePhotoField(dynamic photoField) {
    if (photoField == null) {
      return null;
    }

    if (photoField is String) {
      // Photo is just an ID, create a minimal MediaModel
      return MediaModel(
        id: photoField,
        alt: '',
        filename: '',
        url: null, // URL not available when only ID is provided
      );
    }

    if (photoField is Map<String, dynamic>) {
      // Photo is a populated object
      return MediaModel.fromJson(photoField);
    }

    return null;
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      fullName: json['fullName'] as String,
      phoneNumber: json['phoneNumber'] as String,
      countryCode: json['countryCode'] as String? ?? '',
      country: json['country'] as String,
      isKYCVerified: json['isKYCVerified'] as bool? ?? false,
      photo: _parsePhotoField(json['photo']),
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

  /// Whether this user has a profile picture with a valid URL
  bool get hasProfilePicture => photo?.bestImageUrl != null;

  /// Get the best available profile picture URL
  String? get profilePictureUrl => photo?.bestImageUrl;

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
}

class InvitedCollectorModel {
  final UserModel collector;
  final String status; // 'accepted' | 'pending'

  const InvitedCollectorModel({required this.collector, required this.status});

  factory InvitedCollectorModel.fromJson(Map<String, dynamic> json) {
    return InvitedCollectorModel(
      collector: UserModel.fromJson(json['collector'] as Map<String, dynamic>),
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {'collector': collector.toJson(), 'status': status};
  }
}

class MediaSize {
  final int? width;
  final int? height;
  final String? url;
  final String? filename;
  final int? filesize;
  final String? mimeType;

  const MediaSize({
    this.width,
    this.height,
    this.url,
    this.filename,
    this.filesize,
    this.mimeType,
  });

  factory MediaSize.fromJson(Map<String, dynamic> json) {
    return MediaSize(
      width: json['width'] as int?,
      height: json['height'] as int?,
      url: json['url'] as String?,
      filename: json['filename'] as String?,
      filesize: json['filesize'] as int?,
      mimeType: json['mimeType'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'width': width,
      'height': height,
      'url': url,
      'filename': filename,
      'filesize': filesize,
      'mimeType': mimeType,
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
  final Map<String, MediaSize>? sizes;
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
    this.sizes,
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
      sizes:
          json['sizes'] != null
              ? (json['sizes'] as Map<String, dynamic>).map(
                (key, value) => MapEntry(
                  key,
                  MediaSize.fromJson(value as Map<String, dynamic>),
                ),
              )
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

  /// Returns the best available image URL, prioritizing thumbnail over original
  String? get bestImageUrl {
    // Try to get thumbnail from sizes first
    if (sizes != null) {
      // Priority order: thumbnail, small, medium, large, original
      final preferredSizes = ['thumbnail', 'small', 'medium', 'large'];

      for (final sizeKey in preferredSizes) {
        final size = sizes![sizeKey];
        if (size?.url != null) {
          return size!.url;
        }
      }
    }

    // Fallback to original URL
    return url;
  }

  /// Whether this media has a valid image URL
  bool get hasValidImage => bestImageUrl != null;

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
      if (sizes != null)
        'sizes': sizes!.map((key, value) => MapEntry(key, value.toJson())),
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
  final String? paymentMethod; // 'mobile-money' | 'bank' | 'cash'
  final String? accountNumber; // Account number for bank transfers
  final double amountContributed;
  final double? charges; // Optional charges associated with the contribution
  final String
  paymentStatus; // 'pending' | 'completed' | 'failed' | 'transferred'
  final UserModel? collector;
  final bool? viaPaymentLink;
  final ContributionType type; // contribution | transfer
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
    required this.type,
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
      type: ContributionType.fromString(
        json['type'] as String? ?? 'contribution',
      ),
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
      'type': type.value,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  /// Helper getters for contribution type
  bool get isContribution => type == ContributionType.contribution;
  bool get isTransfer => type == ContributionType.transfer;
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
