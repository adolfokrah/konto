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
    PaymentMethodOption('mobile-money', 'Mobile money', Icons.phone_android),
    PaymentMethodOption('cash', 'Cash', Icons.money),
    PaymentMethodOption(
      'bank-transfer',
      'Bank transfer',
      Icons.account_balance,
    ),
  ];

  /// Status options for contributions filter
  static const List<StatusOption> statuses = [
    StatusOption('pending', 'Pending'),
    StatusOption('completed', 'Completed'),
    StatusOption('failed', 'Failed'),
    StatusOption('transferred', 'Transferred'),
  ];

  /// Date filter options
  static const List<String> dateOptions = [
    'All',
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'Custom Range',
  ];

  /// Individual date option constants
  static const String defaultDateOption = 'All';
  static const String todayOption = 'Today';
  static const String yesterdayOption = 'Yesterday';
  static const String last7DaysOption = 'Last 7 Days';
  static const String last30DaysOption = 'Last 30 Days';
  static const String customDateRangeOption = 'Custom Range';
}
