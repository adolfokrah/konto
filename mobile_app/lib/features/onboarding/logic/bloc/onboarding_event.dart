part of 'onboarding_bloc.dart';

@immutable
sealed class OnboardingEvent {}

final class PageChanged extends OnboardingEvent {
  final int pageIndex;

  PageChanged(this.pageIndex);
}

final class OnboardingFinished extends OnboardingEvent {}

final class CheckOnboardingStatus extends OnboardingEvent {}

final class ResetOnboarding extends OnboardingEvent {}
