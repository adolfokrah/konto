part of 'onboarding_bloc.dart';

@immutable
sealed class OnboardingEvent {}

final class PageChanged extends OnboardingEvent {
  final int pageIndex;
  
  PageChanged(this.pageIndex);
}
