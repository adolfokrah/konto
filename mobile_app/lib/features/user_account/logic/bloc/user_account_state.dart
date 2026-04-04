part of 'user_account_bloc.dart';

@immutable
sealed class UserAccountState {}

final class UserAccountInitial extends UserAccountState {}

final class UserAccountLoading extends UserAccountState {}

final class UserAccountSuccess extends UserAccountState {
  final User updatedUser;
  final String token;

  UserAccountSuccess({required this.updatedUser, required this.token});
}

final class UserAccountError extends UserAccountState {
  final String message;

  UserAccountError({required this.message});
}

final class PaymentMethodsLoaded extends UserAccountState {
  final List<PaymentMethodModel> paymentMethods;
  PaymentMethodsLoaded({required this.paymentMethods});
}

final class BanksLoaded extends UserAccountState {
  final List<BankModel> banks;
  final String paystackType;
  BanksLoaded({required this.banks, required this.paystackType});
}
