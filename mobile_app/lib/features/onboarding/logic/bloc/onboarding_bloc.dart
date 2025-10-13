import 'package:bloc/bloc.dart';
import 'package:Hoga/core/services/service_registry.dart';
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
        await ServiceRegistry().walkthroughRepository.completeWalkthrough();
        emit(OnboardingCompleted());
      } catch (e) {
        // Still emit completed to avoid blocking user
        emit(OnboardingCompleted());
      }
    });
    on<CheckOnboardingStatus>((event, emit) async {
      try {
        print('🔄 OnboardingBloc: Checking onboarding status...');
        final onboardingCompleted =
            await ServiceRegistry().walkthroughRepository
                .checkWalkthroughStatus();
        print('🔄 OnboardingBloc: Onboarding completed: $onboardingCompleted');
        if (onboardingCompleted) {
          print('✅ OnboardingBloc: Emitting OnboardingCompleted');
          emit(OnboardingCompleted());
        } else {
          print('📱 OnboardingBloc: Emitting OnboardingPageState(0)');
          emit(OnboardingPageState(0)); // Start from first page
        }
      } catch (e) {
        print('❌ OnboardingBloc: Error checking status: $e');
        emit(OnboardingPageState(0)); // Start from first page on error
      }
    });
    on<ResetOnboarding>((event, emit) async {
      try {
        await ServiceRegistry().walkthroughRepository.resetWalkthrough();
        emit(OnboardingPageState(0)); // Start from first page
      } catch (e) {
        // Handle reset error if needed
        emit(OnboardingPageState(0)); // Start from first page
      }
    });
  }
}
