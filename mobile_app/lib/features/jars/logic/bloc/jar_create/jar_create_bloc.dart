import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
import 'package:meta/meta.dart';

part 'jar_create_event.dart';
part 'jar_create_state.dart';

class JarCreateBloc extends Bloc<JarCreateEvent, JarCreateState> {
  JarCreateBloc() : super(JarCreateInitial()) {
    on<JarCreateSubmitted>(_onJarCreateSubmitted);
  }

  Future<void> _onJarCreateSubmitted(
    JarCreateSubmitted event,
    Emitter<JarCreateState> emit,
  ) async {
    emit(JarCreateLoading());
    try {
      final serviceRegistry = ServiceRegistry();
      final jarRepository = serviceRegistry.jarRepository;

      // Call the createJar function from the repository
      final result = await jarRepository.createJar(
        name: event.name,
        description: event.description,
        jarGroupId: event.jarGroupId,
        imageId: event.imageId,
        isActive: event.isActive,
        isFixedContribution: event.isFixedContribution,
        acceptedContributionAmount: event.acceptedContributionAmount,
        goalAmount: event.goalAmount,
        deadline: event.deadline,
        currency: event.currency,
        acceptAnonymousContributions: event.acceptAnonymousContributions,
        acceptedPaymentMethods: event.acceptedPaymentMethods,
        invitedCollectors: event.invitedCollectors,
      );

      if (result['success'] == true) {
        emit(JarCreateSuccess(jarData: result['data']));
      } else {
        emit(JarCreateFailure(result['message'] ?? 'Failed to create jar'));
      }
    } catch (e) {
      emit(JarCreateFailure('An unexpected error occurred: ${e.toString()}'));
    }
  }
}
