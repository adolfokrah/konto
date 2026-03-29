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

  const ChargesModel({
    required this.platformCharge,
    required this.amountPaidByContributor,
    required this.hogapayRevenue,
    required this.eganowFees,
    required this.discountPercent,
    required this.discountAmount,
    required this.amountToSendToEganow,
  });

  factory ChargesModel.fromJson(Map<String, dynamic> json) {
    return ChargesModel(
      platformCharge: (json['platformCharge'] as num?)?.toDouble() ?? 0.0,
      amountPaidByContributor:
          (json['amountPaidByContributor'] as num?)?.toDouble() ?? 0.0,
      hogapayRevenue: (json['hogapayRevenue'] as num?)?.toDouble() ?? 0.0,
      eganowFees: (json['eganowFees'] as num?)?.toDouble() ?? 0.0,
      discountPercent: (json['discountPercent'] as num?)?.toDouble() ?? 0.0,
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? 0.0,
      amountToSendToEganow:
          (json['amountToSendToEganow'] as num?)?.toDouble() ?? 0.0,
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
