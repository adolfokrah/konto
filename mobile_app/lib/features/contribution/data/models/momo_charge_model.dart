/// Model representing mobile money charge response data from Paystack
/// Based on the charge-momo endpoint response structure
class MomoChargeModel {
  final String? id;
  final String? reference;
  final String status;
  final String? displayText;
  final double? amount;
  final String? currency;
  final String? gatewayResponse;
  final String? message;
  final DateTime? createdAt;
  final DateTime? transactionDate;
  final String? channel;
  final String? domain;
  final DateTime? paidAt;

  const MomoChargeModel({
    this.id,
    this.reference,
    required this.status,
    this.displayText,
    this.amount,
    this.currency,
    this.gatewayResponse,
    this.message,
    this.createdAt,
    this.transactionDate,
    this.channel,
    this.domain,
    this.paidAt,
  });

  /// Create MomoChargeModel from JSON response
  factory MomoChargeModel.fromJson(Map<String, dynamic> json) {
    return MomoChargeModel(
      id: json['id']?.toString(),
      reference: json['reference'] as String?,
      status: json['status'] as String? ?? 'failed',
      displayText: json['display_text'] as String?,
      amount:
          json['amount'] != null ? (json['amount'] as num).toDouble() : null,
      currency: json['currency'] as String?,
      gatewayResponse: json['gateway_response'] as String?,
      message: json['message'] as String?,
      createdAt:
          json['created_at'] != null
              ? DateTime.tryParse(json['created_at'] as String)
              : null,
      transactionDate:
          json['transaction_date'] != null
              ? DateTime.tryParse(json['transaction_date'] as String)
              : null,
      channel: json['channel'] as String?,
      domain: json['domain'] as String?,
      paidAt:
          json['paid_at'] != null
              ? DateTime.tryParse(json['paid_at'] as String)
              : null,
    );
  }

  /// Convert MomoChargeModel to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reference': reference,
      'status': status,
      'display_text': displayText,
      'amount': amount,
      'currency': currency,
      'gateway_response': gatewayResponse,
      'message': message,
      'created_at': createdAt?.toIso8601String(),
      'transaction_date': transactionDate?.toIso8601String(),
      'channel': channel,
      'domain': domain,
      'paid_at': paidAt?.toIso8601String(),
    };
  }

  /// Helper getters for better UX
  bool get isSuccess => status == 'success';
  bool get isFailed => status == 'failed';
  bool get isPending => status == 'pending';
  bool get isPayOffline => status == 'pay_offline';
  bool get isSendOtp => status == 'send_otp';

  /// Check if the charge requires offline authorization (MTN, ATL)
  bool get requiresOfflineAuthorization => isPayOffline;

  /// Check if the charge requires OTP (Vodafone)
  bool get requiresOtp => isSendOtp;

  /// Get formatted amount with currency
  String get formattedAmount {
    if (amount == null || currency == null) return 'N/A';
    return '$currency ${(amount! / 100).toStringAsFixed(2)}'; // Convert from subunits
  }

  /// Get display text for user instructions
  String get userInstructions {
    return displayText ?? 'Please complete the payment process';
  }

  /// Create a copy of this model with updated fields
  MomoChargeModel copyWith({
    String? id,
    String? reference,
    String? status,
    String? displayText,
    double? amount,
    String? currency,
    String? gatewayResponse,
    String? message,
    DateTime? createdAt,
    DateTime? transactionDate,
    String? channel,
    String? domain,
    DateTime? paidAt,
  }) {
    return MomoChargeModel(
      id: id ?? this.id,
      reference: reference ?? this.reference,
      status: status ?? this.status,
      displayText: displayText ?? this.displayText,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      gatewayResponse: gatewayResponse ?? this.gatewayResponse,
      message: message ?? this.message,
      createdAt: createdAt ?? this.createdAt,
      transactionDate: transactionDate ?? this.transactionDate,
      channel: channel ?? this.channel,
      domain: domain ?? this.domain,
      paidAt: paidAt ?? this.paidAt,
    );
  }

  @override
  String toString() {
    return 'MomoChargeModel(id: $id, reference: $reference, status: $status, amount: $formattedAmount)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MomoChargeModel &&
        other.id == id &&
        other.reference == reference &&
        other.status == status;
  }

  @override
  int get hashCode => id.hashCode ^ reference.hashCode ^ status.hashCode;
}
