class SystemSettingsModel {
  final double collectionFee;
  final double transferFeePercentage;
  final double minimumPayoutAmount;
  final String? payoutProcessingMessage;

  SystemSettingsModel({
    required this.collectionFee,
    required this.transferFeePercentage,
    required this.minimumPayoutAmount,
    this.payoutProcessingMessage,
  });

  factory SystemSettingsModel.fromJson(Map<String, dynamic> json) {
    return SystemSettingsModel(
      collectionFee: (json['collectionFee'] as num?)?.toDouble() ?? 1.95,
      transferFeePercentage: (json['transferFeePercentage'] as num?)?.toDouble() ?? 1.0,
      minimumPayoutAmount: (json['minimumPayoutAmount'] as num?)?.toDouble() ?? 10.0,
      payoutProcessingMessage: json['payoutProcessingMessage'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'collectionFee': collectionFee,
      'transferFeePercentage': transferFeePercentage,
      'minimumPayoutAmount': minimumPayoutAmount,
      'payoutProcessingMessage': payoutProcessingMessage,
    };
  }

  // Default settings for fallback
  static SystemSettingsModel get defaultSettings => SystemSettingsModel(
        collectionFee: 1.95,
        transferFeePercentage: 1.0,
        minimumPayoutAmount: 10.0,
        payoutProcessingMessage: null,
      );

  /// Calculate collection fee for a given contribution amount
  double calculateCollectionFee(double amount) {
    return (amount * collectionFee) / 100;
  }

  /// Calculate total amount to pay including collection fee
  double calculateTotalWithCollectionFee(double contributionAmount) {
    final fee = calculateCollectionFee(contributionAmount);
    return contributionAmount + fee;
  }

  /// Calculate transfer fee for a given amount
  double calculateTransferFee(double amount) {
    return (amount * transferFeePercentage) / 100;
  }

  /// Calculate net payout amount after fee
  double calculateNetPayout(double grossAmount) {
    final fee = calculateTransferFee(grossAmount);
    return grossAmount - fee;
  }
}
