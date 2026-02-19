import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../logic/bloc/onboarding_bloc.dart';
import 'package:go_router/go_router.dart';

class WalkThrough extends StatefulWidget {
  const WalkThrough({super.key});

  @override
  State<WalkThrough> createState() => _WalkThroughState();
}

class _WalkThroughState extends State<WalkThrough> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<String> _walkThroughImages = [
    "assets/images/walk/start.png",
    "assets/images/walk/one.png",
    "assets/images/walk/two.png",
    "assets/images/walk/three.png",
    "assets/images/walk/four.png",
    "assets/images/walk/five.png",
    "assets/images/walk/six.png",
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int page) {
    setState(() {
      _currentPage = page;
    });
    debugPrint('Showing walkthrough page: $page');
  }

  void _completeWalkthrough() {
    debugPrint(
      '🎉 Walkthrough completed, dispatching OnboardingFinished event',
    );
    context.read<OnboardingBloc>().add(OnboardingFinished());
    if (mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // PageView with images
          PageView.builder(
            controller: _pageController,
            onPageChanged: _onPageChanged,
            itemCount: _walkThroughImages.length,
            itemBuilder: (context, index) {
              return Container(
                width: double.infinity,
                height: double.infinity,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage(_walkThroughImages[index]),
                    fit: BoxFit.cover,
                  ),
                ),
              );
            },
          ),

          // Progress indicators
          Positioned(
            top: MediaQuery.of(context).padding.top + 20,
            left: 20,
            right: 20,
            child: Row(
              children: List.generate(
                _walkThroughImages.length,
                (index) => Expanded(
                  child: Container(
                    height: 3,
                    margin: EdgeInsets.only(
                      right: index < _walkThroughImages.length - 1 ? 4 : 0,
                    ),
                    decoration: BoxDecoration(
                      color:
                          index <= _currentPage
                              ? Colors.white
                              : Colors.grey.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Skip/Done button
          Positioned(
            top: MediaQuery.of(context).padding.top + 30,
            right: 20,
            child: GestureDetector(
              onTap: _completeWalkthrough,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _currentPage == _walkThroughImages.length - 1
                      ? 'Done'
                      : 'Skip',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
