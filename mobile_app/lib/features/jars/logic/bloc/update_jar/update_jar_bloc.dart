import 'package:bloc/bloc.dart';
import 'package:Hoga/core/services/service_registry.dart';
import 'package:meta/meta.dart';

part 'update_jar_event.dart';
part 'update_jar_state.dart';

class UpdateJarBloc extends Bloc<UpdateJarEvent, UpdateJarState> {
  UpdateJarBloc() : super(UpdateJarInitial()) {
    on<UpdateJarRequested>(_updateJarDynamic);
  }

  Future<void> _updateJarDynamic(
    UpdateJarRequested event,
    Emitter<UpdateJarState> emit,
  ) async {
    emit(UpdateJarInProgress());

    final serviceRegistry = ServiceRegistry();

    // Process invitedCollectors if present in updates
    List<Map<String, dynamic>>? processedCollectors;
    if (event.updates.containsKey('invitedCollectors')) {
      final collectors = event.updates['invitedCollectors'];
      if (collectors is List) {
        processedCollectors =
            collectors
                .map(
                  (collector) =>
                      collector is Map<String, dynamic>
                          ? collector
                          : collector.toJson(),
                )
                .cast<Map<String, dynamic>>()
                .toList();
      }
    }

    final response = await serviceRegistry.jarRepository.updateJar(
      jarId: event.jarId,
      name: event.updates['name'],
      description: event.updates['description'],
      jarGroup: event.updates['jarGroup'],
      imageId: event.updates['imageId'],
      isActive: event.updates['isActive'],
      isFixedContribution: event.updates['isFixedContribution'],
      acceptedContributionAmount: event.updates['acceptedContributionAmount'],
      goalAmount: event.updates['goalAmount'],
      deadline: event.updates['deadline'],
      currency: event.updates['currency'],
      status: event.updates['status'],
      invitedCollectors: processedCollectors,
      thankYouMessage: event.updates['thankYouMessage'],
      showGoal: event.updates['showGoal'],
      showRecentContributions: event.updates['showRecentContributions'],
      whoPaysPlatformFees: event.updates['whoPaysPlatformFees'],
    );
    if (response['success'] == true) {
      emit(UpdateJarSuccess());
    } else {
      emit(UpdateJarFailure(response['error'] ?? 'Unknown error'));
    }
  }
}
