import 'package:flutter/material.dart';

/// Demo page to showcase the OTP verification flow
class VerificationDemo extends StatelessWidget {
  const VerificationDemo({super.key});

  @override
  Widget build(BuildContext context) {
    // Navigate to OTP view with demo phone number
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.pushReplacementNamed(
        context,
        '/otp',
        arguments: {'phoneNumber': '+1 234 567 8900'},
      );
    });

    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
