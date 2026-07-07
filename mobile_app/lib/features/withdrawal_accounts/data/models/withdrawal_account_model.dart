/// Model representing a saved withdrawal (payout) account.
///
/// Backend collection: `withdrawal-accounts`.
class WithdrawalAccountModel {
  final String id;
  final String type; // 'mobile-money' | 'bank'
  final String provider; // momo: 'mtn'|'telecel'; bank: Eganow bank code
  final String accountNumber;
  final String accountHolder;
  final String? label;
  final bool isDefault;
  final bool verified;

  const WithdrawalAccountModel({
    required this.id,
    required this.type,
    required this.provider,
    required this.accountNumber,
    required this.accountHolder,
    this.label,
    this.isDefault = false,
    this.verified = false,
  });

  bool get isMobileMoney => type == 'mobile-money';

  bool get isBank => type == 'bank';

  /// Masked account number for display, keeping the last 4 characters visible.
  String get maskedAccountNumber {
    final value = accountNumber.trim();
    if (value.length <= 4) return value;
    final visible = value.substring(value.length - 4);
    return '•••• $visible';
  }

  factory WithdrawalAccountModel.fromJson(Map<String, dynamic> json) {
    return WithdrawalAccountModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      type: (json['type'] ?? '').toString(),
      provider: (json['provider'] ?? '').toString(),
      accountNumber: (json['accountNumber'] ?? '').toString(),
      accountHolder: (json['accountHolder'] ?? '').toString(),
      label: json['label']?.toString(),
      isDefault: json['isDefault'] == true,
      verified: json['verified'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'provider': provider,
      'accountNumber': accountNumber,
      'accountHolder': accountHolder,
      if (label != null) 'label': label,
      'isDefault': isDefault,
      'verified': verified,
    };
  }
}

/// Model representing a bank returned by `GET /transactions/banks`.
class BankModel {
  final String code;
  final String name;

  const BankModel({required this.code, required this.name});

  factory BankModel.fromJson(Map<String, dynamic> json) {
    return BankModel(
      code: (json['code'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
    );
  }
}
