class BankModel {
  final String name;
  final String code;
  final String slug;
  final String type;

  const BankModel({
    required this.name,
    required this.code,
    required this.slug,
    required this.type,
  });

  factory BankModel.fromJson(Map<String, dynamic> json) {
    return BankModel(
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      type: json['type'] as String? ?? '',
    );
  }
}
