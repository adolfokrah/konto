import 'package:bloc/bloc.dart';
import 'package:Hoga/features/jars/data/repositories/jar_repository.dart';
import 'package:meta/meta.dart';

part 'update_jar_event.dart';
part 'update_jar_state.dart';

class UpdateJarBloc extends Bloc<UpdateJarEvent, UpdateJarState> {
  final JarRepository _jarRepository;

  UpdateJarBloc({required JarRepository jarRepository})
    : _jarRepository = jarRepository,
      super(UpdateJarInitial()) {
    on<UpdateJarRequested>(_updateJarDynamic);
    on<LeaveJarRequested>(_leaveJar);
  }

  Future<void> _leaveJar(
    LeaveJarRequested event,
    Emitter<UpdateJarState> emit,
  ) async {
    emit(UpdateJarInProgress());
    final response = await _jarRepository.leaveJar(jarId: event.jarId);
    if (response['success'] == true) {
      emit(LeaveJarSuccess());
    } else {
      emit(LeaveJarFailure(response['message'] ?? 'Failed to leave jar'));
    }
  }

  Future<void> _updateJarDynamic(
    UpdateJarRequested event,
    Emitter<UpdateJarState> emit,
  ) async {
    emit(UpdateJarInProgress());

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

    final response = await _jarRepository.updateJar(
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
      allowAnonymousContributions: event.updates['allowAnonymousContributions'],
      requiredApprovals: event.updates['requiredApprovals'],
    );
    if (response['success'] == true) {
      emit(UpdateJarSuccess());
    } else {
      emit(UpdateJarFailure(response['message'] ?? 'Failed to update jar'));
    }
  }
}
