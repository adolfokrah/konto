part of 'export_contributions_bloc.dart';

abstract class ExportContributionsEvent extends Equatable {
  const ExportContributionsEvent();
  @override
  List<Object?> get props => [];
}

class TriggerExportContributions extends ExportContributionsEvent {
  final String jarId;
  final List<String>? paymentMethods;
  final List<String>? statuses;
  final List<String>? collectors;
  final List<String>? transactionTypes;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? contributor;

  const TriggerExportContributions({
    required this.jarId,
    this.paymentMethods,
    this.statuses,
    this.collectors,
    this.transactionTypes,
    this.startDate,
    this.endDate,
    this.contributor,
  });

  @override
  List<Object?> get props => [
    jarId,
    paymentMethods,
    statuses,
    collectors,
    transactionTypes,
    startDate,
    endDate,
    contributor,
  ];
}
