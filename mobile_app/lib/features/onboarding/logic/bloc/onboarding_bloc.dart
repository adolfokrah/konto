import 'package:bloc/bloc.dart';
import 'package:konto/features/onboarding/data/repositories/onboarding_repository.dart';
import 'package:meta/meta.dart';

part 'onboarding_event.dart';
part 'onboarding_state.dart';

class OnboardingBloc extends Bloc<OnboardingEvent, OnboardingState> {
  final OnboardingRepository onboardingRepository;
  OnboardingBloc({required this.onboardingRepository}) : super(OnboardingPageState(0)) {
    on<PageChanged>((event, emit) {
      emit(OnboardingPageState(event.pageIndex));
    });
    on<OnboardingFinished>((event, emit) async {
      try {
        await onboardingRepository.completeOnboarding();
        emit(OnboardingCompleted());
      } catch (e) {
        // Still emit completed to avoid blocking user
        emit(OnboardingCompleted());
      }
    });
    on<CheckOnboardingStatus>((event, emit) async {
      try {
        final onboardingCompleted = await onboardingRepository.checkOnboardingStatus();
        if (onboardingCompleted) {
          emit(OnboardingCompleted());
        } else {
          emit(OnboardingInitial());
        }
      } catch (e) {
        emit(OnboardingInitial());
      }
    });
    on<ResetOnboarding>((event, emit) async {
      try {
        await onboardingRepository.resetOnboarding();
        emit(OnboardingInitial());
      } catch (e) {
        // Handle reset error if needed
        emit(OnboardingInitial());
      }
    });
  }
}
