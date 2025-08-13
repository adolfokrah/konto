import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:meta/meta.dart';

part 'onboarding_event.dart';
part 'onboarding_state.dart';

class OnboardingBloc extends Bloc<OnboardingEvent, OnboardingState> {
  OnboardingBloc() : super(OnboardingInitial()) {
    on<PageChanged>((event, emit) {
      emit(OnboardingPageState(event.pageIndex));
    });
    on<OnboardingFinished>((event, emit) async {
      try {
        await ServiceRegistry().onboardingRepository.completeOnboarding();
        emit(OnboardingCompleted());
      } catch (e) {
        // Still emit completed to avoid blocking user
        emit(OnboardingCompleted());
      }
    });
    on<CheckOnboardingStatus>((event, emit) async {
      try {
        final onboardingCompleted = await ServiceRegistry().onboardingRepository.checkOnboardingStatus();
        if (onboardingCompleted) {
          emit(OnboardingCompleted());
        } else {
          emit(OnboardingPageState(0)); // Start from first page
        }
      } catch (e) {
        emit(OnboardingPageState(0)); // Start from first page on error
      }
    });
    on<ResetOnboarding>((event, emit) async {
      try {
        await ServiceRegistry().onboardingRepository.resetOnboarding();
        emit(OnboardingPageState(0)); // Start from first page
      } catch (e) {
        // Handle reset error if needed
        emit(OnboardingPageState(0)); // Start from first page
      }
    });
  }
}
