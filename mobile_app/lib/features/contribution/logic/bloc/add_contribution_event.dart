part of 'add_contribution_bloc.dart';

@immutable
sealed class AddContributionEvent {}

final class AddContributionSubmitted extends AddContributionEvent {
  final String jarId;
  final String? contributor;
  final String? contributorPhoneNumber;
  final String paymentMethod;
  final String? accountNumber;
  final double amountContributed;
  final bool viaPaymentLink;
  final String mobileMoneyProvider;

  AddContributionSubmitted({
    required this.jarId,
    this.contributor,
    this.contributorPhoneNumber,
    required this.paymentMethod,
    this.accountNumber,
    required this.amountContributed,
    this.viaPaymentLink = false,
    required this.mobileMoneyProvider,
  });
}
