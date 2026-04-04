/// Result of a GET /api/transactions/get-charges call.
/// Reflects the full fee breakdown including any per-user discount.
class ChargesModel {
  final double platformCharge;
  final double amountPaidByContributor;
  final double hogapayRevenue;
  final double eganowFees;
  final double discountPercent;
  final double discountAmount;
  final double amountToSendToEganow;
  final double minimumContributionAmount;

  const ChargesModel({
    required this.platformCharge,
    required this.amountPaidByContributor,
    required this.hogapayRevenue,
    required this.eganowFees,
    required this.discountPercent,
    required this.discountAmount,
    required this.amountToSendToEganow,
    this.minimumContributionAmount = 2.0,
  });

  factory ChargesModel.fromJson(Map<String, dynamic> json) {
    final initialAmount = (json['initialAmount'] as num?)?.toDouble() ?? 0.0;
    final processingFee = (json['processingFee'] as num?)?.toDouble() ??
        (json['platformCharge'] as num?)?.toDouble() ??
        0.0;
    final feePaidBy = json['collectionFeePaidBy'] as String? ?? 'contributor';
    final amountPaidByContributor =
        (json['amountPaidByContributor'] as num?)?.toDouble() ??
            (feePaidBy == 'contributor'
                ? initialAmount + processingFee
                : initialAmount);

    return ChargesModel(
      platformCharge: processingFee,
      amountPaidByContributor: amountPaidByContributor,
      hogapayRevenue: (json['hogapayRevenue'] as num?)?.toDouble() ?? 0.0,
      eganowFees: (json['eganowFees'] as num?)?.toDouble() ?? 0.0,
      discountPercent: (json['discountPercent'] as num?)?.toDouble() ?? 0.0,
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? 0.0,
      amountToSendToEganow:
          (json['amountToSendToEganow'] as num?)?.toDouble() ?? 0.0,
      minimumContributionAmount:
          (json['minimumContributionAmount'] as num?)?.toDouble() ?? 2.0,
    );
  }

  bool get hasDiscount => discountPercent > 0 && discountAmount > 0;

  /// Fallback — compute from flat fee percent when API is unavailable.
  static ChargesModel fromFlatFee({
    required double amount,
    required double collectionFeePercent,
  }) {
    final fee = (amount * collectionFeePercent) / 100;
    return ChargesModel(
      platformCharge: fee,
      amountPaidByContributor: amount + fee,
      hogapayRevenue: 0,
      eganowFees: fee,
      discountPercent: 0,
      discountAmount: 0,
      amountToSendToEganow: amount,
    );
  }
}
