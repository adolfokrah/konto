class PaymentMethodModel {
  final String id;
  final String type;
  final String slug;

  const PaymentMethodModel({required this.id, required this.type, required this.slug});

  factory PaymentMethodModel.fromJson(Map<String, dynamic> json) {
    return PaymentMethodModel(
      id: json['id'] as String,
      type: json['type'] as String,
      slug: json['slug'] as String? ?? json['type'] as String,
    );
  }
}
