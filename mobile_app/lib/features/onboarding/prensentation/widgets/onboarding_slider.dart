import 'package:flutter/material.dart';
import 'package:Hoga/core/constants/localized_onboarding_data.dart';

class OnBoardingSlider extends StatefulWidget {
  final int currentPage;
  final Function(int)? onPageChanged;

  const OnBoardingSlider({
    super.key,
    required this.currentPage,
    this.onPageChanged,
  });

  @override
  State<OnBoardingSlider> createState() => _OnBoardingSliderState();
}

class _OnBoardingSliderState extends State<OnBoardingSlider> {
  late PageController _pageController;
  bool _isAnimating = false;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: widget.currentPage);
  }

  @override
  void didUpdateWidget(OnBoardingSlider oldWidget) {
    super.didUpdateWidget(oldWidget);

    // If currentPage changed externally (e.g., from button click), animate to that page
    if (widget.currentPage != oldWidget.currentPage && !_isAnimating) {
      _animateToPage(widget.currentPage);
    }
  }

  void _animateToPage(int page) {
    _isAnimating = true;
    _pageController
        .animateToPage(
          page,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        )
        .then((_) {
          _isAnimating = false;
        });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localizedOnBoardingData = LocalizedOnboardingData.getOnboardingData(
      context,
    );

    return Expanded(
      child: PageView.builder(
        controller: _pageController,
        onPageChanged: (index) {
          if (!_isAnimating) {
            widget.onPageChanged?.call(index);
          }
        },
        itemCount: localizedOnBoardingData.length,
        itemBuilder: (context, index) {
          return Center(
            child: Image.asset(
              localizedOnBoardingData[index].illustration,
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
