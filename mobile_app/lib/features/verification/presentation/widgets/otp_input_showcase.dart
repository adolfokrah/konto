import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/app_spacing.dart';
import 'package:Hoga/core/theme/text_styles.dart';
import 'package:Hoga/core/widgets/otp_input.dart';

/// Widget to showcase different OTP input variations
class OtpInputShowcase extends StatefulWidget {
  const OtpInputShowcase({super.key});

  @override
  State<OtpInputShowcase> createState() => _OtpInputShowcaseState();
}

class _OtpInputShowcaseState extends State<OtpInputShowcase> {
  String _standardOtp = '';
  String _compactOtp = '';
  String _simpleOtp = '';
  String _errorOtp = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'OTP Input Showcase',
          style: AppTextStyles.titleMediumM.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.spacingS),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.spacingM),

              // Standard OTP Input
              _buildSection(
                title: 'Standard OTP Input (6 digits)',
                child: AppOtpInput(
                  length: 6,
                  onChanged: (otp) => setState(() => _standardOtp = otp),
                  onCompleted:
                      (otp) => _showSnackBar('Standard OTP completed: $otp'),
                ),
                currentValue: _standardOtp,
              ),

              const SizedBox(height: AppSpacing.spacingL * 2),

              // Compact OTP Input
              _buildSection(
                title: 'Compact OTP Input (4 digits)',
                child: CompactOtpInput(
                  length: 4,
                  onChanged: (otp) => setState(() => _compactOtp = otp),
                  onCompleted:
                      (otp) => _showSnackBar('Compact OTP completed: $otp'),
                ),
                currentValue: _compactOtp,
              ),

              const SizedBox(height: AppSpacing.spacingL * 2),

              // Simple OTP Input
              _buildSection(
                title: 'Simple OTP Input (5 digits)',
                child: SimpleOtpInput(
                  length: 5,
                  onChanged: (otp) => setState(() => _simpleOtp = otp),
                  onCompleted:
                      (otp) => _showSnackBar('Simple OTP completed: $otp'),
                ),
                currentValue: _simpleOtp,
              ),

              const SizedBox(height: AppSpacing.spacingL * 2),

              // Error State OTP Input
              _buildSection(
                title: 'Error State OTP Input',
                child: AppOtpInput(
                  length: 6,
                  hasError: true,
                  onChanged: (otp) => setState(() => _errorOtp = otp),
                  onCompleted:
                      (otp) => _showSnackBar('Error OTP completed: $otp'),
                ),
                currentValue: _errorOtp,
              ),

              const SizedBox(height: AppSpacing.spacingL * 2),

              // Obscured OTP Input
              _buildSection(
                title: 'Obscured OTP Input (Security)',
                child: AppOtpInput(
                  length: 6,
                  obscureText: true,
                  onChanged: (otp) => {},
                  onCompleted:
                      (otp) => _showSnackBar(
                        'Secure OTP completed: ${"*" * otp.length}',
                      ),
                ),
                currentValue: '******',
              ),

              const SizedBox(height: AppSpacing.spacingL * 2),

              // Disabled OTP Input
              _buildSection(
                title: 'Disabled OTP Input',
                child: const AppOtpInput(
                  length: 6,
                  enabled: false,
                  initialValue: '123456',
                ),
                currentValue: '123456',
              ),

              const SizedBox(height: AppSpacing.spacingL),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required Widget child,
    required String currentValue,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTextStyles.titleMediumM.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.spacingXs),
        Text(
          'Current value: $currentValue',
          style: AppTextStyles.titleRegularM.copyWith(
            color: Theme.of(
              context,
            ).colorScheme.onSurface.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: AppSpacing.spacingM),
        Center(child: child),
      ],
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 2)),
    );
  }
}
