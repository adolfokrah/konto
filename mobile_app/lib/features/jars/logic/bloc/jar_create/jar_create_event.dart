part of 'jar_create_bloc.dart';

@immutable
sealed class JarCreateEvent {}

final class JarCreateSubmitted extends JarCreateEvent {
  final String name;
  final String? description;
  final String? imageId;
  final bool isActive;
  final bool isFixedContribution;
  final double? acceptedContributionAmount;
  final double? goalAmount;
  final DateTime? deadline;
  final String currency;
  final bool acceptAnonymousContributions;
  final List<Map<String, dynamic>>? invitedCollectors;
  final String jarGroup;

  JarCreateSubmitted({
    required this.name,
    this.description,
    this.imageId,
    this.isActive = true,
    this.isFixedContribution = false,
    this.acceptedContributionAmount,
    this.goalAmount,
    this.deadline,
    required this.currency,
    this.acceptAnonymousContributions = false,
    this.invitedCollectors,
    required this.jarGroup,
  });
}
