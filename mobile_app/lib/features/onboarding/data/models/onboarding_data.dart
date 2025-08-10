import 'package:flutter/material.dart';
import 'package:konto/core/constants/button_variants.dart';

class OnBoardingData {
  final String title;
  final String description;
  final Color backgroundColor;
  final ButtonVariant buttonVariant;
  final String buttonText;
  final String illustration;

  OnBoardingData({
    required this.title,
    required this.description,
    required this.backgroundColor,
    required this.buttonVariant,
    required this.buttonText,
    required this.illustration,
  });
}
