import 'package:bloc/bloc.dart';
import 'package:konto/core/services/service_registry.dart';
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
    print('UpdateJarBloc: Starting update for jar ${event.jarId}');
    print('UpdateJarBloc: Updates to apply: ${event.updates}');

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
      acceptAnonymousContributions:
          event.updates['acceptAnonymousContributions'],
      acceptedPaymentMethods:
          event.updates['acceptedPaymentMethods']?.cast<String>(),
      invitedCollectors: processedCollectors,
    );

    print('UpdateJarBloc: API response: $response');

    if (response['success'] == true) {
      print('UpdateJarBloc: Update successful');
      emit(UpdateJarSuccess());
    } else {
      print('UpdateJarBloc: Update failed - ${response['error']}');
      emit(UpdateJarFailure(response['error'] ?? 'Unknown error'));
    }
  }
}
