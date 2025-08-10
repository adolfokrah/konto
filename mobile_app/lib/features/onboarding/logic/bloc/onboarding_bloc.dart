import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'onboarding_event.dart';
part 'onboarding_state.dart';

class OnboardingBloc extends Bloc<OnboardingEvent, OnboardingState> {
  OnboardingBloc() : super(OnboardingPageState(0)) {
    on<PageChanged>((event, emit) {
      emit(OnboardingPageState(event.pageIndex));
    });
  }
}
