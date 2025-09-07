part of 'user_account_bloc.dart';

@immutable
sealed class UserAccountEvent {}

final class UpdatePersonalDetails extends UserAccountEvent {
  final String? fullName;
  final String? phoneNumber;
  final String? countryCode;
  final String? country;
  final String? email;
  final String? accountNumber;
  final String? bank;
  final String? accountHolder;
  final AppTheme? appTheme;

  UpdatePersonalDetails({
    this.fullName,
    this.phoneNumber,
    this.countryCode,
    this.country,
    this.email,
    this.accountNumber,
    this.bank,
    this.accountHolder,
    this.appTheme,
  });
}
