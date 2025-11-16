import 'package:flutter/material.dart';

/// Data classes for filter options
class PaymentMethodOption {
  final String value;
  final String label;
  final IconData icon;

  const PaymentMethodOption(this.value, this.label, this.icon);
}

class StatusOption {
  final String value;
  final String label;

  const StatusOption(this.value, this.label);
}

/// Constants for filter options used in contributions
class FilterOptions {
  // Private constructor to prevent instantiation
  FilterOptions._();

  /// Payment method options for contributions filter
  static const List<PaymentMethodOption> paymentMethods = [
    PaymentMethodOption(
      'mobile-money',
      'mobileMoneyPayment',
      Icons.phone_android,
    ),
    PaymentMethodOption('cash', 'cashPayment', Icons.money),
    // PaymentMethodOption('bank', 'bankTransferPayment', Icons.account_balance),
    PaymentMethodOption('card', 'cardPayment', Icons.credit_card),
    // PaymentMethodOption('apple-pay', 'applePayPayment', Icons.apple),
  ];

  /// Status options for contributions filter
  static const List<StatusOption> statuses = [
    StatusOption('pending', 'statusPending'),
    StatusOption('completed', 'statusCompleted'),
    StatusOption('failed', 'statusFailed'),
    StatusOption('transferred', 'statusTransferred'),
  ];

  /// Date filter options (using translation keys)
  static const List<String> dateOptions = [
    'dateAll',
    'dateToday',
    'dateYesterday',
    'dateLast7Days',
    'dateLast30Days',
    'dateCustomRange',
  ];

  /// Individual date option constants (using translation keys)
  static const String defaultDateOption = 'dateAll';
  static const String todayOption = 'dateToday';
  static const String yesterdayOption = 'dateYesterday';
  static const String last7DaysOption = 'dateLast7Days';
  static const String last30DaysOption = 'dateLast30Days';
  static const String customDateRangeOption = 'dateCustomRange';
}
