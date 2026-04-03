class SystemSettingsModel {
  final double minimumContributionAmount;
  final double minimumPayoutAmount;
  final double settlementDelayHours;

  SystemSettingsModel({
    this.minimumContributionAmount = 2.0,
    this.minimumPayoutAmount = 10.0,
    this.settlementDelayHours = 0.033,
  });

  factory SystemSettingsModel.fromJson(Map<String, dynamic> json) {
    return SystemSettingsModel(
      minimumContributionAmount:
          (json['minimumContributionAmount'] as num?)?.toDouble() ?? 2.0,
      minimumPayoutAmount:
          (json['minimumPayoutAmount'] as num?)?.toDouble() ?? 10.0,
      settlementDelayHours:
          (json['settlementDelayHours'] as num?)?.toDouble() ?? 0.033,
    );
  }

  static SystemSettingsModel get defaultSettings => SystemSettingsModel();
}
