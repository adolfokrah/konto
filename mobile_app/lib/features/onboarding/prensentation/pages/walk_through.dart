import 'package:flutter/material.dart';
import 'package:story_view/controller/story_controller.dart';
import 'package:story_view/utils.dart';
import 'package:story_view/widgets/story_view.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../logic/bloc/onboarding_bloc.dart';

class WalkThrough extends StatefulWidget {
  const WalkThrough({super.key});

  @override
  State<WalkThrough> createState() => _WalkThroughState();
}

class _WalkThroughState extends State<WalkThrough> {
  final StoryController controller = StoryController();

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final List<StoryItem> storyItems = [
      StoryItem.pageProviderImage(
        const AssetImage("assets/images/walk/start.png"),
        imageFit: BoxFit.cover,
        duration: const Duration(seconds: 3),
      ),
      StoryItem.pageProviderImage(
        const AssetImage("assets/images/walk/one.png"),
        imageFit: BoxFit.cover,
        duration: const Duration(seconds: 3),
      ),
      StoryItem.pageProviderImage(
        const AssetImage("assets/images/walk/two.png"),
        imageFit: BoxFit.cover,
        duration: const Duration(seconds: 3),
      ),
      StoryItem.pageProviderImage(
        const AssetImage("assets/images/walk/three.png"),
        imageFit: BoxFit.cover,
        duration: const Duration(seconds: 3),
      ),
      StoryItem.pageProviderImage(
        const AssetImage("assets/images/walk/four.png"),
        imageFit: BoxFit.cover,
        duration: const Duration(seconds: 3),
      ),
      StoryItem.pageProviderImage(
        const AssetImage("assets/images/walk/five.png"),
        imageFit: BoxFit.cover,
        duration: const Duration(seconds: 3),
      ),
      StoryItem.pageProviderImage(
        const AssetImage("assets/images/walk/six.png"),
        imageFit: BoxFit.cover,
        duration: const Duration(seconds: 3),
      ),
    ];

    return Scaffold(
      backgroundColor: Colors.black,
      body: StoryView(
        storyItems: storyItems,
        controller: controller,
        repeat: false, // Don't repeat the stories
        inline: false, // Full screen mode
        onStoryShow: (storyItem, index) {
          // Callback when a story is shown
          debugPrint('Showing story at index: $index');
        },
        onComplete: () {
          // When all stories are completed, dispatch event to complete walkthrough
          debugPrint(
            '🎉 All stories completed, dispatching OnboardingFinished event',
          );
          context.read<OnboardingBloc>().add(OnboardingFinished());
          // Pop the screen
          if (mounted) {
            Navigator.of(context).pop();
          }
        },
        onVerticalSwipeComplete: (direction) {
          if (direction == Direction.down) {
            context.read<OnboardingBloc>().add(OnboardingFinished());
            Navigator.of(context).pop();
          }
        },
        progressPosition: ProgressPosition.top,
        indicatorForegroundColor: Colors.white,
        indicatorColor: Colors.grey.withValues(alpha: 0.4),
      ),
    );
  }
}
