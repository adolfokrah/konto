import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/collaborators/data/repositories/collaborators_repository.dart';

part 'reminder_event.dart';
part 'reminder_state.dart';

class ReminderBloc extends Bloc<ReminderEvent, ReminderState> {
  final CollaboratorsRepository _collaboratorsRepository;

  ReminderBloc({required CollaboratorsRepository collaboratorsRepository})
    : _collaboratorsRepository = collaboratorsRepository,
      super(ReminderInitial()) {
    on<SendReminderToCollector>(_sendReminderToCollector);
  }
  Future<void> _sendReminderToCollector(
    SendReminderToCollector event,
    Emitter<ReminderState> emit,
  ) async {
    emit(ReminderInProgress());
    try {
      final result = await _collaboratorsRepository.sendReminderToCollector(
        jarId: event.jarId,
        collectorId: event.collectorId,
      );

      if (result['success'] == true) {
        emit(
          ReminderSuccess(
            message: result['message'] ?? 'Reminder sent successfully',
          ),
        );
      } else {
        emit(ReminderFailure(result['message'] ?? 'Failed to send reminder'));
      }
    } catch (e) {
      emit(ReminderFailure('Failed to send reminder: ${e.toString()}'));
    }
  }
}
