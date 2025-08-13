import 'package:flutter/material.dart';
import 'package:konto/core/widgets/generic_picker.dart';
import 'package:konto/core/theme/text_styles.dart';

// Example usage of GenericPicker for different use cases

// 1. Simple String Picker (e.g., Categories)
void showCategoryPicker(BuildContext context) {
  final categories = [
    'Food',
    'Transport',
    'Entertainment',
    'Shopping',
    'Bills',
  ];

  GenericPicker.showPickerDialog<String>(
    context,
    selectedValue: 'Food',
    items: categories,
    onItemSelected: (category) {
      print('Selected category: $category');
    },
    title: 'Select Category',
    searchHint: 'Search categories...',
    recentSectionTitle: 'Recent Category',
    otherSectionTitle: 'All Categories',
    searchResultsTitle: 'Search Results',
    noResultsMessage: 'No categories found',
    searchFilter: (category) => category,
    isItemSelected: (category, selectedValue) => category == selectedValue,
    // Simple text item builder
    itemBuilder:
        (category, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(category, style: TextStyles.titleMedium),
          trailing: isSelected ? const Icon(Icons.check, size: 18) : null,
          onTap: onTap,
        ),
    // Same builder for recent and search results
    recentItemBuilder:
        (category, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(category, style: TextStyles.titleMedium),
          trailing: const Icon(Icons.history, size: 18),
          onTap: onTap,
        ),
    searchResultBuilder:
        (category, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(category, style: TextStyles.titleMedium),
          trailing: isSelected ? const Icon(Icons.check, size: 18) : null,
          onTap: onTap,
        ),
  );
}

// 2. Complex Object Picker (e.g., Payment Methods)
class PaymentMethod {
  final String id;
  final String name;
  final String description;
  final IconData icon;

  const PaymentMethod({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
  });
}

void showPaymentMethodPicker(BuildContext context) {
  final paymentMethods = [
    PaymentMethod(
      id: 'card',
      name: 'Credit Card',
      description: 'Pay with card',
      icon: Icons.credit_card,
    ),
    PaymentMethod(
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: Icons.account_balance,
    ),
    PaymentMethod(
      id: 'mobile',
      name: 'Mobile Money',
      description: 'Mobile wallet payment',
      icon: Icons.phone_android,
    ),
  ];

  GenericPicker.showPickerDialog<PaymentMethod>(
    context,
    selectedValue: 'card',
    items: paymentMethods,
    onItemSelected: (method) {
      print('Selected payment method: ${method.name}');
    },
    title: 'Select Payment Method',
    searchHint: 'Search payment methods...',
    searchFilter: (method) => '${method.name} ${method.description}',
    isItemSelected: (method, selectedValue) => method.id == selectedValue,
    // Rich item builder with icon and description
    itemBuilder:
        (method, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Icon(method.icon, size: 24),
          title: Text(method.name, style: TextStyles.titleMedium),
          subtitle: Text(method.description, style: TextStyles.titleRegularSm),
          trailing: isSelected ? const Icon(Icons.check, size: 18) : null,
          onTap: onTap,
        ),
    recentItemBuilder:
        (method, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Icon(method.icon, size: 24),
          title: Text(method.name, style: TextStyles.titleMedium),
          subtitle: Text('Recently used', style: TextStyles.titleRegularSm),
          trailing: const Icon(Icons.history, size: 18),
          onTap: onTap,
        ),
    searchResultBuilder:
        (method, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Icon(method.icon, size: 24),
          title: Text(method.name, style: TextStyles.titleMedium),
          subtitle: Text(method.description, style: TextStyles.titleRegularSm),
          trailing: isSelected ? const Icon(Icons.check, size: 18) : null,
          onTap: onTap,
        ),
  );
}

// 3. User Picker (e.g., Contact Selection)
class User {
  final String id;
  final String name;
  final String email;
  final String? avatar;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.avatar,
  });
}

void showUserPicker(BuildContext context) {
  final users = [
    User(id: '1', name: 'John Doe', email: 'john@example.com'),
    User(id: '2', name: 'Jane Smith', email: 'jane@example.com'),
    User(id: '3', name: 'Bob Johnson', email: 'bob@example.com'),
  ];

  GenericPicker.showPickerDialog<User>(
    context,
    selectedValue: '1',
    items: users,
    onItemSelected: (user) {
      print('Selected user: ${user.name}');
    },
    title: 'Select Contact',
    searchHint: 'Search contacts...',
    searchFilter: (user) => '${user.name} ${user.email}',
    isItemSelected: (user, selectedValue) => user.id == selectedValue,
    maxHeight: 0.8, // Custom height
    // User item builder with avatar
    itemBuilder:
        (user, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(
            backgroundColor: Colors.blue,
            child: Text(
              user.name[0],
              style: const TextStyle(color: Colors.white),
            ),
          ),
          title: Text(user.name, style: TextStyles.titleMedium),
          subtitle: Text(user.email, style: TextStyles.titleRegularSm),
          trailing: isSelected ? const Icon(Icons.check, size: 18) : null,
          onTap: onTap,
        ),
    recentItemBuilder:
        (user, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(
            backgroundColor: Colors.green,
            child: Text(
              user.name[0],
              style: const TextStyle(color: Colors.white),
            ),
          ),
          title: Text(user.name, style: TextStyles.titleMedium),
          subtitle: Text('Recent contact', style: TextStyles.titleRegularSm),
          onTap: onTap,
        ),
    searchResultBuilder:
        (user, isSelected, onTap) => ListTile(
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(
            backgroundColor: Colors.orange,
            child: Text(
              user.name[0],
              style: const TextStyle(color: Colors.white),
            ),
          ),
          title: Text(user.name, style: TextStyles.titleMedium),
          subtitle: Text(user.email, style: TextStyles.titleRegularSm),
          trailing: isSelected ? const Icon(Icons.check, size: 18) : null,
          onTap: onTap,
        ),
  );
}
