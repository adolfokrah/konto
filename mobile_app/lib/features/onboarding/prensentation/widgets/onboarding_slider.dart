import 'package:flutter/material.dart';
import 'package:konto/core/constants/onboarding_data.dart';

class OnBoardingSlider extends StatelessWidget {
  final int currentPage; // Placeholder for current page index
  OnBoardingSlider({super.key, required this.currentPage});
  final PageController _pageController = PageController();

  @override
  Widget build(BuildContext context) {
     return Expanded(
        child: PageView.builder(
          controller: _pageController,
          onPageChanged: (index) {
            
          },
          itemCount: onBoardingData.length,
          itemBuilder: (context, index) {
            return Center(
              child: Image.asset(
                onBoardingData[index].illustration,
                width: 700,
                height: 700,
                fit: BoxFit.contain,
              ),
            );
          },
        ),
      );
  }
}